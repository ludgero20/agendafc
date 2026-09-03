'use client';

import React, { useState, useMemo } from 'react';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';

// Tipos de dados
type RaceResults = { pole: string; p1: string; p2: string; p3: string; };
type SprintResults = { pole: string; p1: string; p2: string; p3: string; };

type Corrida = { 
  round: number; 
  raceName: string; 
  circuitName: string; 
  country: string; 
  status: string; 
  results?: RaceResults; 
  sprintResults?: SprintResults; 
  sessoes: { nome: string; data: string; hora: string; transmissao: string[]; }[]; 
};

type Props = { calendario: Corrida[]; };

export default function CalendarioF1Client({ calendario }: Props) {
  // 🎯 IDENTIFICA AUTOMATICAMENTE O PRÓXIMO GP E JÁ DEIXA ELE ABERTO POR PADRÃO
  const proximoRoundId = useMemo(() => {
    const hojeStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date());
    // Procura o primeiro GP cuja corrida principal seja hoje ou no futuro
    const proximoGP = calendario.find(c => {
      const sessaoCorrida = c.sessoes.find(s => s.nome.toLowerCase().includes('corrida') && !s.nome.toLowerCase().includes('sprint'));
      const dataCorrida = sessaoCorrida?.data || c.sessoes[c.sessoes.length - 1]?.data || '';
      return dataCorrida >= hojeStr && c.status !== 'Finalizado';
    });
    return proximoGP?.round || (calendario[0]?.round ?? 1);
  }, [calendario]);

  // Inicia com o próximo GP aberto
  const [expandedRounds, setExpandedRounds] = useState<Record<string, boolean>>({
    [proximoRoundId]: true
  });

  const toggleRound = (round: number) => {
    setExpandedRounds(prev => ({ ...prev, [round]: !prev[round] }));
  };

  // 📅 FORMATAÇÃO COM DIA DA SEMANA (ex: "Sex, 05/09")
  const formatarDataSessao = (dataStr: string) => {
    if (!dataStr) return "";
    const [ano, mes, dia] = dataStr.split('-').map(Number);
    const dataObj = new Date(ano, mes - 1, dia, 12);
    const diaSemana = dataObj.toLocaleDateString('pt-BR', { weekday: 'short' });
    const diaFormatado = dataObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    const diaSemanaCap = diaSemana.charAt(0).toUpperCase() + diaSemana.slice(1);
    return `${diaSemanaCap}, ${diaFormatado}`;
  };

  const formatarCanais = (transmissao: any) => {
    if (Array.isArray(transmissao)) return transmissao.join(' • ');
    return String(transmissao || '');
  };

  return (
    <section className="space-y-6">
      <div className="border-b border-slate-200 pb-3">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-2.5">
          <span>🏎️</span> Calendário Oficial de Corridas
        </h2>
      </div>

      <div className="space-y-4">
        {calendario.map((corrida) => {
          const isExpanded = Boolean(expandedRounds[corrida.round]);
          const ehProximo = corrida.round === proximoRoundId && corrida.status !== 'Finalizado';
          const finalizado = corrida.status === 'Finalizado';

          return (
            <div 
              key={corrida.round} 
              className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden ${
                ehProximo 
                  ? 'border-blue-500/80 shadow-md ring-2 ring-blue-500/10' 
                  : 'border-slate-200/90 shadow-2xs hover:shadow-xs'
              }`}
            >
              {/* CABEÇALHO DO GP */}
              <button 
                onClick={() => toggleRound(corrida.round)} 
                aria-expanded={isExpanded}
                className={`w-full p-5 sm:p-6 flex flex-col sm:flex-row justify-between sm:items-center text-left gap-4 transition-colors ${
                  ehProximo ? 'bg-blue-50/30 hover:bg-blue-50/50' : 'hover:bg-slate-50/60'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black uppercase tracking-widest text-blue-600">Etapa {corrida.round}</span>
                    {ehProximo && (
                      <span className="bg-blue-600 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider animate-pulse">
                        Próxima Etapa
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
                    <span className="mr-2 text-2xl">{corrida.country}</span>
                    {corrida.raceName}
                  </h3>
                  <p className="text-xs sm:text-sm font-medium text-slate-500">📍 {corrida.circuitName}</p>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 flex-shrink-0">
                  <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
                    finalizado 
                      ? 'bg-slate-100 text-slate-700 border-slate-200' 
                      : ehProximo
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200 font-extrabold'
                      : 'bg-blue-50 text-blue-800 border-blue-200'
                  }`}>
                    {finalizado ? 'Finalizado' : (ehProximo ? 'Em Breve' : 'Agendado')}
                  </span>

                  <div className="p-1.5 rounded-lg bg-white border border-slate-200/80 text-slate-500">
                    {isExpanded ? <ChevronUpIcon className="h-5 w-5 text-slate-700" /> : <ChevronDownIcon className="h-5 w-5 text-slate-700" />}
                  </div>
                </div>
              </button>

              {/* CORPO EXPANDIDO COM AS SESSÕES E RESULTADOS */}
              {isExpanded && (
                <div className="p-5 sm:p-6 bg-slate-50/40 border-t border-slate-100 space-y-6">
                  
                  {/* GRADE DE SESSÕES (Treinos, Classificação, Corrida) */}
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-3 flex items-center gap-1.5">
                      <span>🕒</span> Programação dos Treinos e Corridas
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                      {corrida.sessoes.map((sessao) => {
                        const ehCorridaPrincipal = sessao.nome.toLowerCase() === 'corrida';
                        const ehSprint = sessao.nome.toLowerCase().includes('sprint');

                        return (
                          <div 
                            key={sessao.nome} 
                            className={`p-3.5 rounded-xl border flex flex-col justify-between gap-2 shadow-2xs ${
                              ehCorridaPrincipal 
                                ? 'bg-white border-blue-300 ring-1 ring-blue-500/20' 
                                : ehSprint 
                                ? 'bg-white border-purple-200'
                                : 'bg-white border-slate-200/80'
                            }`}
                          >
                            <div>
                              <p className={`text-xs font-bold ${ehCorridaPrincipal ? 'text-blue-700 font-extrabold' : 'text-slate-800'}`}>
                                {sessao.nome}
                              </p>
                              <p className="text-xs font-semibold text-slate-600 mt-1">
                                {formatarDataSessao(sessao.data)} • <span className="font-extrabold text-slate-900">{sessao.hora || 'A definir'}</span>
                              </p>
                            </div>

                            {sessao.transmissao && sessao.transmissao.length > 0 && (
                              <div className="pt-2 border-t border-slate-100 mt-1">
                                <span className="text-[10px] font-bold text-slate-700 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200/60 block truncate text-center">
                                  📺 {formatarCanais(sessao.transmissao)}
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* BLOCO DE RESULTADOS (Se o GP estiver finalizado) */}
                  {finalizado && (corrida.results || corrida.sprintResults) && (
                    <div className="pt-4 border-t border-slate-200/80 space-y-5">
                      <h4 className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
                        <span>🏆</span> Resultados Oficiais da Etapa
                      </h4>

                      {/* Resultados da Corrida Sprint */}
                      {corrida.sprintResults && (
                        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs space-y-3">
                          <p className="text-xs font-black uppercase tracking-wider text-purple-700 flex items-center gap-1.5">
                            <span>🏎️</span> Corrida Sprint
                          </p>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/60">
                              <p className="text-[11px] font-bold text-slate-500">⏱️ Pole Sprint</p>
                              <p className="text-xs sm:text-sm font-black text-slate-900 mt-0.5">{corrida.sprintResults.pole || '-'}</p>
                            </div>
                            <div className="bg-amber-50/80 p-2.5 rounded-lg border border-amber-200/60">
                              <p className="text-[11px] font-bold text-amber-800">🥇 1º Lugar</p>
                              <p className="text-xs sm:text-sm font-black text-amber-950 mt-0.5">{corrida.sprintResults.p1 || '-'}</p>
                            </div>
                            <div className="bg-slate-100/70 p-2.5 rounded-lg border border-slate-200">
                              <p className="text-[11px] font-bold text-slate-600">🥈 2º Lugar</p>
                              <p className="text-xs sm:text-sm font-black text-slate-900 mt-0.5">{corrida.sprintResults.p2 || '-'}</p>
                            </div>
                            <div className="bg-orange-50/80 p-2.5 rounded-lg border border-orange-200/60">
                              <p className="text-[11px] font-bold text-orange-800">🥉 3º Lugar</p>
                              <p className="text-xs sm:text-sm font-black text-orange-950 mt-0.5">{corrida.sprintResults.p3 || '-'}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Resultados da Corrida Principal */}
                      {corrida.results && (
                        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs space-y-3">
                          <p className="text-xs font-black uppercase tracking-wider text-blue-700 flex items-center gap-1.5">
                            <span>🏁</span> Grande Prêmio (Corrida Principal)
                          </p>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/60">
                              <p className="text-[11px] font-bold text-slate-500">⏱️ Pole Position</p>
                              <p className="text-xs sm:text-sm font-black text-slate-900 mt-0.5">{corrida.results.pole || '-'}</p>
                            </div>
                            <div className="bg-amber-50/80 p-2.5 rounded-lg border border-amber-200/60">
                              <p className="text-[11px] font-bold text-amber-800">🥇 Vencedor</p>
                              <p className="text-xs sm:text-sm font-black text-amber-950 mt-0.5">{corrida.results.p1 || '-'}</p>
                            </div>
                            <div className="bg-slate-100/70 p-2.5 rounded-lg border border-slate-200">
                              <p className="text-[11px] font-bold text-slate-600">🥈 2º Lugar</p>
                              <p className="text-xs sm:text-sm font-black text-slate-900 mt-0.5">{corrida.results.p2 || '-'}</p>
                            </div>
                            <div className="bg-orange-50/80 p-2.5 rounded-lg border border-orange-200/60">
                              <p className="text-[11px] font-bold text-orange-800">🥉 3º Lugar</p>
                              <p className="text-xs sm:text-sm font-black text-orange-950 mt-0.5">{corrida.results.p3 || '-'}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}