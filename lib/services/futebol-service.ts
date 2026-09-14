// lib/services/futebol-service.ts
import fs from 'fs/promises';
import path from 'path';
import { CompeticaoInfo } from '@/lib/campeonatos';
import { JogoFutebol } from '@/app/components/RodadaFutebolClient';
import { EtapaCopa, ConfrontoCopa } from '@/app/components/CopaMataMataClient';
import { formatarNomeTime } from '@/lib/times';

export type TimeTabelaFutebol = {
  position: number;
  team: { id: number; name: string; shortName: string; crest: string };
  points: number;
  playedGames: number;
  won: number;
  draw: number;
  lost: number;
  goalDifference: number;
  groupName?: string;
};

const ESPN_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  Accept: 'application/json',
  Referer: 'https://www.espn.com/',
};

// 🌐 1. TABELA DA ESPN (COM GRUPOS E FASE DE LIGA)
export async function getTabelaFutebolESPN(espnSlug: string): Promise<TimeTabelaFutebol[] | null> {
  const urls = [
    `https://site.web.api.espn.com/apis/v2/sports/soccer/${espnSlug}/standings?region=br&lang=pt`,
    `https://site.api.espn.com/apis/v2/sports/soccer/${espnSlug}/standings`,
  ];

  for (const url of urls) {
    try {
      const res = await fetch(url, {
        headers: ESPN_HEADERS,
        next: { revalidate: 3600 },
      });

      if (!res.ok) continue;
      const data = await res.json();
      const todosTimes: TimeTabelaFutebol[] = [];

      const extrairStats = (stats: any[]) => {
        const getStat = (name: string) =>
          stats?.find((s: any) => s.name === name || s.type === name)?.value ?? 0;

        return {
          points: getStat('points'),
          playedGames: getStat('gamesPlayed'),
          won: getStat('wins'),
          draw: getStat('ties'),
          lost: getStat('losses'),
          goalDifference: getStat('pointDifferential'),
        };
      };

      const extrairDeEstrutura = (item: any, nomeGrupo?: string) => {
        const grupoAtual = item.name && item.standings?.entries ? item.name : nomeGrupo;

        if (item.standings?.entries && Array.isArray(item.standings.entries)) {
          item.standings.entries.forEach((entry: any, index: number) => {
            const stats = extrairStats(entry.stats);
            const teamId = parseInt(entry.team?.id, 10) || index + 1;
            const nomeOficial = entry.team?.displayName || entry.team?.name || 'Time';
            const shortName = entry.team?.shortDisplayName || entry.team?.name || nomeOficial;
            const crest =
              entry.team?.logos?.[0]?.href ||
              'https://a.espncdn.com/combiner/i?img=/i/teamlogos/default-team-logo-500.png';

            todosTimes.push({
              position: index + 1,
              team: {
                id: teamId,
                name: nomeOficial,
                shortName,
                crest,
              },
              groupName: grupoAtual,
              ...stats,
            });
          });
        }

        if (item.children && Array.isArray(item.children)) {
          item.children.forEach((c: any) => extrairDeEstrutura(c, grupoAtual));
        }
      };

      extrairDeEstrutura(data);

      if (todosTimes.length > 0) {
        return todosTimes;
      }
    } catch {
      console.error(`Tentando próxima URL de tabela ESPN (${espnSlug})...`);
    }
  }

  return null;
}

