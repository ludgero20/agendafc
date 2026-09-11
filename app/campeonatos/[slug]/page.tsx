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
  groupName?: string;
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
    title: `Tabela do ${liga.nome} | Classificação Oficial | Agenda FC`,
    description: `Tabela de classificação completa e pontuação atualizada do ${liga.nome} (${liga.subtitulo}).`,
  };
}

// 🌐 1. TABELA DA ESPN (COM SUPORTE A FASE DE LIGA E GRUPOS)
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
      const todosTimes: TimeTabela[] = [];

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
            const teamId = parseInt(entry.team?.id, 10) || (index + 1);
            const nomeOficial = entry.team?.displayName || entry.team?.name || 'Time';
            const shortName = entry.team?.shortDisplayName || entry.team?.name || nomeOficial;
            const crest = entry.team?.logos?.[0]?.href || entry.team?.logo || 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/default-team-logo-500.png';

            todosTimes.push({
              position: index + 1,
              team: {
                id: teamId,
                name: nomeOficial,
                shortName: shortName,
                crest: crest
              },
              groupName: grupoAtual,
              ...stats
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
    } catch (e) {
      console.error(`Tentando próxima URL de tabela ESPN (${espnSlug})...`);
    }
  }

  return null;
}

// 📦 2. MOTOR FOOTBALL-DATA / CACHE LOCAL
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

// 📦 3. MOTOR DE JOGOS
async function getJogosLiga(liga: CompeticaoInfo): Promise<{ matches: JogoFutebol[]; currentMatchday: number } | null> {
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

  // Define dinamicamente o rótulo da coluna: "Seleção" para torneios de seleções ou "Clube" como padrão
  const tipoEntidade = liga.slug === 'nations-league' ? 'Seleção' : 'Clube';

  const gruposNomes = Array.from(
  new Set(
    tabela
      .map((t) => t.groupName)
      .filter((g): g is string => typeof g === 'string' && g.toLowerCase() !== 'overall')
  )
);
  
  const temMultiplosGrupos = gruposNomes.length > 1;
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
          {liga.subtitulo} - {temMultiplosGrupos ? 'Fase de Grupos' : 'Classificação Oficial'}
        </p>
      </div>

      {temJogos ? (
        // LAYOUT COM 2 COLUNAS (TABELA + RODADAS)
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              🏆 Classificação
            </h2>
            <TabelaHtml tabela={tabela} tipoEntidade={tipoEntidade} />
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
      ) : temMultiplosGrupos ? (
        // LAYOUT MULTI-GRUPOS (NATIONS LEAGUE)
        <div className="space-y-8 max-w-5xl mx-auto">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              🏆 Grupos da Nations League
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {gruposNomes.map((nomeGrupo) => {
              const timesDoGrupo = tabela.filter((t) => t.groupName === nomeGrupo);
              return (
                <div key={nomeGrupo} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="bg-slate-50 px-4 py-2.5 border-b border-gray-200">
                    <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wider">
                      {nomeGrupo}
                    </h3>
                  </div>
                  <TabelaHtml tabela={timesDoGrupo} tipoEntidade={tipoEntidade} />
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        // LAYOUT FASE DE LIGA / PONTOS CORRIDOS (EUROPA LEAGUE, CONFERENCE LEAGUE, SÉRIE B)
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              🏆 Tabela de Classificação
            </h2>
          </div>
          <TabelaHtml tabela={tabela} tipoEntidade={tipoEntidade} />
        </div>
      )}
    </div>
  );
}

function TabelaHtml({ tabela, tipoEntidade = 'Clube' }: { tabela: Tabela; tipoEntidade?: string }) {
  return (
    <div className="overflow-x-auto bg-white rounded-2xl shadow-sm border border-gray-200">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-3 py-3 text-left font-semibold text-gray-600 w-8">#</th>
            <th className="px-3 py-3 text-left font-semibold text-gray-600">{tipoEntidade}</th>
            <th className="px-3 py-3 text-center font-semibold text-gray-600 w-10">P</th>
            <th className="px-3 py-3 text-center font-semibold text-gray-600 w-8">J</th>
            <th className="px-3 py-3 text-center font-semibold text-gray-600 w-8">V</th>
            <th className="px-3 py-3 text-center font-semibold text-gray-600 w-8">E</th>
            <th className="px-3 py-3 text-center font-semibold text-gray-600 w-8">D</th>
            <th className="px-3 py-3 text-center font-semibold text-gray-600 w-10">SG</th>
          </tr>
        </thead>
        <tbody>
          {tabela.map((time: TimeTabela) => (
            <tr key={`${time.groupName || ''}-${time.team.name}`} className="border-t hover:bg-gray-50 transition-colors">
              <td className="px-3 py-3 font-bold text-gray-700">{time.position}</td>
              <td className="px-3 py-3 flex items-center gap-2">
                <img src={time.team.crest} alt={time.team.name} className="w-5 h-5 object-contain" />
                <span className="font-medium text-gray-900 truncate max-w-[140px] sm:max-w-[200px]">
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