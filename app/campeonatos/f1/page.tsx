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
  sprintResults?: RaceResults; // 🏎️ Suporte a resultados de Sprint
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

// 1. PILOTOS
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

// 2. EQUIPES
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

// 3. CALENDÁRIO COM CORRIDAS PRINCIPAIS E SPRINTS
async function getCalendarioF1(): Promise<Corrida[]> {
  const localFile = await fs.readFile(path.join(process.cwd(), "public/importacoes-manuais/f1/calendario.json"), "utf-8").catch(() => '[]');
  let corridasRaw = Array.isArray(JSON.parse(localFile)) ? JSON.parse(localFile) : JSON.parse(localFile)?.races || [];

  const offsets = [0, 100, 200, 300, 400, 500];
  const apiRacesMap: Record<number, any> = {};
  const apiSprintsMap: Record<number, any> = {};

  try {
    // 🏎️ Busca os resultados das Corridas Principais E das Sprints em paralelo
    const [responsesRaces, responsesSprints] = await Promise.all([
      Promise.all(
        offsets.map(offset =>
          fetch(`https://api.jolpi.ca/ergast/f1/current/results.json?limit=100&offset=${offset}`, {
            next: { revalidate: 3600 }
          }).then(res => res.ok ? res.json() : null).catch(() => null)
        )
      ),
      Promise.all(
        [0, 100].map(offset =>
          fetch(`https://api.jolpi.ca/ergast/f1/current/sprint.json?limit=100&offset=${offset}`, {
            next: { revalidate: 3600 }
          }).then(res => res.ok ? res.json() : null).catch(() => null)
        )
      )
    ]);

    // Mapeia Corridas Principais
    responsesRaces.forEach(data => {
      const races = data?.MRData?.RaceTable?.Races || [];
      races.forEach((race: any) => {
        const round = parseInt(race.round);
        if (!apiRacesMap[round]) {
          apiRacesMap[round] = { ...race, Results: [] };
        }
        if (race.Results) {
          apiRacesMap[round].Results.push(...race.Results);
        }
      });
    });

    // Mapeia Corridas Sprint
    responsesSprints.forEach(data => {
      const races = data?.MRData?.RaceTable?.Races || [];
      races.forEach((race: any) => {
        const round = parseInt(race.round);
        if (!apiSprintsMap[round]) {
          apiSprintsMap[round] = { ...race, SprintResults: [] };
        }
        if (race.SprintResults) {
          apiSprintsMap[round].SprintResults.push(...race.SprintResults);
        }
      });
    });
  } catch (error) {
    console.error("Erro ao buscar resultados da F1:", error);
  }

  const formatarNomePiloto = (driver: any) => {
    if (!driver) return "-";
    const inicial = driver.givenName ? `${driver.givenName.charAt(0)}.` : '';
    return `${inicial} ${driver.familyName}`;
  };

  const corridasFormatadas: Corrida[] = corridasRaw.map((corrida: any) => {
    const apiRace = apiRacesMap[corrida.round];
    const apiSprint = apiSprintsMap[corrida.round];
    
    let finalResults: RaceResults | undefined = undefined;
    let finalSprintResults: RaceResults | undefined = undefined;

    // 1. Processa Resultado da Corrida Principal
    if (apiRace && apiRace.Results && apiRace.Results.length > 0) {
      const resultsArray = apiRace.Results;
      const p1 = resultsArray.find((r: any) => r.position === "1") || resultsArray[0];
      const p2 = resultsArray.find((r: any) => r.position === "2") || resultsArray[1];
      const p3 = resultsArray.find((r: any) => r.position === "3") || resultsArray[2];
      const poleDriver = resultsArray.find((r: any) => r.grid === "1");

      const p1Nome = formatarNomePiloto(p1?.Driver);
      const p2Nome = formatarNomePiloto(p2?.Driver);
      const p3Nome = formatarNomePiloto(p3?.Driver);
      const poleNome = formatarNomePiloto(poleDriver?.Driver);

      finalResults = {
        pole: poleNome !== "-" ? poleNome : String(corrida.results?.pole || "-"),
        p1: p1Nome !== "-" ? p1Nome : String(corrida.results?.p1 || "-"),
        p2: p2Nome !== "-" ? p2Nome : String(corrida.results?.p2 || "-"),
        p3: p3Nome !== "-" ? p3Nome : String(corrida.results?.p3 || "-")
      };
    } else if (corrida.results && typeof corrida.results === 'object') {
      finalResults = {
        pole: String(corrida.results.pole || "-"),
        p1: String(corrida.results.p1 || "-"),
        p2: String(corrida.results.p2 || "-"),
        p3: String(corrida.results.p3 || "-")
      };
    }

    // 2. Processa Resultado da Corrida Sprint
    if (apiSprint && apiSprint.SprintResults && apiSprint.SprintResults.length > 0) {
      const sprintArray = apiSprint.SprintResults;
      const sp1 = sprintArray.find((r: any) => r.position === "1") || sprintArray[0];
      const sp2 = sprintArray.find((r: any) => r.position === "2") || sprintArray[1];
      const sp3 = sprintArray.find((r: any) => r.position === "3") || sprintArray[2];
      const sprintPoleDriver = sprintArray.find((r: any) => r.grid === "1");

      const sp1Nome = formatarNomePiloto(sp1?.Driver);
      const sp2Nome = formatarNomePiloto(sp2?.Driver);
      const sp3Nome = formatarNomePiloto(sp3?.Driver);
      const sprintPoleNome = formatarNomePiloto(sprintPoleDriver?.Driver);

      finalSprintResults = {
        pole: sprintPoleNome !== "-" ? sprintPoleNome : String(corrida.sprintResults?.pole || "-"),
        p1: sp1Nome !== "-" ? sp1Nome : String(corrida.sprintResults?.p1 || "-"),
        p2: sp2Nome !== "-" ? sp2Nome : String(corrida.sprintResults?.p2 || "-"),
        p3: sp3Nome !== "-" ? sp3Nome : String(corrida.sprintResults?.p3 || "-")
      };
    } else if (corrida.sprintResults && typeof corrida.sprintResults === 'object') {
      finalSprintResults = {
        pole: String(corrida.sprintResults.pole || "-"),
        p1: String(corrida.sprintResults.p1 || "-"),
        p2: String(corrida.sprintResults.p2 || "-"),
        p3: String(corrida.sprintResults.p3 || "-")
      };
    }

    return {
      ...corrida,
      status: finalResults ? "Finalizado" : corrida.status,
      winner: finalResults?.p1 !== "-" ? finalResults?.p1 : (corrida.winner || null),
      results: finalResults,
      sprintResults: finalSprintResults
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