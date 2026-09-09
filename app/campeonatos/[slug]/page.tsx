// app/campeonatos/[slug]/page.tsx
import type { Metadata } from 'next';
import fs from 'fs/promises';
import path from 'path';
import { notFound } from 'next/navigation';
import RodadaFutebolClient, { JogoFutebol } from '@/app/components/RodadaFutebolClient';
import { ligasFutebolConfig, CompeticaoInfo } from '@/lib/campeonatos';
import { formatarNomeTime } from '@/lib/times';

export const revalidate = 3600;

type TimeTabela = {
  position: number;
  team: { id: number; name: string; shortName: string; crest: string; };
  points: number;
  playedGames: number;
  won: number;
  draw: number;
  lost: number;
  goalDifference: number;
};

type Tabela = TimeTabela[];

const ESPN_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  Accept: 'application/json',
  Referer: 'https://www.espn.com/',
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const liga = ligasFutebolConfig[slug];
  if (!liga) return { title: "Campeonato não encontrado | Agenda FC" };

  return {
    title: `Tabela e Jogos do ${liga.nome} | Classificação e Rodadas | Agenda FC`,
    description: `Tabela de classificação completa, placares e calendário de todas as rodadas do ${liga.nome} (${liga.subtitulo}).`,
  };
}

// 🌐 1. TABELA DA ESPN COM MULTI-URL (FAIL-SAFE PARA VERCEL)
async function getTabelaESPN(espnSlug: string): Promise<Tabela | null> {
  const urls = [
    `https://site.web.api.espn.com/apis/v2/sports/soccer/${espnSlug}/standings?region=br&lang=pt`,
    `https://site.api.espn.com/apis/v2/sports/soccer/${espnSlug}/standings`
  ];

  for (const url of urls) {
    try {
      const res = await fetch(url, {
        headers: ESPN_HEADERS,
        next: { revalidate: 3600 }
      });

      if (!res.ok) continue;
      const data = await res.json();

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

      const entries = data.children?.[0]?.standings?.entries || data.standings?.entries || [];
      if (entries.length === 0) continue;

      return entries.map((entry: any, index: number): TimeTabela => {
        const stats = extrairStats(entry.stats);
        const teamId = parseInt(entry.team?.id, 10) || (index + 1);
        const nomeOficial = entry.team?.displayName || entry.team?.name || 'Time';
        const shortName = entry.team?.shortDisplayName || entry.team?.name || nomeOficial;
        const crest = entry.team?.logos?.[0]?.href || 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/default-team-logo-500.png';

        return {
          position: index + 1,
          team: {
            id: teamId,
            name: nomeOficial,
            shortName: shortName,
            crest: crest
          },
          ...stats
        };
      });
    } catch (e) {
      console.error(`Tentando próxima URL de tabela ESPN (${espnSlug})...`);
    }
  }

  return null;
}

