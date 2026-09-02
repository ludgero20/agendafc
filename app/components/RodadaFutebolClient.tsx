'use client';

import React, { useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { formatarNomeTime } from '@/lib/campeonatos';

export type JogoFutebol = {
  id: number;
  utcDate: string;
  status: string;
  matchday: number;
  homeTeam: { id: number; name: string; shortName: string; crest: string; };
  awayTeam: { id: number; name: string; shortName: string; crest: string; };
  score: {
    fullTime: { home: number | null; away: number | null; };
  };
};

type Props = {
  todosOsJogos: JogoFutebol[];
  rodadaInicial: number;
  tituloPrefixo?: string;
};

export default function RodadaFutebolClient({ 
  todosOsJogos, 
  rodadaInicial,
  tituloPrefixo = "Rodada"
}: Props) {
  const todasRodadas = Array.from(new Set(todosOsJogos.map(j => j.matchday))).filter(Boolean).sort((a, b) => a - b);
  const menorRodada = todasRodadas[0] || 1;
  const maiorRodada = todasRodadas[todasRodadas.length - 1] || 38;

  const [rodadaAtual, setRodadaAtual] = useState<number>(rodadaInicial || menorRodada);

  const irParaAnterior = () => {
    if (rodadaAtual > menorRodada) setRodadaAtual(prev => prev - 1);
  };

  const irParaProxima = () => {
    if (rodadaAtual < maiorRodada) setRodadaAtual(prev => prev + 1);
  };

  const jogosDaRodada = todosOsJogos
    .filter(j => j.matchday === rodadaAtual)
    .sort((a, b) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime());

  const formatarDataHora = (dataISO: string) => {
    const data = new Date(dataISO);
    return data.toLocaleDateString('pt-BR', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Sao_Paulo'
    }).replace(',', ' às');
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/90 p-5">
      {/* SELETOR DE RODADAS COM SETAS */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
        <button
          onClick={irParaAnterior}
          disabled={rodadaAtual <= menorRodada}
          aria-label="Rodada Anterior"
          className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-slate-700 shadow-2xs"
        >
          <ChevronLeftIcon className="w-5 h-5" />
        </button>

        <div className="text-center">
          <span className="text-[11px] font-bold text-blue-600 uppercase tracking-widest block">Navegar por rodadas</span>
          <h3 className="text-xl font-extrabold text-slate-900 leading-tight">
            {tituloPrefixo} {rodadaAtual}
          </h3>
        </div>

        <button
          onClick={irParaProxima}
          disabled={rodadaAtual >= maiorRodada}
          aria-label="Próxima Rodada"
          className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-slate-700 shadow-2xs"
        >
          <ChevronRightIcon className="w-5 h-5" />
        </button>
      </div>

      {/* LISTA DE CONFRONTOS E PLACARES */}
      {jogosDaRodada.length > 0 ? (
        <div className="space-y-3">
          {jogosDaRodada.map((jogo) => {
            const finalizado = jogo.status === 'FINISHED';
            const emAndamento = jogo.status === 'IN_PLAY' || jogo.status === 'PAUSED';

            const nomeMandante = formatarNomeTime(jogo.homeTeam.shortName, jogo.homeTeam.name);
            const nomeVisitante = formatarNomeTime(jogo.awayTeam.shortName, jogo.awayTeam.name);

            return (
              <div 
                key={jogo.id} 
                className="bg-slate-50/70 hover:bg-slate-100/80 transition-all p-3.5 sm:p-4 rounded-xl border border-slate-200/70 flex flex-col gap-2.5 shadow-2xs"
              >
                {/* Linha de Data e Status */}
                <div className="flex justify-between items-center text-xs text-slate-500 font-semibold border-b border-slate-200/40 pb-1.5">
                  <span className="capitalize">{formatarDataHora(jogo.utcDate)}</span>
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
                    <span className="text-xs sm:text-sm font-bold text-slate-900 truncate">{nomeMandante}</span>
                    <img 
                      src={jogo.homeTeam.crest} 
                      alt={jogo.homeTeam.name} 
                      className="w-5 h-5 sm:w-6 sm:h-6 object-contain flex-shrink-0" 
                    />
                  </div>

                  {/* Placar Esportivo */}
                  <div className="w-[20%] flex justify-center text-center px-1">
                    {finalizado || emAndamento ? (
                      <div className="inline-flex items-center justify-center font-mono font-black text-sm text-slate-900 bg-white border border-slate-300/80 px-2.5 py-1 rounded-lg tracking-wider shadow-2xs">
                        <span>{jogo.score?.fullTime?.home ?? 0}</span>
                        <span className="mx-1 text-slate-300 font-normal">:</span>
                        <span>{jogo.score?.fullTime?.away ?? 0}</span>
                      </div>
                    ) : (
                      <span className="text-[11px] font-black uppercase text-slate-400 bg-white px-2 py-0.5 rounded border border-slate-200/80 shadow-2xs">
                        vs
                      </span>
                    )}
                  </div>

                  {/* Visitante */}
                  <div className="flex items-center gap-2 w-[40%] justify-start text-left">
                    <img 
                      src={jogo.awayTeam.crest} 
                      alt={jogo.awayTeam.name} 
                      className="w-5 h-5 sm:w-6 sm:h-6 object-contain flex-shrink-0" 
                    />
                    <span className="text-xs sm:text-sm font-bold text-slate-900 truncate">{nomeVisitante}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-8 text-center text-slate-400 text-sm">
          Nenhum jogo programado para a Rodada {rodadaAtual}.
        </div>
      )}
    </div>
  );
}