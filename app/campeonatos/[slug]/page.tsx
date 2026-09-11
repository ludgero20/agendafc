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
    title: `Tabela do ${liga.nome} | Classificação Atualizada | Agenda FC`,
    description: `Tabela de classificação completa e pontuação atualizada do ${liga.nome} (${liga.subtitulo}).`,
  };
}

// 🌐 1. TABELA DA ESPN COM MULTI-URL (FAIL-SAFE VERCEL)
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

// 📦 2. MOTOR DE TABELA FOOTBALL-DATA / CACHE LOCAL
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

// 📦 3. MOTOR DE JOGOS (APENAS FOOTBALL-DATA / LIGAS COM ARQUIVO DEFINIDO)
async function getJogosLiga(liga: CompeticaoInfo): Promise<{ matches: JogoFutebol[]; currentMatchday: number } | null> {
  // Se for liga ESPN sem arquivo de matches configurado, não busca jogos
  if (liga.espnSlug && !liga.arquivoMatches) {
    return null;
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
    if (!liga.arquivoMatches) return null;
    const filePath = path.join(process.cwd(), "public", "api-cache", liga.arquivoMatches);
    const jsonData = await fs.readFile(filePath, "utf-8");
    const data = JSON.parse(jsonData);
    
    return {
      matches: data?.matches || [],
      currentMatchday: data?.season?.currentMatchday || data?.filters?.matchday || 1
    };
  } catch {
    return null;
  }
}

export default async function CampeonatoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const liga = ligasFutebolConfig[slug];

  if (!liga) notFound();

  const [tabela, jogosData] = await Promise.all([
    getTabelaLiga(liga),
    getJogosLiga(liga)
  ]);

  if (!tabela || tabela.length === 0) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-800 p-6 rounded-lg text-center max-w-xl mx-auto my-12">
        <h2 className="font-bold text-lg mb-2">Erro ao Carregar {liga.nome}</h2>
        <p>Não foi possível carregar a classificação no momento. Por favor, tente novamente mais tarde.</p>
      </div>
    );
  }

  const temJogos = Boolean(jogosData && jogosData.matches && jogosData.matches.length > 0);
  const matches = jogosData?.matches || [];
  const currentMatchday = jogosData?.currentMatchday || 1;
  const primeiroJogoNaoFinalizado = matches.find(j => j.status !== 'FINISHED');
  const rodadaInicial = primeiroJogoNaoFinalizado?.matchday || currentMatchday || 1;

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 py-6">
      <div className="text-center">
        <h1 className="text-4xl font-extrabold text-gray-900 flex items-center justify-center gap-3">
          <span>{liga.bandeiraEmoji}</span> {liga.nome}
        </h1>
        <p className="text-xl text-gray-600 mt-2">
          {liga.subtitulo} - {temJogos ? 'Classificação e Rodadas' : 'Classificação Oficial'}
        </p>
      </div>

      {temJogos ? (
        // LAYOUT COM 2 COLUNAS (TABELA + RODADAS)
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              🏆 Classificação
            </h2>
            <TabelaHtml tabela={tabela} />
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
      ) : (
        // LAYOUT LIMPO E CENTRALIZADO (APENAS CLASSIFICAÇÃO - SÉRIE B E NOVAS LIGAS)
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              🏆 Tabela de Classificação
            </h2>
            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
              Atualização Automática
            </span>
          </div>
          <TabelaHtml tabela={tabela} />
        </div>
      )}
    </div>
  );
}

function TabelaHtml({ tabela }: { tabela: Tabela }) {
  return (
    <div className="overflow-x-auto bg-white rounded-2xl shadow-sm border border-gray-200">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-3 py-3 text-left font-semibold text-gray-600 w-10">#</th>
            <th className="px-3 py-3 text-left font-semibold text-gray-600">Time</th>
            <th className="px-3 py-3 text-center font-semibold text-gray-600 w-12">P</th>
            <th className="px-3 py-3 text-center font-semibold text-gray-600 w-10">J</th>
            <th className="px-3 py-3 text-center font-semibold text-gray-600 w-10">V</th>
            <th className="px-3 py-3 text-center font-semibold text-gray-600 w-10">E</th>
            <th className="px-3 py-3 text-center font-semibold text-gray-600 w-10">D</th>
            <th className="px-3 py-3 text-center font-semibold text-gray-600 w-12">SG</th>
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
              <td className="px-3 py-3 text-center font-extrabold text-blue-600 bg-blue-50/40">{time.points}</td>
              <td className="px-3 py-3 text-center text-gray-700">{time.playedGames}</td>
              <td className="px-3 py-3 text-center text-gray-700">{time.won}</td>
              <td className="px-3 py-3 text-center text-gray-700">{time.draw}</td>
              <td className="px-3 py-3 text-center text-gray-700">{time.lost}</td>
              <td className="px-3 py-3 text-center font-medium text-gray-700">
                {time.goalDifference > 0 ? `+${time.goalDifference}` : time.goalDifference}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}