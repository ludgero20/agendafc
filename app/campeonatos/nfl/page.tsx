import type { Metadata } from 'next';
import fs from 'fs/promises';
import path from 'path';
import Image from 'next/image';

export const metadata: Metadata = {
  title: "Tabela e Jogos da NFL | Classificação e Próxima Rodada | Agenda FC",
  description: "Acompanhe a classificação completa da NFL, dividida por conferências e divisões, e veja a agenda da próxima rodada da temporada.",
};

// --- Tipos para o seu JSON manual (versão completa) ---
type TimeTabelaNFL = {
  idStanding: string; strTeam: string; strTeamBadge: string; intRank: string; intPlayed: string;
  intWin: string; intLoss: string; intTie: string; strPercentage: string; intPointsFor: string;
  intPointsAgainst: string; strHomeRecord: string; strAwayRecord: string; strStreak: string;
  strConference: string; strDivision: string;
};

type ProximoJogoNFL = {
  idEvent: string; strHomeTeam: string; strAwayTeam: string; dateEvent: string; 
  strTime: string; intRound: string;
};

// --- Funções para ler os arquivos locais ---
async function getTabelaNFL(): Promise<TimeTabelaNFL[] | null> {
  try {
    const filePath = path.join(process.cwd(), "public/importacoes-manuais/nfl/tabela.json");
    const jsonData = await fs.readFile(filePath, "utf-8");
    const data = JSON.parse(jsonData);
    return data.table;
  } catch (error) { console.error("🚨 ERRO AO LER ARQUIVO da tabela da NFL:", error); return null; }
}

async function getProximosJogosNFL(): Promise<ProximoJogoNFL[] | null> {
  try {
    const filePath = path.join(process.cwd(), "public/importacoes-manuais/nfl/proxima-rodada.json");
    const jsonData = await fs.readFile(filePath, "utf-8");
    const data = JSON.parse(jsonData);
    return data.events;
  } catch (error) { console.error("🚨 ERRO AO LER ARQUIVO dos próximos jogos da NFL:", error); return null; }
}

// --- Componente da Página ---
export default async function NFLPage() {
  const [tabelaCompleta, proximosJogos] = await Promise.all([ getTabelaNFL(), getProximosJogosNFL() ]);

  if (!tabelaCompleta) {
    return ( <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-6 rounded-lg text-center"><h2 className="font-bold text-lg mb-2">Tabela da NFL Indisponível</h2><p>Os dados de classificação estão sendo atualizados. Por favor, volte mais tarde.</p></div> );
  }

  const tabelasPorConferencia = tabelaCompleta.reduce((acc, time) => {
    const conferencia = time.strConference.includes("American") ? "AFC" : "NFC";
    const divisao = time.strDivision;
    if (!acc[conferencia]) acc[conferencia] = {};
    if (!acc[conferencia][divisao]) acc[conferencia][divisao] = [];
    acc[conferencia][divisao].push(time);
    return acc;
  }, {} as Record<string, Record<string, TimeTabelaNFL[]>>);

  const formatarDataJogoNFL = (data: string, hora: string) => {
    if (!data || !hora) return 'Data a definir';
    const [ano, mes, dia] = data.split('-');
    const horaFormatada = hora.substring(0, 5);
    return `${dia}/${mes} às ${horaFormatada}`;
  };

  return (
    <div>
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold">NFL - National Football League</h1>
        <p className="text-xl text-gray-600 mt-2">Temporada Regular</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {Object.entries(tabelasPorConferencia).map(([conferencia, divisoes]) => (
            <div key={conferencia}>
              <h2 className="text-3xl font-bold mb-4">{conferencia}</h2>
              <div className="space-y-6">
                {Object.entries(divisoes).map(([divisao, tabela]) => (
                  <div key={divisao}>
                    <h3 className="text-xl font-semibold mb-3">{divisao.replace("AFC ", "").replace("NFC ", "")}</h3>
                    <div className="overflow-x-auto bg-white rounded-lg shadow-md">
                      <table className="min-w-full text-sm">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="px-3 py-2 text-left font-semibold text-gray-600">Equipe</th>
                            <th className="px-3 py-2 text-center font-semibold text-gray-600">V</th>
                            <th className="px-3 py-2 text-center font-semibold text-gray-600">D</th>
                            <th className="px-3 py-2 text-center font-semibold text-gray-600">E</th>
                            <th className="px-3 py-2 text-center font-semibold text-gray-600">%</th>
                            <th className="px-3 py-2 text-center font-semibold text-gray-600">PF</th>
                            <th className="px-3 py-2 text-center font-semibold text-gray-600">PC</th>
                            <th className="px-3 py-2 text-center font-semibold text-gray-600">Casa</th>
                            <th className="px-3 py-2 text-center font-semibold text-gray-600">Fora</th>
                            <th className="px-3 py-2 text-center font-semibold text-gray-600">Seq</th>
                          </tr>
                        </thead>
                        <tbody>
                          {tabela.sort((a,b) => parseInt(a.intRank) - parseInt(b.intRank)).map((time: TimeTabelaNFL) => (
                            <tr key={time.idStanding} className="border-t hover:bg-gray-50">
                              {/* CÉLULA 1: NOME E LOGO */}
                              <td className="px-3 py-2 flex items-center">
                                <Image src={time.strTeamBadge} alt={time.strTeam} width={20} height={20} className="w-5 h-5 mr-2" />
                                <span className="font-medium">{time.strTeam}</span>
                              </td>
                              {/* CÉLULAS 2-10: DADOS */}
                              <td className="px-3 py-2 text-center font-bold">{time.intWin}</td>
                              <td className="px-3 py-2 text-center">{time.intLoss}</td>
                              <td className="px-3 py-2 text-center">{time.intTie}</td>
                              <td className="px-3 py-2 text-center font-bold">{time.strPercentage}</td>
                              <td className="px-3 py-2 text-center">{time.intPointsFor}</td>
                              <td className="px-3 py-2 text-center">{time.intPointsAgainst}</td>
                              <td className="px-3 py-2 text-center">{time.strHomeRecord}</td>
                              <td className="px-3 py-2 text-center">{time.strAwayRecord}</td>
                              <td className="px-3 py-2 text-center">{time.strStreak}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="lg:col-span-1">
          <h2 className="text-2xl font-bold mb-4">Próximos Jogos</h2>
          {proximosJogos && proximosJogos.length > 0 ? (
            <div className="space-y-4">
              {proximosJogos.map((jogo: ProximoJogoNFL) => (
                <div key={jogo.idEvent} className="bg-white p-4 rounded-lg shadow-md border">
                  <p className="text-sm text-center text-gray-500 mb-2">Rodada {jogo.intRound} - {formatarDataJogoNFL(jogo.dateEvent, jogo.strTime)}</p>
                  <div className="text-center font-medium text-sm">
                    <p>{jogo.strAwayTeam}</p>
                    <p className="text-gray-400 font-bold my-1">@</p>
                    <p>{jogo.strHomeTeam}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : ( <div className="bg-white p-4 rounded-lg shadow-md border text-center"><p className="text-gray-600">Aguardando definição dos próximos jogos.</p></div> )}
        </div>
      </div>
      <div className="text-center p-6 mt-12 bg-gray-50 border border-gray-200 rounded-xl">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          🔄 Sobre a Atualização da Tabela
        </h3>
        <p className="text-gray-600 max-w-xl mx-auto text-sm">
          Para garantir a precisão dos dados, a tabela de classificação da NFL é atualizada ao final de cada rodada, geralmente após a partida de segunda-feira (Monday Night Football).
        </p>
      </div>
    </div>
  );
}