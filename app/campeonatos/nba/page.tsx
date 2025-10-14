import type { Metadata } from 'next';
import fs from 'fs/promises';
import path from 'path';
import Image from 'next/image';
import DiaNBAClient from '@/app/components/DiaNBAClient'; // Importamos o novo componente

export const metadata: Metadata = {
  title: "Tabela e Jogos da NBA | Classificação e Rodadas | Agenda FC",
  description: "Acompanhe a classificação completa das conferências Leste e Oeste da NBA, além dos últimos resultados e próximos jogos da temporada.",
};

// --- Tipos para os dados do JSON ---
type TimeTabelaNBA = { teamId: string; teamName: string; teamBadge: string; rank: string; conference: string; intWin: string; intLoss: string; strPercentage: string; strStreak: string; };
type JogoNBA = { idEvent: string; dateEvent: string; strTime: string; strHomeTeam: string; strAwayTeam: string; intHomeScore: string | null; intAwayScore: string | null; strStatus: string; };

// --- Funções para ler os arquivos ---
async function getTabelaNBA(): Promise<TimeTabelaNBA[] | null> {
  try {
    const filePath = path.join(process.cwd(), "public/importacoes-manuais/nba/tabela.json");
    const jsonData = await fs.readFile(filePath, "utf-8");
    return JSON.parse(jsonData).standings;
  } catch (error) { console.error("🚨 ERRO AO LER tabela da NBA:", error); return null; }
}

async function getJogosNBA(): Promise<JogoNBA[] | null> {
  try {
    const filePath = path.join(process.cwd(), "public/importacoes-manuais/nba/jogos-nba.json");
    const jsonData = await fs.readFile(filePath, "utf-8");
    return JSON.parse(jsonData).events;
  } catch (error) { console.error("🚨 ERRO AO LER jogos da NBA:", error); return null; }
}

// --- Componente da Página ---
export default async function NBAPage() {
  const [tabelaCompleta, todosOsJogos] = await Promise.all([ getTabelaNBA(), getJogosNBA() ]);

  if (!tabelaCompleta || !todosOsJogos) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-6 rounded-lg text-center">
        <h2 className="font-bold text-lg mb-2">Dados da NBA Indisponíveis</h2>
        <p>As informações da NBA estão sendo atualizadas. Por favor, volte mais tarde.</p>
      </div>
    );
  }

  // Separando os dados da tabela
  const tabelaLeste = tabelaCompleta.filter(t => t.conference === 'Leste').sort((a, b) => parseInt(a.rank) - parseInt(b.rank));
  const tabelaOeste = tabelaCompleta.filter(t => t.conference === 'Oeste').sort((a, b) => parseInt(a.rank) - parseInt(b.rank));
  
  // Pegamos a data de hoje para ser o ponto de partida
  const hojeStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date());

  // Componente reutilizável para renderizar uma tabela de conferência
  const TabelaConferencia = ({ title, teams }: { title: string, teams: TimeTabelaNBA[] }) => (
    <div>
      <h2 className="text-2xl font-bold mb-4">{title}</h2>
      <div className="overflow-x-auto bg-white rounded-lg shadow-md">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-3 py-2 text-left font-semibold text-gray-600">#</th>
              <th className="px-3 py-2 text-left font-semibold text-gray-600">Time</th>
              <th className="px-3 py-2 text-center font-semibold text-gray-600">V</th>
              <th className="px-3 py-2 text-center font-semibold text-gray-600">D</th>
              <th className="px-3 py-2 text-center font-semibold text-gray-600">%</th>
              <th className="px-3 py-2 text-center font-semibold text-gray-600">Seq</th>
            </tr>
          </thead>
          <tbody>
            {teams.map((time) => (
              <tr key={time.teamId} className="border-t hover:bg-gray-50">
                <td className="px-3 py-2 font-bold">{time.rank}</td>
                <td className="px-3 py-2 flex items-center">
                  <Image src={time.teamBadge} alt={time.teamName} width={20} height={20} className="w-5 h-5 mr-2" />
                  <span className="font-medium">{time.teamName}</span>
                </td>
                <td className="px-3 py-2 text-center font-bold">{time.intWin}</td>
                <td className="px-3 py-2 text-center">{time.intLoss}</td>
                <td className="px-3 py-2 text-center">{time.strPercentage}</td>
                <td className="px-3 py-2 text-center">{time.strStreak}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div>
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold">NBA - National Basketball Association</h1>
        <p className="text-xl text-gray-600 mt-2">Temporada Regular</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Coluna da Esquerda e Centro: Tabelas */}
        <div className="lg:col-span-2 space-y-8">
          <TabelaConferencia title="Conferência Leste" teams={tabelaLeste} />
          <TabelaConferencia title="Conferência Oeste" teams={tabelaOeste} />
        </div>

        {/* Coluna da Direita: Novo Componente Interativo de Dias */}
        <DiaNBAClient 
          todosOsJogos={todosOsJogos} 
          dataInicial={hojeStr}
        />
      </div>
    </div>
  );
}