// 🌐 2. JOGOS DA ESPN COM MULTI-URL E LIVE OVERLAY
async function getJogosHibridoESPN(
  liga: CompeticaoInfo,
  rodadaBase: number = 1
): Promise<{ matches: JogoFutebol[]; currentMatchday: number } | null> {
  let matchesLocais: JogoFutebol[] = [];

  // 1. Tenta ler o arquivo local em cache (se estiver no servidor da Vercel)
  try {
    const filePath = path.join(process.cwd(), "public", "api-cache", liga.arquivoMatches || '');
    const jsonData = await fs.readFile(filePath, "utf-8");
    const data = JSON.parse(jsonData);
    matchesLocais = data?.matches || [];
  } catch {
    // Se o arquivo não existir na Vercel, o código continua sem travar
  }

  // 2. Busca placares ao vivo na ESPN com multi-URL
  let eventosAoVivo: any[] = [];
  const urlsScoreboard = [
    `https://site.web.api.espn.com/apis/site/v2/sports/soccer/${liga.espnSlug}/scoreboard`,
    `https://site.api.espn.com/apis/site/v2/sports/soccer/${liga.espnSlug}/scoreboard`
  ];

  for (const url of urlsScoreboard) {
    try {
      const res = await fetch(url, {
        headers: ESPN_HEADERS,
        cache: 'no-store'
      });

      if (res.ok) {
        const data = await res.json();
        eventosAoVivo = data.events || [];
        if (eventosAoVivo.length > 0) break;
      }
    } catch {}
  }

  // 3. Se houver partidas locais, faz a mesclagem (Live Overlay)
  if (matchesLocais.length > 0) {
    eventosAoVivo.forEach((ev: any) => {
      const comp = ev.competitions?.[0];
      const competitors = comp?.competitors || [];
      const home = competitors.find((c: any) => c.homeAway === 'home') || competitors[0];
      const away = competitors.find((c: any) => c.homeAway === 'away') || competitors[1];

      const homeName = (home?.team?.displayName || home?.team?.name || '').toLowerCase();
      const awayName = (away?.team?.displayName || away?.team?.name || '').toLowerCase();

      const state = ev.status?.type?.state;
      const statusFinal = state === 'post' ? 'FINISHED' : state === 'in' ? 'IN_PLAY' : 'SCHEDULED';
      const homeScore = home?.score !== undefined && home?.score !== '' ? parseInt(home.score, 10) : null;
      const awayScore = away?.score !== undefined && away?.score !== '' ? parseInt(away.score, 10) : null;

      const jogoCorrespondente = matchesLocais.find((m) => {
        const mHome = (m.homeTeam.name || m.homeTeam.shortName).toLowerCase();
        const mAway = (m.awayTeam.name || m.awayTeam.shortName).toLowerCase();
        return (
          (mHome.includes(homeName) || homeName.includes(mHome)) &&
          (mAway.includes(awayName) || awayName.includes(mAway))
        );
      });

      if (jogoCorrespondente) {
        jogoCorrespondente.status = statusFinal;
        jogoCorrespondente.score.fullTime = { home: homeScore, away: awayScore };
      }
    });

    return {
      matches: matchesLocais,
      currentMatchday: rodadaBase
    };
  }

  // 4. FALLBACK DE SEGURANÇA: Se o arquivo local faltar na Vercel, entrega os jogos ao vivo da ESPN
  if (eventosAoVivo.length > 0) {
    const matchesFallback: JogoFutebol[] = eventosAoVivo.map((ev: any, idx: number) => {
      const comp = ev.competitions?.[0];
      const competitors = comp?.competitors || [];
      const home = competitors.find((c: any) => c.homeAway === 'home') || competitors[0];
      const away = competitors.find((c: any) => c.homeAway === 'away') || competitors[1];

      const state = ev.status?.type?.state;
      const statusFinal = state === 'post' ? 'FINISHED' : state === 'in' ? 'IN_PLAY' : 'SCHEDULED';

      return {
        id: parseInt(ev.id, 10) || idx + 1,
        utcDate: ev.date,
        status: statusFinal,
        matchday: rodadaBase,
        homeTeam: {
          id: parseInt(home?.team?.id, 10) || 100 + idx,
          name: home?.team?.displayName || home?.team?.name || 'Casa',
          shortName: home?.team?.shortDisplayName || home?.team?.name || 'Casa',
          crest: home?.team?.logo || home?.team?.logos?.[0]?.href || 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/default-team-logo-500.png',
        },
        awayTeam: {
          id: parseInt(away?.team?.id, 10) || 200 + idx,
          name: away?.team?.displayName || away?.team?.name || 'Visitante',
          shortName: away?.team?.shortDisplayName || away?.team?.name || 'Visitante',
          crest: away?.team?.logo || away?.team?.logos?.[0]?.href || 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/default-team-logo-500.png',
        },
        score: {
          fullTime: {
            home: home?.score !== undefined && home?.score !== '' ? parseInt(home.score, 10) : null,
            away: away?.score !== undefined && away?.score !== '' ? parseInt(away.score, 10) : null,
          }
        }
      };
    });

    return {
      matches: matchesFallback,
      currentMatchday: rodadaBase
    };
  }

  return null;
}

// 📦 3. MOTOR FOOTBALL-DATA / CACHE LOCAL PADRÃO
async function getTabelaLiga(liga: CompeticaoInfo): Promise<Tabela | null> {
  if (liga.espnSlug) {
    return getTabelaESPN(liga.espnSlug);
  }

  try {
    if (process.env.API_FOOTBALLDATA_KEY && liga.codigoAPI) {
      const res = await fetch(`https://api.football-data.org/v4/competitions/${liga.codigoAPI}/standings`, {
        headers: { 'X-Auth-Token': process.env.API_FOOTBALLDATA_KEY },
        next: { revalidate: 3600 }
      });
      if (res.ok) {
        const data = await res.json();
        const table = data?.standings?.[0]?.table;
        if (table && table.length > 0) return table;
      }
    }
  } catch (e) {}

  try {
    const filePath = path.join(process.cwd(), "public", "api-cache", liga.arquivoStandings || '');
    const jsonData = await fs.readFile(filePath, "utf-8");
    const data = JSON.parse(jsonData);
    return data?.standings?.[0]?.table || null;
  } catch (error) {
    console.error(`ERRO AO LER tabela de ${liga.nome}:`, error);
    return null;
  }
}

