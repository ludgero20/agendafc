import type { Metadata } from 'next';
import Link from 'next/link';
import { timesConfig, TimeConfig } from '@/lib/times';

export const metadata: Metadata = {
  title: "Guias de Times e Clubes | Onde Assistir, Tabelas e Jogos | Agenda FC",
  description: "Encontre a página do seu time de futebol ou franquia da NFL favorito com guia de transmissões na TV, classificação e calendário completo de jogos.",
};

export const revalidate = 3600;

export default async function TimesPage() {
  const todosOsTimes = Object.values(timesConfig);

  // Separação por categorias de esporte e ligas
  const timesBrasileirao = todosOsTimes.filter(t => t.competicaoCodigo === 'BSA');
  const timesEuropa = todosOsTimes.filter(t => t.esporte === 'futebol' && t.competicaoCodigo !== 'BSA');
  const timesNFL = todosOsTimes.filter(t => t.esporte === 'nfl');

  const getBadgeColor = (competicaoCodigo: string, esporte: string) => {
    if (esporte === 'nfl') return 'bg-blue-100 text-blue-800 border-blue-200';
    switch (competicaoCodigo) {
      case 'BSA': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'PL': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'PD': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const renderGradeTimes = (times: TimeConfig[]) => (
    <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {times.map((time) => (
        <Link key={time.slug} href={`/time/${time.slug}`} className="group">
          <div className="bg-white hover:bg-slate-50/80 p-5 rounded-2xl transition-all duration-200 border border-slate-200/90 shadow-2xs hover:shadow-md h-full flex flex-col justify-between gap-4 group-hover:-translate-y-0.5">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 flex-shrink-0 flex items-center justify-center p-1 bg-slate-50 rounded-xl border border-slate-100">
                <img src={time.escudo} alt={time.nome} className="w-12 h-12 object-contain group-hover:scale-105 transition-transform" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-base sm:text-lg text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                  {time.nome}
                </h3>
                <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${getBadgeColor(time.competicaoCodigo, time.esporte)}`}>
                  {time.esporte === 'nfl' ? (time.divisaoNFL || 'NFL') : time.competicaoNome}
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-blue-600 group-hover:text-blue-700">
              <span>Ver agenda e tabela</span>
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );

  return (
    <div className="space-y-12 max-w-7xl mx-auto px-4 py-8">
      {/* HEADER DA PÁGINA */}
      <div className="text-center space-y-3">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
          ⚽ Guias de Clubes e Franquias
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          Acompanhe onde assistir aos jogos do seu time ao vivo na TV, a classificação detalhada e o calendário completo da temporada.
        </p>
      </div>

      {/* SEÇÃO 1: BRASILEIRÃO */}
      {timesBrasileirao.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <span>🇧🇷</span> Futebol Brasileiro (Série A)
            </h2>
            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
              {timesBrasileirao.length} clubes
            </span>
          </div>
          {renderGradeTimes(timesBrasileirao)}
        </section>
      )}

      {/* SEÇÃO 2: EUROPA */}
      {timesEuropa.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <span>🌍</span> Gigantes do Futebol Europeu
            </h2>
            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
              {timesEuropa.length} clubes
            </span>
          </div>
          {renderGradeTimes(timesEuropa)}
        </section>
      )}

      {/* SEÇÃO 3: NFL */}
      {timesNFL.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <span>🏈</span> Franquias da NFL
            </h2>
            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
              {timesNFL.length} franquias
            </span>
          </div>
          {renderGradeTimes(timesNFL)}
        </section>
      )}
    </div>
  );
}