// scripts/baixar-serie-b.mjs
import fs from 'fs/promises';
import path from 'path';

const ESPN_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  Accept: 'application/json',
  Referer: 'https://www.espn.com/',
};

function ehJogoInvalidoOuTBD(nome) {
  if (!nome) return true;
  const n = nome.toLowerCase().trim();
  return (
    n.includes('tbd') ||
    n.includes('to be determined') ||
    n === 'home' ||
    n === 'away' ||
    n === 'casa' ||
    n === 'visitante'
  );
}

async function baixarTemporadaSerieB() {
  console.log('🔄 Buscando calendário de datas da Série B na ESPN...');
  
  const resScoreboard = await fetch(
    'https://site.api.espn.com/apis/site/v2/sports/soccer/bra.2/scoreboard',
    { headers: ESPN_HEADERS }
  );

  if (!resScoreboard.ok) {
    console.error('❌ Erro ao acessar ESPN.');
    return;
  }

  const data = await resScoreboard.json();
  const calendarRaw = data.leagues?.[0]?.calendar || [];
  
  const datas = [];
  calendarRaw.forEach((item) => {
    if (typeof item === 'string') {
      const d = item.split('T')[0]?.replace(/-/g, '');
      if (d) datas.push(d);
    } else if (item?.entries) {
      item.entries.forEach((e) => {
        const d = (e.value || e.startDate || '')?.split('T')[0]?.replace(/-/g, '');
        if (d) datas.push(d);
      });
    }
  });

  const datasUnicas = Array.from(new Set(datas)).sort();
  console.log(`📅 Encontradas ${datasUnicas.length} datas no calendário. Baixando confrontos...`);

  const todosEventos = [];
  const eventosIds = new Set();

  for (let i = 0; i < datasUnicas.length; i += 6) {
    const lote = datasUnicas.slice(i, i + 6);
    const respostas = await Promise.all(
      lote.map(async (dataStr) => {
        try {
          const r = await fetch(
            `https://site.api.espn.com/apis/site/v2/sports/soccer/bra.2/scoreboard?dates=${dataStr}`,
            { headers: ESPN_HEADERS }
          );
          if (!r.ok) return [];
          const j = await r.json();
          return j.events || [];
        } catch {
          return [];
        }
      })
    );

    respostas.flat().forEach((ev) => {
      if (!eventosIds.has(ev.id)) {
        eventosIds.add(ev.id);
        todosEventos.push(ev);
      }
    });

    process.stdout.write(`⏳ Progresso: ${Math.min(i + 6, datasUnicas.length)}/${datasUnicas.length} datas processadas...\r`);
  }

  console.log(`\n🔍 Filtrando jogos reais (removendo TBD e jogos placeholders)...`);

  // 1. Filtra apenas confrontos de times reais e ordena cronologicamente
  const eventosValidos = todosEventos.filter((ev) => {
    const comp = ev.competitions?.[0];
    const competitors = comp?.competitors || [];
    const home = competitors.find((c) => c.homeAway === 'home') || competitors[0];
    const away = competitors.find((c) => c.homeAway === 'away') || competitors[1];

    const homeName = home?.team?.displayName || home?.team?.name || '';
    const awayName = away?.team?.displayName || away?.team?.name || '';

    // Descarta se qualquer um dos times for TBD ou vazio
    if (ehJogoInvalidoOuTBD(homeName) || ehJogoInvalidoOuTBD(awayName)) {
      return false;
    }

    return true;
  });

  console.log(`✅ Total de ${eventosValidos.length} partidas reais encontradas.`);

  eventosValidos.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // 2. Normaliza os objetos das partidas
  const partidasNormalizadas = eventosValidos.map((ev, idx) => {
    const comp = ev.competitions?.[0];
    const competitors = comp?.competitors || [];
    const home = competitors.find((c) => c.homeAway === 'home') || competitors[0];
    const away = competitors.find((c) => c.homeAway === 'away') || competitors[1];

    const state = ev.status?.type?.state;
    const statusFinal = state === 'post' ? 'FINISHED' : state === 'in' ? 'IN_PLAY' : 'SCHEDULED';

    const noteHeadline = comp?.notes?.[0]?.headline || ev.name || '';
    const matchdayMatch = noteHeadline.match(/(?:Matchday|Rodada|Jornada|Week)\s*(\d+)/i);
    const rodadaOficial = matchdayMatch ? parseInt(matchdayMatch[1], 10) : null;

    const homeName = home?.team?.displayName || home?.team?.name || 'Casa';
    const awayName = away?.team?.displayName || away?.team?.name || 'Visitante';

    const logoHome =
      home?.team?.logo ||
      home?.team?.logos?.[0]?.href ||
      'https://a.espncdn.com/combiner/i?img=/i/teamlogos/default-team-logo-500.png';

    const logoAway =
      away?.team?.logo ||
      away?.team?.logos?.[0]?.href ||
      'https://a.espncdn.com/combiner/i?img=/i/teamlogos/default-team-logo-500.png';

    return {
      id: parseInt(ev.id, 10) || idx + 1,
      utcDate: ev.date,
      status: statusFinal,
      rodadaOficial,
      homeTeamId: String(home?.team?.id || homeName),
      awayTeamId: String(away?.team?.id || awayName),
      homeTeam: {
        id: parseInt(home?.team?.id, 10) || 100 + idx,
        name: homeName,
        shortName: home?.team?.shortDisplayName || homeName,
        crest: logoHome,
      },
      awayTeam: {
        id: parseInt(away?.team?.id, 10) || 200 + idx,
        name: awayName,
        shortName: away?.team?.shortDisplayName || awayName,
        crest: logoAway,
      },
      score: {
        fullTime: {
          home: home?.score !== undefined && home?.score !== '' ? parseInt(home.score, 10) : null,
          away: away?.score !== undefined && away?.score !== '' ? parseInt(away.score, 10) : null,
        },
      },
    };
  });

  // 3. ALGORITMO ROUND-ROBIN: Aloca exatamente 10 jogos por rodada sem repetir times
  const TOTAL_RODADAS = 38;
  const JOGOS_POR_RODADA = 10;
  
  const rodadas = Array.from({ length: TOTAL_RODADAS }, () => ({
    timesPresentes: new Set(),
    matches: [],
  }));

  partidasNormalizadas.forEach((partida) => {
    const tHome = partida.homeTeamId;
    const tAway = partida.awayTeamId;

    if (
      partida.rodadaOficial &&
      partida.rodadaOficial >= 1 &&
      partida.rodadaOficial <= TOTAL_RODADAS
    ) {
      const slot = rodadas[partida.rodadaOficial - 1];
      if (
        slot.matches.length < JOGOS_POR_RODADA &&
        !slot.timesPresentes.has(tHome) &&
        !slot.timesPresentes.has(tAway)
      ) {
        slot.timesPresentes.add(tHome);
        slot.timesPresentes.add(tAway);
        slot.matches.push({ ...partida, matchday: partida.rodadaOficial });
        return;
      }
    }

    let alocado = false;
    for (let r = 0; r < TOTAL_RODADAS; r++) {
      const slot = rodadas[r];
      if (
        slot.matches.length < JOGOS_POR_RODADA &&
        !slot.timesPresentes.has(tHome) &&
        !slot.timesPresentes.has(tAway)
      ) {
        slot.timesPresentes.add(tHome);
        slot.timesPresentes.add(tAway);
        slot.matches.push({ ...partida, matchday: r + 1 });
        alocado = true;
        break;
      }
    }

    if (!alocado) {
      const ultimaRodada = rodadas[TOTAL_RODADAS - 1];
      if (ultimaRodada.matches.length < JOGOS_POR_RODADA) {
        ultimaRodada.matches.push({ ...partida, matchday: TOTAL_RODADAS });
      }
    }
  });

  // 4. Monta a lista final limpa
  const matchesFinal = [];
  rodadas.forEach((rodadaSlot) => {
    rodadaSlot.matches.sort(
      (a, b) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime()
    );
    rodadaSlot.matches.forEach((m) => {
      const { rodadaOficial, homeTeamId, awayTeamId, ...matchLimpo } = m;
      matchesFinal.push(matchLimpo);
    });
  });

  const outputDir = path.join(process.cwd(), 'public', 'api-cache');
  await fs.mkdir(outputDir, { recursive: true });
  
  const outputPath = path.join(outputDir, 'serie-b-matches.json');
  await fs.writeFile(
    outputPath,
    JSON.stringify({ matches: matchesFinal, season: { currentMatchday: 27 } }, null, 2)
  );

  console.log(`🎉 Sucesso! 38 rodadas limpas salvas em: public/api-cache/serie-b-matches.json`);
}

baixarTemporadaSerieB();