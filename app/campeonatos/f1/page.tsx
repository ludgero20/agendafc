import type { Metadata } from 'next';
import fs from 'fs/promises';
import path from 'path';
import CalendarioF1Client from '@/app/components/CalendarioF1Client';

export const metadata: Metadata = {
  title: "Fórmula 1: Classificação e Calendário | Agenda FC",
  description: "Calendário de corridas, classificação de pilotos e classificação de construtores da Fórmula 1 atualizada.",
};

export const revalidate = 3600;

// Tipos
type Sessao = { nome: string; data: string; hora: string; transmissao: string[]; };

type RaceResults = { 
  pole: string; 
  p1: string; 
  p2: string; 
  p3: string; 
};

type Corrida = { 
  round: number; 
  raceName: string; 
  circuitName: string; 
  country: string; 
  status: string; 
  winner?: string | null; 
  sessoes: Sessao[]; 
  results?: RaceResults; 
};

type Piloto = { position: number; name: string; nationality: string; team: string; points: number; wins: number; podiums: number; };
type Equipe = { position: number; name: string; logoUrl: string; points: number; wins: number; podiums: number; };

const bandeirasNacionalidade: Record<string, string> = {
  "British": "🇬🇧",
  "Dutch": "🇳🇱",
  "Monegasque": "🇲🇨",
  "Spanish": "🇪🇸",
  "Australian": "🇦🇺",
  "German": "🇩🇪",
  "Mexican": "🇲🇽",
  "French": "🇫🇷",
  "Canadian": "🇨🇦",
  "Japanese": "🇯🇵",
  "Finnish": "🇫🇮",
  "Italian": "🇮🇹",
  "Chinese": "🇨🇳",
  "Thai": "🇹🇭",
  "Brazilian": "🇧🇷",
  "American": "🇺🇸",
  "Argentine": "🇦🇷",
  "New Zealander": "🇳🇿"
};

// 1. PILOTOS NA API JOLPICA OFICIAL (api.jolpi.ca)
async function getPilotosF1(): Promise<Piloto[]> {
  try {
    const res = await fetch("https://api.jolpi.ca/ergast/f1/current/driverStandings.json", {
      next: { revalidate: 3600 }
    });
    if (!res.ok) throw new Error("Erro na API de pilotos");
    const data = await res.json();
    const lista = data?.MRData?.StandingsTable?.StandingsLists?.[0]?.DriverStandings || [];

    if (lista.length === 0) throw new Error("Lista vazia");

    return lista.map((item: any) => {
      const inicial = item.Driver.givenName ? `${item.Driver.givenName.charAt(0)}.` : '';
      return {
        position: parseInt(item.position),
        name: `${inicial} ${item.Driver.familyName}`,
        nationality: bandeirasNacionalidade[item.Driver.nationality] || '🏁',
        team: item.Constructors?.[0]?.name || 'N/A',
        points: parseFloat(item.points),
        wins: parseInt(item.wins),
        podiums: 0
      };
    });
  } catch (error) {
    const fallback = await fs.readFile(path.join(process.cwd(), "public/importacoes-manuais/f1/pilotos.json"), "utf-8").catch(() => '{"standings":[]}');
    const parsed = JSON.parse(fallback);
    return parsed.standings || [];
  }
}

// 2. EQUIPES NA API JOLPICA OFICIAL (api.jolpi.ca)
async function getEquipesF1(): Promise<Equipe[]> {
  try {
    const res = await fetch("https://api.jolpi.ca/ergast/f1/current/constructorStandings.json", {
      next: { revalidate: 3600 }
    });
    if (!res.ok) throw new Error("Erro na API de construtores");
    const data = await res.json();
    const lista = data?.MRData?.StandingsTable?.StandingsLists?.[0]?.ConstructorStandings || [];

    if (lista.length === 0) throw new Error("Lista vazia");

    return lista.map((item: any) => ({
      position: parseInt(item.position),
      name: item.Constructor.name,
      logoUrl: "",
      points: parseFloat(item.points),
      wins: parseInt(item.wins),
      podiums: 0
    }));
  } catch (error) {
    const fallback = await fs.readFile(path.join(process.cwd(), "public/importacoes-manuais/f1/equipes.json"), "utf-8").catch(() => '{"standings":[]}');
    const parsed = JSON.parse(fallback);
    return parsed.standings || [];
  }
}

