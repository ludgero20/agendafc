'use client';

import React, { useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/solid';

// Tipos
type JogoNFL = {
  idEvent: string;
  intRound: string;
  dateEvent: string;
  strTime: string;
  strHomeTeam: string;
  strAwayTeam: string;
  intHomeScore: string | null;
  intAwayScore: string | null;
  strStatus: string;
};

type Props = {
  todosOsJogos: JogoNFL[];
  rodadaInicial: number;
};

export default function RodadaNFLClient({ todosOsJogos, rodadaInicial }: Props) {
  // Estado para controlar a rodada atual
  const [rodadaAtual, setRodadaAtual] = useState(rodadaInicial);
  const totalRodadas = 18;

  const irParaRodadaAnterior = () => {
    if (rodadaAtual > 1) setRodadaAtual(rodadaAtual - 1);
  };

  const irParaProximaRodada = () => {
    if (rodadaAtual < totalRodadas) setRodadaAtual(rodadaAtual + 1);
  };
  // Filtra os jogos para mostrar apenas os da rodada atual
  const jogosDaRodada = todosOsJogos.filter(jogo => parseInt(jogo.intRound) === rodadaAtual);

  const formatarDataJogoNFL = (data: string, hora: string) => {
    if (!data || !hora) return 'Data a definir';
    const [ano, mes, dia] = data.split('-');
    const dataObj = new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia), ...hora.split(':').map(Number));
    return dataObj.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' });
  };

  return (
    <div className="lg:col-span-1">
      <div className="flex items-center justify-between mb-4">
        <button onClick={irParaRodadaAnterior} disabled={rodadaAtual === 1} className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-50">
          <ChevronLeftIcon className="h-6 w-6 text-gray-600" />
        </button>
        <h2 className="text-2xl font-bold">Rodada {rodadaAtual}</h2>
        <button onClick={irParaProximaRodada} disabled={rodadaAtual === totalRodadas} className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-50">
          <ChevronRightIcon className="h-6 w-6 text-gray-600" />
        </button>
      </div>
      {/* Lista de Jogos da Rodada */}
      {jogosDaRodada.length > 0 ? (
        <div className="space-y-4">
          {jogosDaRodada.map((jogo) => (
            <div key={jogo.idEvent} className="bg-white p-4 rounded-lg shadow-md border">
              <p className="text-sm text-center text-gray-500 mb-2">
                {formatarDataJogoNFL(jogo.dateEvent, jogo.strTime)}
              </p>
              <div className="flex items-center justify-center text-center font-medium">
                {/* Time Visitante */}
                <div className="w-2/5 text-right"><p className="text-sm">{jogo.strAwayTeam}</p></div>
                {/* Placar ou Horário */}
                <div className="w-1/5">
                  {jogo.strStatus === 'Match Finished' ? (
                    <p className="text-lg font-bold">{jogo.intAwayScore} - {jogo.intHomeScore}</p>
                  ) : (
                    <p className="text-sm text-gray-400">{jogo.strTime.substring(0, 5)}</p>
                  )}
                </div>
                {/* Time da Casa */}
                <div className="w-2/5 text-left"><p className="text-sm">{jogo.strHomeTeam}</p></div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white p-4 rounded-lg shadow-md border text-center">
          <p className="text-gray-600">Dados para a rodada {rodadaAtual} não disponíveis.</p>
        </div>
      )}
    </div>
  );
}