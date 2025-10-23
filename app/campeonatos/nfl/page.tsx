import type { Metadata } from 'next';
import fs from 'fs/promises';
import path from 'path';
import Image from 'next/image';
import RodadaNFLClient from '@/app/components/RodadaNFLClient';

export const metadata: Metadata = {
  title: "Tabela e Jogos da NFL | Classificação e Rodadas | Agenda FC",
  description: "Tabela de classificação e calendário de jogos e resultados da NFL, dividida por conferências.",
};

// ==========================================================
// Atualiza o 'type' 
// ==========================================================
type TimeTabelaNFL = {
  teamName: string;      
  teamLogo: string;      
  rank: string;          
  conference: string;    
  division: string;      
  intWin: string;
  intLoss: string;
  intTie: string;
  strPercentage: string;
};
// ==========================================================

type JogoNFL = {
  idEvent: string; intRound: string; dateEvent: string; strTime: string; strHomeTeam: string;
  strAwayTeam: string; intHomeScore: string | null; intAwayScore: string | null; strStatus: string;
};

// Funções de busca de dados
async function getTabelaNFL(): Promise<TimeTabelaNFL[] | null> {
  try {
    const filePath = path.join(process.cwd(), "public/importacoes-manuais/nfl/tabela.json");
    const jsonData = await fs.readFile(filePath, "utf-8");
    const data = JSON.parse(jsonData);

    // ==========================================================
    // Lê 'data.standings''
    // ==========================================================
    return data.standings;
    // ==========================================================

  } catch (error) {
    console.error("🚨 ERRO AO LER ARQUIVO da tabela da NFL:", error);
    return null;
  }
}

async function getTodosJogosNFL(): Promise<JogoNFL[] | null> {
  try {
    const filePath = path.join(process.cwd(), "public/importacoes-manuais/nfl/jogos-nfl.json");
    const jsonData = await fs.readFile(filePath, "utf-8");
    const data = JSON.parse(jsonData);
    return data.events;
  } catch (error) {
    console.error("🚨 ERRO AO LER ARQUIVO de jogos da NFL:", error);
    return null;
  }
}

// Componente da Página
export default async function NFLPage() {
  const [tabelaCompleta, todosOsJogos] = await Promise.all([
    getTabelaNFL(),
    getTodosJogosNFL()
  ]);

  if (!tabelaCompleta || !todosOsJogos) {
    return (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-6 rounded-lg text-center">
          <h2 className="font-bold text-lg mb-2">Dados da NFL Indisponíveis</h2>
          <p>Os dados de classificação ou jogos estão sendo atualizados. Por favor, volte mais tarde.</p>
        </div>
    );
  }

  // Lógica para encontrar a rodada atual
  const jogosNaoFinalizados = todosOsJogos.filter(j => j.strStatus !== 'Match Finished').sort((a, b) => a.dateEvent.localeCompare(b.dateEvent));
  let rodadaInicial = 1;
  if (jogosNaoFinalizados.length > 0) {
    rodadaInicial = parseInt(jogosNaoFinalizados[0].intRound);
  } else if (todosOsJogos.length > 0) {
    // Se a temporada acabou, mostra a última rodada
    rodadaInicial = todosOsJogos.reduce((max, jogo) => Math.max(max, parseInt(jogo.intRound)), 0);
  }

  // ==========================================================
  // Agrupa usando os nomes 'conference' e 'division'
  // ==========================================================
  const tabelasPorConferencia = tabelaCompleta.reduce((acc, time) => {
    const conferencia = time.conference.includes("American") ? "AFC" : "NFC";
    const divisao = time.division;
    if (!acc[conferencia]) acc[conferencia] = {};
    if (!acc[conferencia][divisao]) acc[conferencia][divisao] = [];
    acc[conferencia][divisao].push(time);
    return acc;
  }, {} as Record<string, Record<string, TimeTabelaNFL[]>>);
  // ==========================================================

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
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {Object.entries(divisoes).map(([divisao, tabela]) => (
                  <div key={divisao}>
                    <h3 className="text-xl font-semibold mb-3">{divisao.replace("AFC ", "").replace("NFC ", "")}</h3>
                    <div className="overflow-x-auto bg-white rounded-lg shadow-md">
                      <table className="min-w-full text-sm">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="px-3 py-2 text-left font-semibold text-gray-600">Time</th>
                            <th className="px-3 py-2 text-center font-semibold text-gray-600">V</th>
                            <th className="px-3 py-2 text-center font-semibold text-gray-600">D</th>
                            <th className="px-3 py-2 text-center font-semibold text-gray-600">E</th>
                            <th className="px-3 py-2 text-center font-semibold text-gray-600">%</th>
                          </tr>
                        </thead>
                        <tbody>
                          {/* ========================================================== */}
                          {/* Renderiza usando os novos nomes das propriedades */}
                          {/* ========================================================== */}
                          {tabela.sort((a,b) => parseInt(a.rank) - parseInt(b.rank)).map((time) => (
                            <tr key={time.teamName} className="border-t">
                              <td className="px-3 py-2 flex items-center">
                                <Image src={time.teamLogo} alt={time.teamName} width={20} height={20} className="w-5 h-5 mr-2" />
                                <span className="font-medium">{time.teamName}</span>
                              </td>
                              <td className="px-3 py-2 text-center font-bold">{time.intWin}</td>
                              <td className="px-3 py-2 text-center">{time.intLoss}</td>
                              <td className="px-3 py-2 text-center">{time.intTie}</td>
                              <td className="px-3 py-2 text-center font-bold">{time.strPercentage}</td>
                            </tr>
                          ))}
                          {/* ========================================================== */}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <RodadaNFLClient 
          todosOsJogos={todosOsJogos} 
          rodadaInicial={rodadaInicial}
        />
      </div>
    </div>
  );
}