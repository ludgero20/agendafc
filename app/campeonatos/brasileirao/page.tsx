import type { Metadata } from 'next';
import fs from 'fs/promises';
import path from 'path';
import RodadaFutebolClient, { JogoFutebol } from '@/app/components/RodadaFutebolClient';

export const metadata: Metadata = {
  title: "Tabela e Jogos do Brasileirão Série A | Classificação e Rodadas | Agenda FC",
  description: "Tabela de classificação completa e calendário de todas as rodadas com placares e jogos do Campeonato Brasileiro Série A.",
};

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

// 1. BUSCA TABELA (Tenta API ao vivo com fallback no cache local)
async function getTabelaBrasileirao(): Promise<Tabela | null> {
  // Tentativa 1: API direta
  try {
    if (process.env.API_FOOTBALLDATA_KEY) {
      const res = await fetch("https://api.football-data.org/v4/competitions/BSA/standings", {
        headers: { 'X-Auth-Token': process.env.API_FOOTBALLDATA_KEY },
        next: { revalidate: 3600 }
      });
      if (res.ok) {
        const data = await res.json();
        const table = data?.standings?.[0]?.table;
        if (table && table.length > 0) return table;
      }
    }
  } catch (e) {
    console.log("Tentando ler tabela do cache local...");
  }

  // Tentativa 2: Cache local
  try {
    const filePath = path.join(process.cwd(), "public/api-cache/brasileirao-standings.json");
    const jsonData = await fs.readFile(filePath, "utf-8");
    const data = JSON.parse(jsonData);
    return data?.standings?.[0]?.table || null;
  } catch (error) {
    console.error("ERRO AO LER tabela do Brasileirão no cache:", error);
    return null;
  }
}

// 2. BUSCA TODOS OS JOGOS (Tenta API ao vivo com fallback no cache local)
async function getTodosJogosBrasileirao(): Promise<{ matches: JogoFutebol[]; currentMatchday: number } | null> {
  // Tentativa 1: API direta
  try {
    if (process.env.API_FOOTBALLDATA_KEY) {
      const res = await fetch("https://api.football-data.org/v4/competitions/BSA/matches", {
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
  } catch (e) {
    console.log("Tentando ler jogos do cache local...");
  }

  // Tentativa 2: Cache local
  try {
    const filePath = path.join(process.cwd(), "public/api-cache/brasileirao-matches.json");
    const jsonData = await fs.readFile(filePath, "utf-8");
    const data = JSON.parse(jsonData);
    
    return {
      matches: data?.matches || [],
      currentMatchday: data?.season?.currentMatchday || data?.filters?.matchday || 1
    };
  } catch (error) {
    console.error("ERRO AO LER jogos do Brasileirão no cache:", error);
    return null;
  }
}

export default async function BrasileiraoPage() {
  const [tabela, jogosData] = await Promise.all([
    getTabelaBrasileirao(),
    getTodosJogosBrasileirao()
  ]);

  if (!tabela || !jogosData) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-800 p-6 rounded-lg text-center max-w-xl mx-auto my-12">
        <h2 className="font-bold text-lg mb-2">Erro ao Carregar o Brasileirão</h2>
        <p>Não foi possível carregar os dados no momento. Por favor, tente novamente mais tarde.</p>
      </div>
    );
  }

  const { matches, currentMatchday } = jogosData;

  // Identifica a rodada atual
  const primeiroJogoNaoFinalizado = matches.find(j => j.status !== 'FINISHED');
  const rodadaInicial = primeiroJogoNaoFinalizado?.matchday || currentMatchday || 1;

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 py-6">
      <div className="text-center">
        <h1 className="text-4xl font-extrabold text-gray-900">Brasileirão Série A</h1>
        <p className="text-xl text-gray-600 mt-2">Classificação completa e calendário de rodadas</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Coluna da Esquerda: Tabela de Classificação */}
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
                      <span className="font-medium text-gray-900">{time.team.shortName || time.team.name}</span>
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

        {/* Coluna da Direita: Navegador de Rodadas Interativo */}
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