// app/time/page.tsx
import type { Metadata } from 'next';
import { timesConfig } from '@/lib/times';
import TimesHubClient from '@/app/components/time/TimesHubClient';

export const metadata: Metadata = {
  title: "Guias de Times, Franquias e Equipes de F1 | Agenda FC",
  description: "Encontre a página do seu time de futebol, franquia da NBA ou NFL e equipes da Fórmula 1 com transmissões na TV, tabela e calendário completo.",
};

export const revalidate = 3600;

export default async function TimesPage() {
  const todosOsTimes = Object.values(timesConfig);

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 py-8">
      {/* HEADER DA PÁGINA */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
          🏆 Guias de Clubes, Franquias e Equipes
        </h1>
        <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto">
          Acompanhe onde assistir aos jogos na TV, a classificação detalhada e o histórico completo do seu time do coração.
        </p>
      </div>

      {/* HUB INTERATIVO EM ABAS */}
      <TimesHubClient todosOsTimes={todosOsTimes} />
    </div>
  );
}