// 3. CALENDÁRIO COM RESULTADOS OFICIAIS (api.jolpi.ca)
async function getCalendarioF1(): Promise<Corrida[]> {
  const localFile = await fs.readFile(path.join(process.cwd(), "public/importacoes-manuais/f1/calendario.json"), "utf-8").catch(() => '[]');
  let corridasRaw = Array.isArray(JSON.parse(localFile)) ? JSON.parse(localFile) : JSON.parse(localFile)?.races || [];

  let apiRaces: any[] = [];
  try {
    const res = await fetch("https://api.jolpi.ca/ergast/f1/current/results.json", {
      next: { revalidate: 3600 }
    });
    if (res.ok) {
      const data = await res.json();
      apiRaces = data?.MRData?.RaceTable?.Races || [];
    }
  } catch (error) {
    console.error("Erro ao buscar resultados da F1:", error);
  }

  const corridasFormatadas: Corrida[] = corridasRaw.map((corrida: any) => {
    const apiRace = apiRaces.find((r: any) => parseInt(r.round) === corrida.round);
    
    let finalResults: RaceResults | undefined = undefined;

    if (apiRace && apiRace.Results && apiRace.Results.length > 0) {
      const p1 = apiRace.Results[0];
      const p2 = apiRace.Results[1];
      const p3 = apiRace.Results[2];
      const p1Nome = p1 ? `${p1.Driver.givenName.charAt(0)}. ${p1.Driver.familyName}` : "-";

      finalResults = {
        pole: String(corrida.results?.pole || "-"),
        p1: p1Nome,
        p2: p2 ? `${p2.Driver.givenName.charAt(0)}. ${p2.Driver.familyName}` : "-",
        p3: p3 ? `${p3.Driver.givenName.charAt(0)}. ${p3.Driver.familyName}` : "-"
      };

      return {
        ...corrida,
        status: "Finalizado",
        winner: p1Nome !== "-" ? p1Nome : (corrida.winner || null),
        results: finalResults
      };
    }

    if (corrida.results && typeof corrida.results === 'object') {
      finalResults = {
        pole: String(corrida.results.pole || "-"),
        p1: String(corrida.results.p1 || "-"),
        p2: String(corrida.results.p2 || "-"),
        p3: String(corrida.results.p3 || "-")
      };
    }

    return {
      ...corrida,
      winner: corrida.winner || null,
      results: finalResults
    };
  });

  return corridasFormatadas;
}

export default async function F1Page() {
  const [calendario, pilotos, equipes] = await Promise.all([
    getCalendarioF1(),
    getPilotosF1(),
    getEquipesF1()
  ]);

  return (
    <div className="space-y-12">
      <div className="text-center">
        <h1 className="text-4xl font-bold">🏁 Fórmula 1</h1>
        <h2 className="text-xl font-bold text-gray-700 mt-1">Temporada 2026</h2>
        <p className="text-xl text-gray-600 mt-2">Classificação de Pilotos e de Equipes</p>
        <p className="text-xl text-gray-600 mt-1">Calendário completo com transmissões</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Tabela de Pilotos */}
        <section className="lg:col-span-3">
          <h2 className="text-3xl font-bold text-gray-800 mb-6 border-b pb-4">Classificação de Pilotos</h2>
          <div className="overflow-x-auto bg-white rounded-lg shadow-md">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold text-gray-600">#</th>
                  <th className="px-3 py-2 text-left font-semibold text-gray-600">Piloto</th>
                  <th className="px-3 py-2 text-left font-semibold text-gray-600">Equipe</th>
                  <th className="px-3 py-2 text-center font-semibold text-gray-600">Pontos</th>
                  <th className="px-3 py-2 text-center font-semibold text-gray-600">Vitórias</th>
                </tr>
              </thead>
              <tbody>
                {(pilotos || []).map((piloto) => (
                  <tr key={piloto.position} className="border-t hover:bg-gray-50">
                    <td className="px-3 py-2 font-bold">{piloto.position}</td>
                    <td className="px-3 py-2 font-medium">{piloto.nationality} {piloto.name}</td>
                    <td className="px-3 py-2 text-gray-600">{piloto.team}</td>
                    <td className="px-3 py-2 text-center font-bold text-blue-600">{piloto.points}</td>
                    <td className="px-3 py-2 text-center">{piloto.wins}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Tabela de Equipes */}
        <section className="lg:col-span-2">
          <h2 className="text-3xl font-bold text-gray-800 mb-6 border-b pb-4">Classificação de Equipes</h2>
          <div className="overflow-x-auto bg-white rounded-lg shadow-md">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold text-gray-600">#</th>
                  <th className="px-3 py-2 text-left font-semibold text-gray-600">Equipe</th>
                  <th className="px-3 py-2 text-center font-semibold text-gray-600">Pontos</th>
                  <th className="px-3 py-2 text-center font-semibold text-gray-600">Vitórias</th>
                </tr>
              </thead>
              <tbody>
                {(equipes || []).map((equipe) => (
                  <tr key={equipe.position} className="border-t hover:bg-gray-50">
                    <td className="px-3 py-2 font-bold">{equipe.position}</td>
                    <td className="px-3 py-2 font-medium">{equipe.name}</td>
                    <td className="px-3 py-2 text-center font-bold text-blue-600">{equipe.points}</td>
                    <td className="px-3 py-2 text-center">{equipe.wins}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <CalendarioF1Client calendario={calendario} />
    </div>
  );
}