// 📦 2. TABELA GERAL (FOOTBALL-DATA OU ESPN)
export async function getTabelaFutebol(liga: CompeticaoInfo): Promise<TimeTabelaFutebol[] | null> {
  if (liga.espnSlug) {
    return getTabelaFutebolESPN(liga.espnSlug);
  }

  try {
    if (process.env.API_FOOTBALLDATA_KEY && liga.codigoAPI) {
      const res = await fetch(`https://api.football-data.org/v4/competitions/${liga.codigoAPI}/standings`, {
        headers: { 'X-Auth-Token': process.env.API_FOOTBALLDATA_KEY },
        next: { revalidate: 3600 },
      });
      if (res.ok) {
        const data = await res.json();
        const table = data?.standings?.[0]?.table;
        if (table && table.length > 0) return table;
      }
    }
  } catch {}

  try {
    const filePath = path.join(process.cwd(), 'public', 'api-cache', liga.arquivoStandings || '');
    const jsonData = await fs.readFile(filePath, 'utf-8');
    const data = JSON.parse(jsonData);
    return data?.standings?.[0]?.table || null;
  } catch {
    return null;
  }
}

// 📦 3. JOGOS DA LIGA (FOOTBALL-DATA)
export async function getJogosFutebolLiga(
  liga: CompeticaoInfo
): Promise<{ matches: JogoFutebol[]; currentMatchday: number } | null> {
  if (liga.espnSlug && !liga.arquivoMatches) {
    return null;
  }

  try {
    if (process.env.API_FOOTBALLDATA_KEY && liga.codigoAPI) {
      const res = await fetch(`https://api.football-data.org/v4/competitions/${liga.codigoAPI}/matches`, {
        headers: { 'X-Auth-Token': process.env.API_FOOTBALLDATA_KEY },
        next: { revalidate: 3600 },
      });
      if (res.ok) {
        const data = await res.json();
        return {
          matches: data?.matches || [],
          currentMatchday: data?.season?.currentMatchday || data?.filters?.matchday || 1,
        };
      }
    }
  } catch {}

  try {
    if (!liga.arquivoMatches) return null;
    const filePath = path.join(process.cwd(), 'public', 'api-cache', liga.arquivoMatches);
    const jsonData = await fs.readFile(filePath, 'utf-8');
    const data = JSON.parse(jsonData);

    return {
      matches: data?.matches || [],
      currentMatchday: data?.season?.currentMatchday || data?.filters?.matchday || 1,
    };
  } catch {
    return null;
  }
}

// 🇧🇷 TRADUTOR OFICIAL DE AGREGADOS DA ESPN
export function traduzirNotaAgregado(nota: string): string {
  if (!nota) return '';
  let t = nota;

  t = t.replace(/1st Leg/gi, 'Jogo de Ida');
  t = t.replace(/2nd Leg/gi, 'Jogo de Volta');
  t = t.replace(/Tied on aggregate/gi, 'Empate no agregado');
  t = t.replace(/lead (.*?) on aggregate/gi, 'lidera por $1 no agregado');
  t = t.replace(/win (.*?) on aggregate/gi, 'venceu por $1 no agregado');
  t = t.replace(/advance (.*?) on penalties/gi, 'avançou nos pênaltis ($1)');

  return t.trim();
}

