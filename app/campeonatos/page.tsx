import type { Metadata } from 'next';
import fs from 'fs';
import path from 'path';
import Link from 'next/link';

export const metadata: Metadata = {
  title: "Guias de Campeonatos | Tabelas e Jogos | Agenda FC",
  description: "Explore os guias completos com tabelas, classificações e calendários da Fórmula 1, NFL e das principais ligas de futebol do Brasil e do mundo.",
};

// Tipos
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

// A função que carerga os dados agora filtra e ordena as competições
async function carregarCompeticoesComPagina() {
  const filePath = path.join(process.cwd(), 'public', 'competicoes-unificadas.json');
  const jsonData = fs.readFileSync(filePath, 'utf-8');
  const data = JSON.parse(jsonData);

  // Filtra por campeonatos que são ativos E que têm um slug válido
  const competicoesComPagina: Competicao[] = data.competicoes.filter(
    (comp: Competicao) => comp.ativo && comp.slug && comp.slug.trim() !== ""
  );
  
  // Ordena a lista final pelo campo 'ordem'
  competicoesComPagina.sort((a, b) => (a.ordem || 999) - (b.ordem || 999));

  return competicoesComPagina;
}

export default async function Competicoes() {
  const competicoes = await carregarCompeticoesComPagina();

  const getBadgeColor = (tipo: string) => {
    switch (tipo) {
      case 'Nacional': return 'bg-blue-100 text-blue-800';
      case 'Continental': return 'bg-green-100 text-green-800';
      case 'Copa Nacional': return 'bg-yellow-100 text-yellow-800';
      case 'Futebol Americano': return 'bg-orange-100 text-orange-800';
      case 'Corrida': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center py-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">🏆 Guias de Campeonatos</h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Explore os guias completos com tabelas, classificações e calendários dos seus esportes favoritos.
        </p>
      </div>

      {/* MUDANÇA 2: Voltamos a ter uma única grade, sem as seções separadas */}
      {competicoes.length === 0 ? (
        <div className="bg-gray-100 rounded-xl p-8 text-center">
          <p className="text-gray-600">Nenhum guia completo disponível no momento.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {competicoes.map((comp) => (
            <Link key={comp.id} href={`/campeonatos/${comp.slug}`}>
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
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}