async function getJogosLiga(
  liga: CompeticaoInfo,
  rodadaBase: number = 1
): Promise<{ matches: JogoFutebol[]; currentMatchday: number } | null> {
  if (liga.espnSlug) {
    return getJogosHibridoESPN(liga, rodadaBase);
  }

  try {
    if (process.env.API_FOOTBALLDATA_KEY && liga.codigoAPI) {
      const res = await fetch(`https://api.football-data.org/v4/competitions/${liga.codigoAPI}/matches`, {
        headers: { 'X-Auth-Token': process.env.API_FOOTBALLDATA_KEY },
        next: { revalidate: 3600 }
      });
      if (res.ok) {
        const data = await res.json();
        return {
          matches: data?.matches || [],
          currentMatchday: data?.season?.currentMatchday || data?.filters?.matchday || 1
        };
      }
    }
  } catch (e) {}

  try {
    const filePath = path.join(process.cwd(), "public", "api-cache", liga.arquivoMatches || '');
    const jsonData = await fs.readFile(filePath, "utf-8");
    const data = JSON.parse(jsonData);
    
    return {
      matches: data?.matches || [],
      currentMatchday: data?.season?.currentMatchday || data?.filters?.matchday || 1
    };
  } catch (error) {
    console.error(`ERRO AO LER jogos de ${liga.nome}:`, error);
    return null;
  }
}

export default async function CampeonatoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const liga = ligasFutebolConfig[slug];

  if (!liga) notFound();

  const tabela = await getTabelaLiga(liga);

  let rodadaCalculada = 1;
  if (tabela && tabela.length > 0) {
    const maxJogos = Math.max(...tabela.map(t => t.playedGames || 0));
    rodadaCalculada = maxJogos > 0 ? maxJogos + 1 : 1;
  }

  const jogosData = await getJogosLiga(liga, rodadaCalculada);

  if (!tabela || !jogosData) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-800 p-6 rounded-lg text-center max-w-xl mx-auto my-12">
        <h2 className="font-bold text-lg mb-2">Erro ao Carregar {liga.nome}</h2>
        <p>Não foi possível carregar os dados no momento. Por favor, tente novamente mais tarde.</p>
      </div>
    );
  }

  const { matches, currentMatchday } = jogosData;

  const primeiroJogoNaoFinalizado = matches.find(j => j.status !== 'FINISHED');
  const rodadaInicial = primeiroJogoNaoFinalizado?.matchday || currentMatchday || rodadaCalculada || 1;

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 py-6">
      <div className="text-center">
        <h1 className="text-4xl font-extrabold text-gray-900 flex items-center justify-center gap-3">
          <span>{liga.bandeiraEmoji}</span> {liga.nome}
        </h1>
        <p className="text-xl text-gray-600 mt-2">{liga.subtitulo} - Classificação e Rodadas</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            🏆 Classificação
          </h2>
          <div className="overflow-x-auto bg-white rounded-2xl shadow-sm border border-gray-200">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-3 py-3 text-left font-semibold text-gray-600">#</th>
                  <th className="px-3 py-3 text-left font-semibold text-gray-600">Time</th>
                  <th className="px-3 py-3 text-center font-semibold text-gray-600">P</th>
                  <th className="px-3 py-3 text-center font-semibold text-gray-600">J</th>
                  <th className="px-3 py-3 text-center font-semibold text-gray-600">V</th>
                  <th className="px-3 py-3 text-center font-semibold text-gray-600">E</th>
                  <th className="px-3 py-3 text-center font-semibold text-gray-600">D</th>
                  <th className="px-3 py-3 text-center font-semibold text-gray-600">SG</th>
                </tr>
              </thead>
              <tbody>
                {tabela.map((time: TimeTabela) => (
                  <tr key={time.team.id} className="border-t hover:bg-gray-50 transition-colors">
                    <td className="px-3 py-3 font-bold text-gray-700">{time.position}</td>
                    <td className="px-3 py-3 flex items-center gap-2">
                      <img src={time.team.crest} alt={time.team.name} className="w-5 h-5 object-contain" />
                      <span className="font-medium text-gray-900">
                        {formatarNomeTime(time.team.shortName, time.team.name)}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center font-extrabold text-blue-600">{time.points}</td>
                    <td className="px-3 py-3 text-center">{time.playedGames}</td>
                    <td className="px-3 py-3 text-center">{time.won}</td>
                    <td className="px-3 py-3 text-center">{time.draw}</td>
                    <td className="px-3 py-3 text-center">{time.lost}</td>
                    <td className="px-3 py-3 text-center font-medium">{time.goalDifference}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            ⚽ Jogos da Rodada
          </h2>
          <RodadaFutebolClient 
            todosOsJogos={matches} 
            rodadaInicial={rodadaInicial} 
            tituloPrefixo="Rodada"
          />
        </div>
      </div>
    </div>
  );
}