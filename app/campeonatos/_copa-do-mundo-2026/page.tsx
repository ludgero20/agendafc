import type { Metadata } from 'next';
import fs from 'fs/promises';
import path from 'path';

export const metadata: Metadata = {
  title: "Copa do Mundo 2026: Vagas e Seleções Classificadas | Agenda FC",
  description: "Acompanhe a lista completa de seleções classificadas para a Copa do Mundo, vagas de repescagem continental e mundial, e o status das eliminatórias em cada confederação.",
};

// --- Tipos para os dados dos JSONs ---
type Selecao = {
  id: number;
  name: string;
  flagEmoji: string;
  confederation: string;
  status: string;
};
type Confederacao = {
  name: string;
  status: string;
  direct_slots: number;
  continental_playoff_slots: number; // MUDANÇA NO TIPO
  intercontinental_playoff_slots: number; // MUDANÇA NO TIPO
};

// --- Função para ler os arquivos ---
async function getCopaDoMundoData(): Promise<{ selecoes: Selecao[], confederacoes: Confederacao[] }> {
  try {
    const selecoesPath = path.join(process.cwd(), "public/importacoes-manuais/copa-do-mundo-2026/selecoes.json");
    const confederacoesPath = path.join(process.cwd(), "public/importacoes-manuais/copa-do-mundo-2026/confederacoes.json");

    const [selecoesFile, confederacoesFile] = await Promise.all([
      fs.readFile(selecoesPath, "utf-8"),
      fs.readFile(confederacoesPath, "utf-8"),
    ]);
    
    return { 
      selecoes: JSON.parse(selecoesFile).teams || [],
      confederacoes: JSON.parse(confederacoesFile).confederations || []
    };
  } catch (error) {
    console.error("🚨 ERRO AO LER ARQUIVOS da Copa do Mundo:", error);
    return { selecoes: [], confederacoes: [] };
  }
}

// --- Componente da Página ---
export default async function CopaDoMundoPage() {
  const { selecoes, confederacoes } = await getCopaDoMundoData();

  if (selecoes.length === 0) {
    return (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-6 rounded-lg text-center">
            <h2 className="font-bold text-lg mb-2">Informações Indisponíveis</h2>
            <p>Os dados da Copa do Mundo 2026 estão sendo preparados. Volte em breve!</p>
        </div>
    );
  }

  // Agrupando as seleções por confederação
  const selecoesPorConfederacao = selecoes.reduce((acc, time) => {
    const conf = time.confederation;
    if (!acc[conf]) acc[conf] = [];
    acc[conf].push(time);
    return acc;
  }, {} as Record<string, Selecao[]>);

  const ordemConfederacoes = ['CONMEBOL', 'CONCACAF', 'OFC', 'UEFA', 'AFC', 'CAF'];

  // MUDANÇA 2: Função de cor agora diferencia os tipos de repescagem
  const getStatusColor = (status: string) => {
    if (status.includes('Classificado')) return 'text-green-600 font-semibold';
    if (status === 'Repescagem Continental') return 'text-blue-600';
    if (status === 'Repescagem Mundial') return 'text-orange-600';
    return 'text-gray-600';
  };
  
  const sortOrder: Record<string, number> = {
    'Classificado (País Sede)': 1, 'Classificado': 2, 'Repescagem Continental': 3, 'Repescagem Mundial': 4
  };
  const ordenarSelecoes = (times: Selecao[]) => {
    return times.sort((a, b) => {
      const statusOrderA = sortOrder[a.status] || 99;
      const statusOrderB = sortOrder[b.status] || 99;
      if (statusOrderA !== statusOrderB) return statusOrderA - statusOrderB;
      return a.name.localeCompare(b.name);
    });
  };

  return (
    <div className="space-y-12">
      <div className="text-center">
        <h1 className="text-4xl font-bold">🏆 Copa do Mundo 2026</h1>
        <p className="text-xl text-gray-600 mt-2">Vagas e Classificação</p>
      </div>

      <section>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {ordemConfederacoes.map(confName => {
            const times = selecoesPorConfederacao[confName];
            const confData = confederacoes.find(c => c.name === confName);
            if (!times || times.length === 0 || !confData) return null;

            // MUDANÇA 1: Calculando vagas separadamente
            const classificadosCount = times.filter(t => t.status.includes('Classificado')).length;
            const repContinentalCount = times.filter(t => t.status === 'Repescagem Continental').length;
            const repMundialCount = times.filter(t => t.status === 'Repescagem Mundial').length;
            
            const vagasDiretasRestantes = confData.direct_slots - classificadosCount;
            const vagasRepContinentalRestantes = confData.continental_playoff_slots - repContinentalCount;
            const vagasRepMundialRestantes = confData.intercontinental_playoff_slots - repMundialCount;

            return (
              <div key={confName} className="bg-white p-6 rounded-xl border shadow-sm flex flex-col">
                <div className="mb-4">
                  <div className="flex justify-between items-center border-b pb-2">
                    <h2 className="text-2xl font-bold">{confName}</h2>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${confData.status === 'Finalizado' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                      {confData.status}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-2 space-y-1">
                    <p>Vagas Diretas: <span className="font-semibold">{classificadosCount} / {confData.direct_slots}</span> ({vagasDiretasRestantes > 0 ? `${vagasDiretasRestantes} em aberto` : 'Preenchidas'})</p>
                    {confData.continental_playoff_slots > 0 && 
                      <p>Repescagem Continental: <span className="font-semibold">{repContinentalCount} / {confData.continental_playoff_slots}</span> ({vagasRepContinentalRestantes > 0 ? `${vagasRepContinentalRestantes} em aberto` : 'Preenchidas'})</p>
                    }
                    {confData.intercontinental_playoff_slots > 0 && 
                      <p>Repescagem Mundial: <span className="font-semibold">{repMundialCount} / {confData.intercontinental_playoff_slots}</span> ({vagasRepMundialRestantes > 0 ? `${vagasRepMundialRestantes} em aberto` : 'Preenchidas'})</p>
                    }
                  </div>
                </div>
                <div className="overflow-x-auto flex-grow">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left font-semibold text-gray-600">Seleção</th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-600">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ordenarSelecoes(times).map(time => (
                        <tr key={time.id} className="border-t">
                          <td className="px-3 py-2 flex items-center">
                            <span className="text-xl mr-3">{time.flagEmoji}</span>
                            <span className="font-medium">{time.name}</span>
                          </td>
                          <td className={`px-3 py-2 ${getStatusColor(time.status)}`}>
                            {time.status}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Seção para os Grupos */}
      <section>
        <div className="text-center p-8 bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Grupos da Copa</h2>
          <p className="text-gray-600">Aguardando o sorteio oficial da FIFA para a definição dos grupos da primeira fase.</p>
        </div>
      </section>
    </div>
  );
}