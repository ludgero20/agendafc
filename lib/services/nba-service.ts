// lib/services/nba-service.ts
import { TimeConfig } from '@/lib/times';

export type TimeNBA = {
  teamName: string;
  shortName: string;
  teamLogo: string;
  rank: string;
  conference: 'Leste' | 'Oeste';
  wins: number;
  losses: number;
  pct: string;
  streak: string;
};

export type JogoNBA = {
  id: string;
  dataStr: string;
  dataBR: string;
  hora: string;
  status: 'AGENDADO' | 'AO_VIVO' | 'ENCERRADO';
  tempoJogo: string;
  homeTeam: { name: string; shortName: string; logo: string; score: string | null };
  awayTeam: { name: string; shortName: string; logo: string; score: string | null };
};

const ESPN_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  Accept: 'application/json',
  Referer: 'https://www.espn.com/',
};

// 1. CLASSIFICAÇÃO DAS CONFERÊNCIAS LESTE E OESTE
export async function getTabelaNBA(): Promise<TimeNBA[]> {
  const urls = [
    'https://site.web.api.espn.com/apis/v2/sports/basketball/nba/standings?region=us&lang=en',
    'https://site.api.espn.com/apis/v2/sports/basketball/nba/standings?region=us&lang=en',
  ];

  for (const url of urls) {
    try {
      const res = await fetch(url, {
        headers: ESPN_HEADERS,
        next: { revalidate: 1800 },
      });

      if (!res.ok) continue;
      const data = await res.json();
      const todosTimes: TimeNBA[] = [];

      const extrair = (item: any) => {
        if (item.name && item.standings?.entries) {
          const ehLeste = item.name.toLowerCase().includes('eastern');
          const conferencia: 'Leste' | 'Oeste' = ehLeste ? 'Leste' : 'Oeste';

          item.standings.entries.forEach((e: any, idx: number) => {
            const nomeTime = e.team?.displayName || e.team?.name || 'Franquia';
            const shortName = e.team?.shortDisplayName || e.team?.abbreviation || nomeTime;
            const logo =
              e.team?.logos?.[0]?.href ||
              `https://a.espncdn.com/i/teamlogos/nba/500/${e.team?.abbreviation?.toLowerCase() || 'nba'}.png`;

            const v = e.stats?.find((s: any) => s.name === 'wins')?.value ?? 0;
            const d = e.stats?.find((s: any) => s.name === 'losses')?.value ?? 0;
            const pct = e.stats?.find((s: any) => s.name === 'winPercent')?.displayValue ?? '.000';
            const streak = e.stats?.find((s: any) => s.name === 'streak')?.displayValue ?? '-';

            todosTimes.push({
              teamName: nomeTime,
              shortName,
              teamLogo: logo,
              rank: String(idx + 1),
              conference: conferencia,
              wins: v,
              losses: d,
              pct: String(pct).startsWith('0') ? String(pct).substring(1) : String(pct),
              streak,
            });
          });
        }

        if (item.children && Array.isArray(item.children)) {
          item.children.forEach(extrair);
        }
      };

      if (data.children && data.children.length > 0) {
        data.children.forEach(extrair);
      }

      if (todosTimes.length >= 30) {
        return todosTimes;
      }
    } catch {}
  }

  return [];
}

// 2. JOGOS DA NBA NA JANELA DE 5 DIAS
export async function getJogosJanelaNBA(): Promise<Record<string, JogoNBA[]>> {
  const hoje = new Date();
  const offsets = [-2, -1, 0, 1, 2];

  const datasFormatadas = offsets.map((offset) => {
    const d = new Date(hoje);
    d.setDate(hoje.getDate() + offset);
    const ano = d.getFullYear();
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const dia = String(d.getDate()).padStart(2, '0');
    return `${ano}${mes}${dia}`;
  });

  const todosJogos: JogoNBA[] = [];

  const respostas = await Promise.all(
    datasFormatadas.map(async (dataStr) => {
      try {
        const res = await fetch(
          `https://site.web.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard?dates=${dataStr}`,
          { headers: ESPN_HEADERS, cache: 'no-store' }
        );
        if (!res.ok) return [];
        const data = await res.json();
        return data.events || [];
      } catch {
        return [];
      }
    })
  );

  respostas.flat().forEach((ev: any) => {
    const comp = ev.competitions?.[0];
    const competitors = comp?.competitors || [];

    const home = competitors.find((c: any) => c.homeAway === 'home') || competitors[0];
    const away = competitors.find((c: any) => c.homeAway === 'away') || competitors[1];

    const dataIso = ev.date;
    const dataObj = new Date(dataIso);

    const dataFormatadaIso = dataObj
      .toLocaleDateString('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      })
      .split('/')
      .reverse()
      .join('-');

    const dataBR = dataObj.toLocaleDateString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      day: '2-digit',
      month: '2-digit',
    });

    const horaFormatada = dataObj.toLocaleTimeString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      hour: '2-digit',
      minute: '2-digit',
    });

    const state = ev.status?.type?.state;
    let statusFormatado: 'AGENDADO' | 'AO_VIVO' | 'ENCERRADO' = 'AGENDADO';
    if (state === 'in') statusFormatado = 'AO_VIVO';
    if (state === 'post' || ev.status?.type?.completed) statusFormatado = 'ENCERRADO';

    const logoHome =
      home?.team?.logo ||
      home?.team?.logos?.[0]?.href ||
      `https://a.espncdn.com/i/teamlogos/nba/500/${home?.team?.abbreviation?.toLowerCase() || 'nba'}.png`;
    const logoAway =
      away?.team?.logo ||
      away?.team?.logos?.[0]?.href ||
      `https://a.espncdn.com/i/teamlogos/nba/500/${away?.team?.abbreviation?.toLowerCase() || 'nba'}.png`;

    todosJogos.push({
      id: ev.id,
      dataStr: dataFormatadaIso,
      dataBR,
      hora: horaFormatada,
      status: statusFormatado,
      tempoJogo: ev.status?.type?.shortDetail || '',
      homeTeam: {
        name: home?.team?.displayName || 'Casa',
        shortName: home?.team?.shortDisplayName || 'Casa',
        logo: logoHome,
        score: statusFormatado !== 'AGENDADO' ? String(home?.score || '0') : null,
      },
      awayTeam: {
        name: away?.team?.displayName || 'Visitante',
        shortName: away?.team?.shortDisplayName || 'Visitante',
        logo: logoAway,
        score: statusFormatado !== 'AGENDADO' ? String(away?.score || '0') : null,
      },
    });
  });

  const agrupadoPorData: Record<string, JogoNBA[]> = {};
  todosJogos.forEach((jogo) => {
    if (!agrupadoPorData[jogo.dataStr]) {
      agrupadoPorData[jogo.dataStr] = [];
    }
    agrupadoPorData[jogo.dataStr].push(jogo);
  });

  return agrupadoPorData;
}