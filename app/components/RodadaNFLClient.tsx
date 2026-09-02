'use client';

import React, { useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

export type JogoNFL = {
  idEvent: string; 
  intRound: string; 
  dateEvent: string; 
  strTime: string; 
  strHomeTeam: string;
  strAwayTeam: string; 
  strHomeLogo?: string;
  strAwayLogo?: string;
  intHomeScore: string | null; 
  intAwayScore: string | null; 
  strStatus: string;
};

type Props = {
  todosOsJogos: JogoNFL[];
  rodadaInicial: number;
};

export default function RodadaNFLClient({ 
  todosOsJogos, 
  rodadaInicial 
}: Props) {
  // Coleta todas as semanas disponíveis da NFL
  const todasSemanas = Array.from(new Set(todosOsJogos.map(j => parseInt(j.intRound)))).filter(Boolean).sort((a, b) => a - b);
  const menorSemana = todasSemanas[0] || 1;
  const maiorSemana = todasSemanas[todasSemanas.length - 1] || 18;

  const [semanaAtual, setSemanaAtual] = useState<number>(rodadaInicial || menorSemana);

  const irParaAnterior = () => {
    if (semanaAtual > menorSemana) setSemanaAtual(prev => prev - 1);
  };

  const irParaProxima = () => {
    if (semanaAtual < maiorSemana) setSemanaAtual(prev => prev + 1);
  };

  const jogosDaSemana = todosOsJogos
    .filter(j => parseInt(j.intRound) === semanaAtual)
    .sort((a, b) => a.dateEvent.localeCompare(b.dateEvent));

  const formatarDataBR = (dateStr: string, timeStr: string) => {
    const [ano, mes, dia] = dateStr.split('-').map(Number);
    const dataObj = new Date(ano, mes - 1, dia, 12);
    const diaSemana = dataObj.toLocaleDateString('pt-BR', { weekday: 'short' });
    const diaMes = dataObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    return `${diaSemana}, ${diaMes} às ${timeStr}`;
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/90 p-5">
      {/* SELETOR DE SEMANAS COM SETAS */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
        <button
          onClick={irParaAnterior}
          disabled={semanaAtual <= menorSemana}
          aria-label="Semana Anterior"
          className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-slate-700 shadow-2xs"
        >
          <ChevronLeftIcon className="w-5 h-5" />
        </button>

        <div className="text-center">
          <span className="text-[11px] font-bold text-blue-600 uppercase tracking-widest block">Navegar por rodadas</span>
          <h3 className="text-xl font-extrabold text-slate-900 leading-tight">
            Semana {semanaAtual}
          </h3>
        </div>

        <button
          onClick={irParaProxima}
          disabled={semanaAtual >= maiorSemana}
          aria-label="Próxima Semana"
          className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-slate-700 shadow-2xs"
        >
          <ChevronRightIcon className="w-5 h-5" />
        </button>
      </div>

      {/* LISTA DE CONFRONTOS E PLACARES DA NFL */}
      {jogosDaSemana.length > 0 ? (
        <div className="space-y-3">
          {jogosDaSemana.map((jogo) => {
            const finalizado = jogo.strStatus === 'Match Finished';
            const emAndamento = jogo.strStatus === 'In Progress';

            return (
              <div 
                key={jogo.idEvent} 
                className="bg-slate-50/70 hover:bg-slate-100/80 transition-all p-3.5 sm:p-4 rounded-xl border border-slate-200/70 flex flex-col gap-2.5 shadow-2xs"
              >
                {/* Linha de Data e Status */}
                <div className="flex justify-between items-center text-xs text-slate-500 font-semibold border-b border-slate-200/40 pb-1.5">
                  <span className="capitalize">{formatarDataBR(jogo.dateEvent, jogo.strTime)}</span>
                  {finalizado && (
                    <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60 text-[10px] font-bold uppercase tracking-wider">
                      Finalizado
                    </span>
                  )}
                  {emAndamento && (
                    <span className="inline-flex items-center gap-1 text-red-700 bg-red-50 px-2 py-0.5 rounded-md border border-red-200/60 text-[10px] font-extrabold uppercase tracking-wider animate-pulse">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
                      Ao Vivo
                    </span>
                  )}
                  {!finalizado && !emAndamento && (
                    <span className="text-slate-400 text-[11px] font-medium">Agendado</span>
                  )}
                </div>

                {/* Linha dos Times e Placar */}
                <div className="flex items-center justify-between py-1">
                  {/* Mandante */}
                  <div className="flex items-center gap-2 w-[40%] justify-end text-right">
                    <span className="text-xs sm:text-sm font-bold text-slate-900 truncate">{jogo.strHomeTeam}</span>
                    {jogo.strHomeLogo && (
                      <img 
                        src={jogo.strHomeLogo} 
                        alt={jogo.strHomeTeam} 
                        className="w-5 h-5 sm:w-6 sm:h-6 object-contain flex-shrink-0" 
                      />
                    )}
                  </div>

                  {/* Placar Esportivo da NFL */}
                  <div className="w-[20%] flex justify-center text-center px-1">
                    {finalizado || emAndamento ? (
                      <div className="inline-flex items-center justify-center font-mono font-black text-sm text-slate-900 bg-white border border-slate-300/80 px-2.5 py-1 rounded-lg tracking-wider shadow-2xs">
                        <span>{jogo.intHomeScore ?? 0}</span>
                        <span className="mx-1 text-slate-300 font-normal">:</span>
                        <span>{jogo.intAwayScore ?? 0}</span>
                      </div>
                    ) : (
                      <span className="text-[11px] font-black uppercase text-slate-400 bg-white px-2 py-0.5 rounded border border-slate-200/80 shadow-2xs">
                        vs
                      </span>
                    )}
                  </div>

                  {/* Visitante */}
                  <div className="flex items-center gap-2 w-[40%] justify-start text-left">
                    {jogo.strAwayLogo && (
                      <img 
                        src={jogo.strAwayLogo} 
                        alt={jogo.strAwayTeam} 
                        className="w-5 h-5 sm:w-6 sm:h-6 object-contain flex-shrink-0" 
                      />
                    )}
                    <span className="text-xs sm:text-sm font-bold text-slate-900 truncate">{jogo.strAwayTeam}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-8 text-center text-slate-400 text-sm">
          Nenhum jogo programado para a Semana {semanaAtual}.
        </div>
      )}
    </div>
  );
}