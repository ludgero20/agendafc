import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Tabela e Jogos da NFL | Classificação e Próxima Rodada | Agenda FC",
  description: "Acompanhe a classificação completa da NFL, dividida por conferências e divisões, e veja a agenda da próxima rodada da temporada.",
};

// --- Tipos para os dados da API-NFL (API-Sports) ---
type TimeTabelaNFL = {
  position: number;
  team: { id: number; name: string; logo: string; };
  conference: string; // Ex: "American Football Conference"
  division: string;   // Ex: "East"
  games: { played: number; win: { total: number; }; lose: { total: number; }; };
  // A API-NFL não fornece empates ('ties') diretamente na tabela, calculamos se necessário
};

// --- Função para buscar os dados da API ---
async function getTabelaNFL(): Promise<TimeTabelaNFL[] | null> {
  const season = new Date().getFullYear();
  // Na API-NFL, o ID da liga é 1
  const url = `https://v3.american-football.api-sports.io/standings?league=1&season=${season}`;

  try {
    const res = await fetch(url, {
      headers: {
        'x-rapidapi-host': 'v3.american-football.api-sports.io',
        // Usando a mesma chave da API-Football, que provavelmente é a mesma
        'x-rapidapi-key': process.env.API_FOOTBALL_KEY || ''
      },
      next: { revalidate: 10800 } // Cache de 3 horas
    });

    if (!res.ok) {
      const errorBody = await res.json().catch(() => null);
      console.error("🚨 ERRO AO BUSCAR DADOS DA API-NFL:", { status: res.status, body: errorBody });
      return null;
    }

    const data = await res.json();
    console.log("🔍 RESPOSTA COMPLETA DA API-NFL:", JSON.stringify(data, null, 2));

    // Verificamos se a resposta contém um erro conhecido
    if (data.results === 0 || (data.errors && Object.keys(data.errors).length > 0)) {
        console.error("A API-NFL retornou um erro ou zero resultados:", data.errors);
        return null;
    }

    return data?.response;

  } catch (error) {
    console.error("🚨 ERRO CRÍTICO AO PROCESSAR RESPOSTA DA API-NFL:", error);
    return null;
  }
}

// --- Componente da Página ---
export default async function NFLPage() {
  const tabelaCompleta = await getTabelaNFL();

  if (!tabelaCompleta || tabelaCompleta.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-6 rounded-lg text-center">
        <h2 className="font-bold text-lg mb-2">Tabela da NFL Indisponível</h2>
        <p>Não foi possível buscar os dados de classificação da NFL no momento. A API pode estar indisponível ou a temporada ainda não começou.</p>
      </div>
    );
  }

  // Organizando a tabela por conferência e divisão
  const tabelasPorConferencia = tabelaCompleta.reduce((acc, time) => {
    const conferencia = time.conference;
    const divisao = `${conferencia} ${time.division}`; // Ex: "American Football Conference East"
    if (!acc[conferencia]) acc[conferencia] = {};
    if (!acc[conferencia][divisao]) acc[conferencia][divisao] = [];
    acc[conferencia][divisao].push(time);
    return acc;
  }, {} as Record<string, Record<string, TimeTabelaNFL[]>>);


  return (
    <div>
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold">NFL - National Football League</h1>
        <p className="text-xl text-gray-600 mt-2">Temporada Regular</p>
      </div>

      <div className="space-y-8">
        {Object.entries(tabelasPorConferencia).map(([conferencia, divisoes]) => (
          <div key={conferencia}>
            <h2 className="text-3xl font-bold mb-4">{conferencia.replace(" Football Conference", "")}</h2>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {Object.entries(divisoes).map(([divisao, tabela]) => (
                <div key={divisao}>
                  <h3 className="text-xl font-semibold mb-3">{divisao.replace(conferencia, "")}</h3>
                  <div className="overflow-x-auto bg-white rounded-lg shadow-md">
                    <table className="min-w-full">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-3 py-2 text-left font-semibold text-gray-600 text-sm">Time</th>
                          <th className="px-3 py-2 text-center font-semibold text-gray-600 text-sm">V</th>
                          <th className="px-3 py-2 text-center font-semibold text-gray-600 text-sm">D</th>
                          <th className="px-3 py-2 text-center font-semibold text-gray-600 text-sm">E</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tabela.sort((a,b) => a.position - b.position).map((time: TimeTabelaNFL) => {
                          const empates = time.games.played - time.games.win.total - time.games.lose.total;
                          return (
                            <tr key={time.team.id} className="border-t">
                              <td className="px-3 py-2 flex items-center">
                                <img src={time.team.logo} alt={time.team.name} className="w-5 h-5 mr-2" />
                                <span className="font-medium text-sm">{time.team.name}</span>
                              </td>
                              <td className="px-3 py-2 text-center font-bold">{time.games.win.total}</td>
                              <td className="px-3 py-2 text-center">{time.games.lose.total}</td>
                              <td className="px-3 py-2 text-center">{empates}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}