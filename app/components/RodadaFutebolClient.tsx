'use client';

import React, { useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

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
  tituloPrefixo?: string; // ex: "Rodada" ou "Semana"
};

export default function RodadaFutebolClient({ 
  todosOsJogos, 
  rodadaInicial,
  tituloPrefixo = "Rodada"
}: Props) {
  // Descobre a menor e a maior rodada disponível
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

  // Filtra os jogos da rodada selecionada
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
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
      {/* SELETOR DE RODADAS COM SETAS */}
      <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
        <button
          onClick={irParaAnterior}
          disabled={rodadaAtual <= menorRodada}
          aria-label="Rodada Anterior"
          className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-gray-700"
        >
          <ChevronLeftIcon className="w-5 h-5" />
        </button>

        <div className="text-center">
          <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Navegar por rodadas</span>
          <h3 className="text-xl font-bold text-gray-900">
            {tituloPrefixo} {rodadaAtual}
          </h3>
        </div>

        <button
          onClick={irParaProxima}
          disabled={rodadaAtual >= maiorRodada}
          aria-label="Próxima Rodada"
          className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-gray-700"
        >
          <ChevronRightIcon className="w-5 h-5" />
        </button>
      </div>

      {/* LISTA DE CONFRONTOS DA RODADA */}
      {jogosDaRodada.length > 0 ? (
        <div className="space-y-3">
          {jogosDaRodada.map((jogo) => {
            const finalizado = jogo.status === 'FINISHED';
            const emAndamento = jogo.status === 'IN_PLAY' || jogo.status === 'PAUSED';

            return (
              <div 
                key={jogo.id} 
                className="bg-gray-50 hover:bg-gray-100/80 transition-colors p-3.5 rounded-xl border border-gray-200/70 flex flex-col gap-2"
              >
                {/* Data / Status */}
                <div className="flex justify-between items-center text-xs text-gray-500 font-medium border-b border-gray-200/50 pb-1.5">
                  <span className="capitalize">{formatarDataHora(jogo.utcDate)}</span>
                  {finalizado && <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-semibold">Finalizado</span>}
                  {emAndamento && <span className="text-red-700 bg-red-50 px-2 py-0.5 rounded font-semibold animate-pulse">Ao Vivo</span>}
                  {!finalizado && !emAndamento && <span className="text-gray-500">Agendado</span>}
                </div>

                {/* Times e Placar */}
                <div className="flex items-center justify-between text-sm font-semibold text-gray-800">
                  {/* Mandante */}
                  <div className="flex items-center gap-2 w-5/12 justify-end text-right">
                    <span className="truncate">{jogo.homeTeam.shortName || jogo.homeTeam.name}</span>
                    <img 
                      src={jogo.homeTeam.crest} 
                      alt={jogo.homeTeam.name} 
                      className="w-5 h-5 object-contain flex-shrink-0" 
                    />
                  </div>

                  {/* Placar ou VS */}
                  <div className="w-2/12 flex justify-center text-center px-1">
                    {finalizado || emAndamento ? (
                      <span className="bg-white px-2.5 py-1 rounded-md border border-gray-300 font-extrabold text-gray-900 shadow-xs">
                        {jogo.score?.fullTime?.home ?? 0} - {jogo.score?.fullTime?.away ?? 0}
                      </span>
                    ) : (
                      <span className="text-gray-400 font-bold text-xs uppercase bg-white px-2 py-1 rounded border border-gray-200">
                        vs
                      </span>
                    )}
                  </div>

                  {/* Visitante */}
                  <div className="flex items-center gap-2 w-5/12 justify-start text-left">
                    <img 
                      src={jogo.awayTeam.crest} 
                      alt={jogo.awayTeam.name} 
                      className="w-5 h-5 object-contain flex-shrink-0" 
                    />
                    <span className="truncate">{jogo.awayTeam.shortName || jogo.awayTeam.name}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-8 text-center text-gray-500 text-sm">
          Nenhum jogo programado para a Rodada {rodadaAtual}.
        </div>
      )}
    </div>
  );
}