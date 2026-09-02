import type { Metadata } from 'next';
import Link from 'next/link';
import { todasCompeticoes, CompeticaoInfo } from '@/lib/campeonatos';

export const metadata: Metadata = {
  title: "Guias de Campeonatos | Tabelas e Jogos | Agenda FC",
  description: "Explore os guias completos com tabelas, classificações e calendários da Fórmula 1, NFL e das principais ligas de futebol do Brasil e do mundo.",
};

export const revalidate = 3600;

export default async function CompeticoesPage() {
  // Filtra as competições ativas que têm página dedicada e ordena
  const competicoes = todasCompeticoes
    .filter((comp: CompeticaoInfo) => comp.ativo && comp.slug && comp.slug.trim() !== "")
    .sort((a, b) => (a.ordem || 999) - (b.ordem || 999));

  const getBadgeColor = (tipo: string) => {
    switch (tipo) {
      case 'Nacional': return 'bg-blue-100 text-blue-800';
      case 'Continental': return 'bg-green-100 text-green-800';
      case 'Copa Nacional': return 'bg-yellow-100 text-yellow-800';
      case 'Futebol Americano': return 'bg-orange-100 text-orange-800';
      case 'Automobilismo': return 'bg-red-100 text-red-800';
      case 'Basquete': return 'bg-orange-100 text-orange-800';
      case 'Mundial': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 py-8">
      <div className="text-center space-y-3">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900">🏆 Guias de Campeonatos</h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          Explore os guias completos com tabelas, classificações e calendários dos seus esportes favoritos.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {competicoes.map((comp) => (
          <Link key={comp.id} href={`/campeonatos/${comp.slug}`}>
            <div className="bg-white hover:bg-slate-50/80 h-full p-6 rounded-2xl transition-all duration-200 border border-slate-200/90 shadow-2xs hover:shadow-md flex flex-col justify-between gap-4">
              <div>
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{comp.bandeiraEmoji}</span>
                    <h3 className="font-bold text-lg text-slate-900">{comp.nome}</h3>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${getBadgeColor(comp.tipo)}`}>
                    {comp.tipo}
                  </span>
                </div>
                <p className="text-slate-600 text-sm">{comp.descricao}</p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-blue-600">
                <span>📍 {comp.pais}</span>
                <span>Ver tabela e rodadas →</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}