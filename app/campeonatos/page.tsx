import fs from 'fs';
import path from 'path';
import Link from 'next/link'; // Importe o Link para o futuro

// --- TIPOS ---
type Competicao = {
  id: number;
  slug?: string; 
  nome: string;
  pais: string;
  tipo: string;
  descricao: string;
  prioridade: number;
  ativo: boolean;
  bandeiraEmoji: string;
};

type GrupoPrioridade = {
  nome: string;
  cor: string;
  descricao: string;
};

// --- FUNÇÃO PARA CARREGAR DADOS (NO SERVIDOR) ---
async function carregarDados() {
  try {
    const filePath = path.join(process.cwd(), 'public', 'competicoes-unificadas.json');
    const jsonData = await fs.promises.readFile(filePath, 'utf-8');
    const data = JSON.parse(jsonData);

    const competicoesAtivas = data.competicoes.filter((comp: Competicao) => comp.ativo);

    return {
      competicoes: competicoesAtivas,
      gruposPrioridade: data.grupos_prioridade as Record<string, GrupoPrioridade>,
    };
  } catch (error) {
    console.error('[ERRO] Falha ao carregar o JSON:', error);
    return { competicoes: [], gruposPrioridade: {} };
  }
}

// --- COMPONENTE DA PÁGINA (SERVER COMPONENT) ---
export default async function Competicoes() {
  const { competicoes, gruposPrioridade } = await carregarDados();

  const competicoesPorPrioridade = competicoes.reduce(
    (acc: Record<number, Competicao[]>, comp: Competicao) => {
      const prioridade = comp.prioridade;
      if (!acc[prioridade]) {
        acc[prioridade] = [];
      }
      acc[prioridade].push(comp);
      return acc;
    }, 
    {} as Record<number, Competicao[]>
  );

  const getBadgeColor = (tipo: string) => {
    switch (tipo) {
      case 'Nacional': return 'bg-blue-100 text-blue-800';
      case 'Continental': return 'bg-green-100 text-green-800';
      case 'Copa Nacional': return 'bg-yellow-100 text-yellow-800';
      case 'Eliminatórias': return 'bg-purple-100 text-purple-800';
      case 'Amistoso': return 'bg-gray-100 text-gray-800';
      case 'Futebol Americano': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center py-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          🏆 Guia de Campeonatos de Futebol e NFL
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          No Agenda FC, você encontra o guia definitivo para acompanhar os principais campeonatos de futebol do Brasil e do mundo. Fique por dentro de tabelas, jogos e resultados.
        </p>
      </div>

      {Object.keys(competicoesPorPrioridade).length === 0 ? (
        <div className="bg-gray-100 rounded-xl p-8 text-center">
          <h3 className="text-2xl font-semibold text-gray-800 mb-2">Em desenvolvimento!</h3>
          <p className="text-gray-600">Os campeonatos serão adicionados em breve.</p>
        </div>
      ) : (
        <div className="space-y-10">
          {[1, 2, 3, 4, 5].map((prioridade) => {
            const competicoesGrupo = competicoesPorPrioridade[prioridade] || [];
            const grupoInfo = gruposPrioridade[prioridade.toString()]; 

            if (competicoesGrupo.length === 0) return null;

            return (
              <div key={prioridade}>
                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${grupoInfo?.cor || 'bg-gray-100 text-gray-800'}`}>
                      Prioridade {prioridade}
                    </span>
                    <h2 className="text-2xl font-bold text-gray-800">
                      {grupoInfo?.nome || `Prioridade ${prioridade}`}
                    </h2>
                  </div>
                  <p className="text-gray-600">{grupoInfo?.descricao}</p>
                </div>

                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {competicoesGrupo.map((comp: Competicao) => (
                    <div key={comp.id} className="bg-white hover:bg-gray-50 p-6 rounded-xl transition-all duration-200 border border-gray-200 shadow-sm">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{comp.bandeiraEmoji}</span>
                          <h3 className="font-bold text-lg text-gray-800">{comp.nome}</h3>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getBadgeColor(comp.tipo)}`}>
                          {comp.tipo}
                        </span>
                      </div>

                      <p className="text-gray-600 text-sm mb-3">{comp.descricao}</p>

                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center text-gray-500">
                          <span className="mr-1">📍</span>
                          <span>{comp.pais}</span>
                        </div>
                        <div className="flex items-center text-gray-400">
                          <span className="mr-1">🏆</span>
                          <span>P{comp.prioridade}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}