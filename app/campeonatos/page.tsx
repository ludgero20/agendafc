import type { Metadata } from 'next';
import fs from 'fs';
import path from 'path';
import Link from 'next/link';

export const metadata: Metadata = {
  title: "Guia de Campeonatos de Futebol | Agenda FC",
  description: "Explore todos os campeonatos cobertos pelo Agenda FC. Acompanhe o Brasileirão, Champions League, Premier League, NFL e muitas outras ligas e copas.",
};

// ... (O tipo 'Competicao' continua o mesmo)
type Competicao = {
  id: number;
  nome: string;
  slug?: string;
  pais: string;
  tipo: string;
  descricao: string;
  prioridade: number;
  ordem?: number;
  ativo: boolean;
  bandeiraEmoji: string;
};


// 1. A função de carregamento agora separa as competições em duas listas
async function carregarCompeticoes() {
  const filePath = path.join(process.cwd(), 'public', 'competicoes-unificadas.json');
  const jsonData = fs.readFileSync(filePath, 'utf-8');
  const data = JSON.parse(jsonData);

  const competicoesAtivas: Competicao[] = data.competicoes.filter((comp: Competicao) => comp.ativo);

  const comPagina: Competicao[] = [];
  const semPagina: Competicao[] = [];

  competicoesAtivas.forEach(comp => {
    if (comp.slug && comp.slug.trim() !== "") {
      comPagina.push(comp);
    } else {
      semPagina.push(comp);
    }
  });

  // Ordena ambas as listas pelo campo 'ordem'
  comPagina.sort((a, b) => (a.ordem || 999) - (b.ordem || 999));
  semPagina.sort((a, b) => (a.ordem || 999) - (b.ordem || 999));

  return { comPagina, semPagina };
}

export default async function Competicoes() {
  const { comPagina, semPagina } = await carregarCompeticoes();

  const getBadgeColor = (tipo: string) => {
    switch (tipo) {
        case 'Nacional': return 'bg-blue-100 text-blue-800';
        case 'Continental': return 'bg-green-100 text-green-800';
        case 'Copa Nacional': return 'bg-yellow-100 text-yellow-800';
        case 'Eliminatórias': return 'bg-purple-100 text-purple-800';
        case 'Amistoso': return 'bg-gray-100 text-gray-800';
        case 'Futebol Americano': return 'bg-red-100 text-red-800';
        default: return 'bg-gray-100 text-gray-800';
    }
  };


  // Componente reutilizável para renderizar a grade de cards
  const CardGrid = ({ competicoes }: { competicoes: Competicao[] }) => (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      {competicoes.map((comp) => {
        const cardContent = (
          <div className="bg-white hover:bg-gray-50 h-full p-6 rounded-xl transition-all duration-200 border border-gray-200 shadow-sm flex flex-col">
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">{comp.bandeiraEmoji}</span>
                <h3 className="font-bold text-lg text-gray-800">{comp.nome}</h3>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getBadgeColor(comp.tipo)}`}>
                {comp.tipo}
              </span>
            </div>
            <p className="text-gray-600 text-sm mb-3 flex-grow">{comp.descricao}</p>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center text-gray-500">
                <span className="mr-1">📍</span>
                <span>{comp.pais}</span>
              </div>
            </div>
          </div>
        );

        if (comp.slug) {
          return <Link key={comp.id} href={`/campeonatos/${comp.slug}`}>{cardContent}</Link>;
        }
        return <div key={comp.id}>{cardContent}</div>;
      })}
    </div>
  );

  return (
    <div className="space-y-12">
      <div className="text-center py-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">🏆 Campeonatos</h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Explore guias completos com tabelas e jogos ou acompanhe a agenda dos seus campeonatos favoritos.
        </p>
      </div>

      {/* 2. Renderiza a primeira seção com os guias completos */}
      <section>
        <h2 className="text-3xl font-bold text-gray-800 mb-6 border-b pb-4">Guias Completos</h2>
        {comPagina.length > 0 ? <CardGrid competicoes={comPagina} /> : <p className="text-gray-600">Nenhum guia completo disponível no momento.</p>}
      </section>

      {/* 3. Renderiza a segunda seção com os outros campeonatos */}
      <section>
        <h2 className="text-3xl font-bold text-gray-800 mb-6 border-b pb-4">Outros Campeonatos com Agenda</h2>
        {semPagina.length > 0 ? <CardGrid competicoes={semPagina} /> : <p className="text-gray-600">Nenhum outro campeonato para exibir.</p>}
      </section>
    </div>
  );
}