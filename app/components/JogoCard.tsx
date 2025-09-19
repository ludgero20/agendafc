"use client";

import React from 'react';

type JogoProps = {
  campeonato: string;
  time1: string;
  time2: string;
  hora: string;
  canal: string;
  bandeira?: string;
};

export default function JogoCard({ campeonato, time1, time2, hora, canal, bandeira = '🌎' }: JogoProps) {
  // Todas as funções duplicadas foram removidas - agora usa dados do JSON unificado

  return (
    <div className="bg-gray-100 hover:bg-gray-200 shadow-sm hover:shadow-md p-6 rounded-xl transition-all duration-200 border border-gray-200">
      <h3 className="font-bold text-lg mb-3 text-gray-800 flex items-center">
        <span className="mr-2">{bandeira}</span>
        {campeonato}
      </h3>
      <div className="flex items-center justify-center mb-4">
        <span className="text-xl font-semibold text-blue-600">{time1}</span>
        <span className="mx-4 text-gray-400 font-bold">VS</span>
        <span className="text-xl font-semibold text-blue-600">{time2}</span>
      </div>
      <div className="flex justify-between items-center text-sm text-gray-600">
        <span className="flex items-center">
          🕒 {hora}
        </span>
        <span className="flex items-center">
          📺 {canal}
        </span>
      </div>
    </div>
  );
}