// 🏆 4. MATA-MATA (COPA DO BRASIL, LIBERTADORES E SUL-AMERICANA)
export async function getFasesMataMata(
  espnSlug: string,
  arquivoCache: string,
  fasesConfig: Record<string, string>
): Promise<{ etapas: EtapaCopa[]; etapaAtivaSlug: string }> {
  const processarEventos = (eventos: any[]) => {
    const grupos: Record<string, ConfrontoCopa[]> = {};
    Object.keys(fasesConfig).forEach((k) => {
      grupos[k] = [];
    });

    eventos.forEach((ev: any) => {
      const slugFase = ev.season?.slug || '';
      if (!fasesConfig[slugFase]) return;

      const comp = ev.competitions?.[0];
      const competitors = comp?.competitors || [];
      const home = competitors.find((c: any) => c.homeAway === 'home') || competitors[0];
      const away = competitors.find((c: any) => c.homeAway === 'away') || competitors[1];

      const homeName = formatarNomeTime(home?.team?.shortDisplayName, home?.team?.displayName || 'Casa');
      const awayName = formatarNomeTime(away?.team?.shortDisplayName, away?.team?.displayName || 'Visitante');

      if (homeName.toLowerCase().includes('tbd') || awayName.toLowerCase().includes('tbd')) return;

      const dataObj = new Date(ev.date);
      const dataBR = dataObj.toLocaleDateString('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        day: '2-digit',
        month: '2-digit',
      });
      const horaBR = dataObj.toLocaleTimeString('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        hour: '2-digit',
        minute: '2-digit',
      });

      const finalizado = Boolean(ev.status?.type?.completed || ev.status?.type?.state === 'post');
      const aoVivo = ev.status?.type?.state === 'in';
      const notaRaw = comp?.notes?.[0]?.headline || '';

      grupos[slugFase].push({
        id: ev.id,
        data: dataBR,
        hora: horaBR,
        timeCasa: homeName,
        timeVisitante: awayName,
        escudoCasa:
          home?.team?.logo ||
          home?.team?.logos?.[0]?.href ||
          'https://a.espncdn.com/combiner/i?img=/i/teamlogos/default-team-logo-500.png',
        escudoVisitante:
          away?.team?.logo ||
          away?.team?.logos?.[0]?.href ||
          'https://a.espncdn.com/combiner/i?img=/i/teamlogos/default-team-logo-500.png',
        placarCasa: finalizado || aoVivo ? String(home?.score ?? '0') : null,
        placarVisitante: finalizado || aoVivo ? String(away?.score ?? '0') : null,
        faseSlug: slugFase,
        faseTitulo: fasesConfig[slugFase],
        notaAgregado: traduzirNotaAgregado(notaRaw),
        status: finalizado ? 'Finalizado' : aoVivo ? 'Ao Vivo' : 'Agendado',
      });
    });

    const etapas: EtapaCopa[] = Object.keys(fasesConfig)
      .map((slug) => ({
        slug,
        titulo: fasesConfig[slug],
        jogos: grupos[slug] || [],
      }))
      .filter((e) => e.jogos.length > 0);

    let etapaAtiva = 'quarterfinals';
    if (!etapas.some((e) => e.slug === etapaAtiva) && etapas.length > 0) {
      etapaAtiva = etapas[etapas.length - 1].slug;
    }

    return { etapas, etapaAtivaSlug: etapaAtiva };
  };

  const urls = [
    `https://site.web.api.espn.com/apis/site/v2/sports/soccer/${espnSlug}/scoreboard?dates=2026&limit=250`,
    `https://site.api.espn.com/apis/site/v2/sports/soccer/${espnSlug}/scoreboard?dates=2026&limit=250`,
  ];

  for (const url of urls) {
    try {
      const res = await fetch(url, { headers: ESPN_HEADERS, cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        const eventos = data.events || [];
        if (eventos.length > 0) {
          const resultado = processarEventos(eventos);
          if (resultado.etapas.length > 0) return resultado;
        }
      }
    } catch {}
  }

  try {
    const filePath = path.join(process.cwd(), 'public', 'api-cache', arquivoCache);
    const jsonData = await fs.readFile(filePath, 'utf-8');
    const eventosLocais = JSON.parse(jsonData).events || [];
    return processarEventos(eventosLocais);
  } catch {}

  return { etapas: [], etapaAtivaSlug: '' };
}
// ⚽ 5. BUSCA OS ÚLTIMOS E PRÓXIMOS JOGOS DE UM CLUBE ESPECÍFICO
export async function getJogosFutebolDoTime(time: any) {
  let todosJogosRaw: any[] = [];

  // 1. Tenta buscar jogos ao vivo da liga
  if (process.env.API_FOOTBALLDATA_KEY && time.competicaoCodigo) {
    try {
      const res = await fetch(`https://api.football-data.org/v4/competitions/${time.competicaoCodigo}/matches`, {
        headers: { 'X-Auth-Token': process.env.API_FOOTBALLDATA_KEY },
        next: { revalidate: 1800 },
      });
      if (res.ok) {
        const data = await res.json();
        todosJogosRaw = data?.matches || [];
      }
    } catch {}
  }

  // 2. Fallback no cache local
  if (todosJogosRaw.length === 0 && time.arquivoMatches) {
    try {
      const filePath = path.join(process.cwd(), 'public', 'api-cache', time.arquivoMatches);
      const jsonData = await fs.readFile(filePath, 'utf-8');
      todosJogosRaw = JSON.parse(jsonData)?.matches || [];
    } catch {}
  }

  const formatarDataBR = (dataISO: string) =>
    new Date(dataISO).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Sao_Paulo',
    }).replace(',', ' às');

  // Filtra apenas os jogos do clube
  const jogosDoTime = todosJogosRaw.filter(
    (m) => m.homeTeam?.id === time.idAPI || m.awayTeam?.id === time.idAPI
  );

  const finalizados = jogosDoTime
    .filter((m) => m.status === 'FINISHED')
    .sort((a, b) => new Date(b.utcDate).getTime() - new Date(a.utcDate).getTime())
    .slice(0, 3)
    .map((m) => ({
      id: m.id,
      dateStr: formatarDataBR(m.utcDate),
      status: m.status,
      roundLabel: `Rodada ${m.matchday}`,
      homeTeam: { id: m.homeTeam.id, name: m.homeTeam.name, shortName: m.homeTeam.shortName, crest: m.homeTeam.crest },
      awayTeam: { id: m.awayTeam.id, name: m.awayTeam.name, shortName: m.awayTeam.shortName, crest: m.awayTeam.crest },
      homeScore: m.score?.fullTime?.home ?? null,
      awayScore: m.score?.fullTime?.away ?? null,
    }));

  const proximos = jogosDoTime
    .filter((m) => m.status !== 'FINISHED')
    .sort((a, b) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime())
    .slice(0, 5)
    .map((m) => ({
      id: m.id,
      dateStr: formatarDataBR(m.utcDate),
      status: m.status,
      roundLabel: `Rodada ${m.matchday}`,
      homeTeam: { id: m.homeTeam.id, name: m.homeTeam.name, shortName: m.homeTeam.shortName, crest: m.homeTeam.crest },
      awayTeam: { id: m.awayTeam.id, name: m.awayTeam.name, shortName: m.awayTeam.shortName, crest: m.awayTeam.crest },
      homeScore: m.score?.fullTime?.home ?? null,
      awayScore: m.score?.fullTime?.away ?? null,
    }));

  return { finalizados, proximos };
}
export type ArtilheiroFutebol = {
  posicao: number;
  jogadorNome: string;
  timeNome: string;
  timeEscudo: string;
  gols: number;
};

// ⚽ 6. BUSCA O TOP 10 DE ARTILHEIROS DA LIGA
export async function getArtilhariaFutebol(compCode: string): Promise<ArtilheiroFutebol[]> {
  if (!process.env.API_FOOTBALLDATA_KEY || !compCode) return [];

  try {
    const res = await fetch(`https://api.football-data.org/v4/competitions/${compCode}/scorers?limit=10`, {
      headers: { 'X-Auth-Token': process.env.API_FOOTBALLDATA_KEY },
      next: { revalidate: 3600 }
    });

    if (!res.ok) return [];
    const data = await res.json();
    const scorers = data.scorers || [];

    return scorers.map((s: any, idx: number): ArtilheiroFutebol => ({
      posicao: idx + 1,
      jogadorNome: s.player?.name || 'Jogador',
      timeNome: formatarNomeTime(s.team?.shortName, s.team?.name),
      timeEscudo: s.team?.crest || '',
      gols: s.goals ?? 0
    }));
  } catch (error) {
    console.error(`Erro ao buscar artilharia da liga (${compCode}):`, error);
    return [];
  }
}