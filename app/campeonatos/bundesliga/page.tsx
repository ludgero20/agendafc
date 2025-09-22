import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Tabela e Jogos da Bundesliga | Agenda FC",
  description: "Acompanhe a tabela de classificação e os próximos jogos da Bundesliga. Veja a situação do seu time e a agenda completa da rodada do campeonato alemão.",
};

// --- Tipos para os dados da API ---
type TimeTabela = { position: number; team: { id: number; name: string; crest: string; }; points: number; playedGames: number; won: number; draw: number; lost: number; goalDifference: number; };
type Tabela = TimeTabela[];
type ProximoJogo = { id: number; utcDate: string; matchday: number; homeTeam: { name: string; crest: string; }; awayTeam: { name: string; crest: string; }; };

// --- Funções para buscar os dados da API ---
async function getTabelaBundesliga(): Promise<Tabela | null> {
  const url = `https://api.football-data.org/v4/competitions/BL1/standings`;
  const res = await fetch(url, { headers: { 'X-Auth-Token': process.env.API_FOOTBALLDATA_KEY || '' }, next: { revalidate: 18000 } });
  if (!res.ok) { console.error("ERRO AO BUSCAR TABELA (Bundesliga)"); return null; }
  const data = await res.json();
  return data?.standings?.[0]?.table;
}

async function getProximosJogosBundesliga(): Promise<ProximoJogo[] | null> {
  const url = `https://api.football-data.org/v4/competitions/BL1/matches?status=SCHEDULED`;
  const res = await fetch(url, { headers: { 'X-Auth-Token': process.env.API_FOOTBALLDATA_KEY || '' }, next: { revalidate: 10800 } });
  if (!res.ok) { console.error("ERRO AO BUSCAR JOGOS (Bundesliga)"); return null; }
  const data = await res.json();
  return data?.matches;
}

// --- Componente da Página ---
export default async function BundesligaPage() {
  const [tabela, proximosJogos] = await Promise.all([ getTabelaBundesliga(), getProximosJogosBundesliga() ]);

  if (!tabela) {
    return ( <div className="bg-red-50 border border-red-200 text-red-800 p-6 rounded-lg"> <h2 className="font-bold text-lg mb-2">Erro ao Carregar a Tabela</h2> <p>Não foi possível buscar os dados da classificação da Bundesliga no momento.</p> </div> );
  }

  const formatarDataJogo = (dataISO: string) => new Date(dataISO).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'America/Sao_Paulo' }).replace(',', ' às');

  return (
    <div>
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold">Bundesliga</h1>
        <p className="text-xl text-gray-600 mt-2">Campeonato Alemão</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <h2 className="text-2xl font-bold mb-4">Classificação</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white rounded-lg shadow-md">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold text-gray-600">#</th>
                  <th className="px-3 py-2 text-left font-semibold text-gray-600">Time</th>
                  <th className="px-3 py-2 text-center font-semibold text-gray-600">P</th>
                  <th className="px-3 py-2 text-center font-semibold text-gray-600">J</th>
                  <th className="px-3 py-2 text-center font-semibold text-gray-600">V</th>
                  <th className="px-3 py-2 text-center font-semibold text-gray-600">E</th>
                  <th className="px-3 py-2 text-center font-semibold text-gray-600">D</th>
                  <th className="px-3 py-2 text-center font-semibold text-gray-600">SG</th>
                </tr>
              </thead>
              <tbody>
                {tabela.map((time: TimeTabela) => (
                  <tr key={time.team.id} className="border-t hover:bg-gray-50">
                    <td className="px-3 py-2 font-bold">{time.position}</td>
                    <td className="px-3 py-2 flex items-center"> <img src={time.team.crest} alt={time.team.name} className="w-5 h-5 mr-2" /> <span className="font-medium text-sm">{time.team.name}</span> </td>
                    <td className="px-3 py-2 text-center font-bold">{time.points}</td>
                    <td className="px-3 py-2 text-center">{time.playedGames}</td>
                    <td className="px-3 py-2 text-center">{time.won}</td>
                    <td className="px-3 py-2 text-center">{time.draw}</td>
                    <td className="px-3 py-2 text-center">{time.lost}</td>
                    <td className="px-3 py-2 text-center">{time.goalDifference}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="lg:col-span-1">
          <h2 className="text-2xl font-bold mb-4">Próximos Jogos</h2>
          {proximosJogos && proximosJogos.length > 0 ? (
            <div className="space-y-4">
              {proximosJogos.slice(0, 10).map((jogo: ProximoJogo) => (
                <div key={jogo.id} className="bg-white p-4 rounded-lg shadow-md border">
                  <p className="text-sm text-center text-gray-500 mb-2"> Rodada {jogo.matchday} - {formatarDataJogo(jogo.utcDate)} </p>
                  <div className="flex items-center justify-between text-sm font-medium">
                    <span className="flex items-center gap-2 w-2/5 justify-end text-right"> {jogo.homeTeam.name} <img src={jogo.homeTeam.crest} alt={jogo.homeTeam.name} className="w-5 h-5" /> </span>
                    <span className="text-gray-400 font-bold mx-2">vs</span>
                    <span className="flex items-center gap-2 w-2/5"> <img src={jogo.awayTeam.crest} alt={jogo.awayTeam.name} className="w-5 h-5" /> {jogo.awayTeam.name} </span>
                  </div>
                </div>
              ))}
            </div>
          ) : ( <div className="bg-white p-4 rounded-lg shadow-md border text-center"> <p className="text-gray-600">Aguardando definição dos próximos jogos.</p> </div> )}
        </div>
      </div>
    </div>
  );
}