// app/components/time/TimesHubClient.tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { TimeConfig } from '@/lib/times';

interface Props {
  todosOsTimes: TimeConfig[];
}

export default function TimesHubClient({ todosOsTimes }: Props) {
  const [abaAtiva, setAbaAtiva] = useState<'futebol' | 'f1' | 'nba' | 'nfl'>('futebol');

  // Filtros por esporte
  const timesBrasileirao = todosOsTimes.filter((t) => t.competicaoCodigo === 'BSA');
  const timesEuropa = todosOsTimes.filter((t) => t.esporte === 'futebol' && t.competicaoCodigo !== 'BSA');
  const timesF1 = todosOsTimes.filter((t) => t.esporte === 'f1');
  const timesNBA = todosOsTimes.filter((t) => t.esporte === 'nba');
  const timesNFL = todosOsTimes.filter((t) => t.esporte === 'nfl');

  const abas = [
    { id: 'futebol', label: '⚽ Futebol' },
    { id: 'f1', label: '🏎️ Fórmula 1' },
    { id: 'nba', label: '🏀 NBA' },
    { id: 'nfl', label: '🏈 NFL' },
  ] as const;

  const getBadgeInfo = (time: TimeConfig) => {
    if (time.esporte === 'f1') {
      return { texto: 'Fórmula 1', cor: 'bg-red-100 text-red-800 border-red-200' };
    }
    if (time.esporte === 'nba') {
      const conf = time.conferenciaNBA === 'Western Conference' ? 'Oeste' : 'Leste';
      return { texto: `Conferência ${conf}`, cor: 'bg-orange-100 text-orange-800 border-orange-200' };
    }
    if (time.esporte === 'nfl') {
      return { texto: time.divisaoNFL || 'NFL', cor: 'bg-blue-100 text-blue-800 border-blue-200' };
    }
    if (time.competicaoCodigo === 'BSA') {
      return { texto: 'Brasileirão', cor: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
    }
    return { texto: time.competicaoNome, cor: 'bg-purple-100 text-purple-800 border-purple-200' };
  };

  const renderGrade = (lista: TimeConfig[]) => (
    <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {lista.map((time) => {
        const badge = getBadgeInfo(time);

        return (
          <Link key={time.slug} href={`/time/${time.slug}`} className="group">
            <div className="bg-white hover:bg-slate-50/80 p-5 rounded-2xl transition-all duration-200 border border-slate-200/90 shadow-2xs hover:shadow-md h-full flex flex-col justify-between gap-4 group-hover:-translate-y-0.5">
              <div className="flex items-center gap-4">
                <div
  className={`w-14 h-14 flex-shrink-0 flex items-center justify-center p-2 rounded-2xl border transition-all ${
    time.corFundoLogo || 'bg-slate-50 border-slate-100'
  }`}
>
  <img
    src={time.escudo}
    alt={time.nome}
    className="max-h-10 max-w-10 object-contain group-hover:scale-105 transition-transform"
    loading="lazy"
    referrerPolicy="no-referrer"
  />
</div>
                <div className="min-w-0 flex-1">
                  {/* Nome do time com suporte a 2 linhas e altura uniforme */}
                  <h3 className="font-bold text-base sm:text-lg text-slate-900 line-clamp-2 leading-snug group-hover:text-blue-600 transition-colors">
                    {time.nome}
                  </h3>
                  <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${badge.cor}`}>
                    {badge.texto}
                  </span>
                </div>
              </div>

              {/* Informação extra para F1 (Pilotos) */}
              {time.esporte === 'f1' && time.pilotos && (
                <div className="pt-2.5 border-t border-slate-100 text-xs text-slate-600 truncate">
                  <span className="font-bold text-slate-800">Pilotos:</span> {time.pilotos.join(' • ')}
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-blue-600 group-hover:text-blue-700">
                <span>{time.esporte === 'f1' ? 'Ver ficha e história' : 'Ver agenda e tabela'}</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );

  return (
    <div className="space-y-8">
      {/* SELETOR EM ABAS (SEM CONTADORES DE NÚMEROS) */}
      <div className="flex justify-center">
        <div className="inline-flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shadow-2xs overflow-x-auto max-w-full">
          {abas.map((aba) => {
            const isActive = abaAtiva === aba.id;
            return (
              <button
                key={aba.id}
                onClick={() => setAbaAtiva(aba.id)}
                className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                {aba.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* CONTEÚDO DA ABA ATIVA */}
      <div>
        {/* ABA: FUTEBOL */}
        {abaAtiva === 'futebol' && (
          <div className="space-y-10">
            {timesBrasileirao.length > 0 && (
              <section className="space-y-4">
                <div className="border-b border-slate-200 pb-2">
                  <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <span>🇧🇷</span> Futebol Brasileiro (Série A)
                  </h2>
                </div>
                {renderGrade(timesBrasileirao)}
              </section>
            )}

            {timesEuropa.length > 0 && (
              <section className="space-y-4">
                <div className="border-b border-slate-200 pb-2">
                  <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <span>🌍</span> Gigantes do Futebol Europeu
                  </h2>
                </div>
                {renderGrade(timesEuropa)}
              </section>
            )}
          </div>
        )}

        {/* ABA: FÓRMULA 1 (11 EQUIPES) */}
        {abaAtiva === 'f1' && (
          <section className="space-y-4">
            <div className="border-b border-slate-200 pb-2">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <span>🏎️</span> Equipes Oficiais da Fórmula 1
              </h2>
            </div>
            {renderGrade(timesF1)}
          </section>
        )}

        {/* ABA: NBA */}
        {abaAtiva === 'nba' && (
          <section className="space-y-4">
            <div className="border-b border-slate-200 pb-2">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <span>🏀</span> Franquias da NBA
              </h2>
            </div>
            {renderGrade(timesNBA)}
          </section>
        )}

        {/* ABA: NFL */}
        {abaAtiva === 'nfl' && (
          <section className="space-y-4">
            <div className="border-b border-slate-200 pb-2">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <span>🏈</span> Franquias da NFL
              </h2>
            </div>
            {renderGrade(timesNFL)}
          </section>
        )}
      </div>
    </div>
  );
}