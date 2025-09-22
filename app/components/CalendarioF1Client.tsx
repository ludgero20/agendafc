'use client';

import React, { useState } from 'react';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';

// Tipos de dados atualizados
type RaceResults = { pole: string; p1: string; p2: string; p3: string; };
type SprintResults = { pole: string; p1: string; p2: string; p3: string; }; // Tipo específico para Sprint
type Corrida = { 
  round: number; 
  raceName: string; 
  circuitName: string; 
  country: string; 
  status: string; 
  results?: RaceResults; 
  sprintResults?: SprintResults; // 'sprintResults' é opcional
  sessoes: { nome: string; data: string; hora: string; transmissao: string[]; }[]; 
};

type Props = { calendario: Corrida[]; };

export default function CalendarioF1Client({ calendario }: Props) {
  const [expandedRounds, setExpandedRounds] = useState<Record<string, boolean>>({});

  const toggleRound = (round: number) => {
    setExpandedRounds(prev => ({ ...prev, [round]: !prev[round] }));
  };

  const formatarDataSessao = (data: string) => {
    const [ano, mes, dia] = data.split('-');
    return `${dia}/${mes}`;
  };

  return (
    <section>
      <h2 className="text-3xl font-bold text-gray-800 mb-6 border-b pb-4">Calendário de Corridas</h2>
      <div className="space-y-6">
        {calendario.map((corrida) => {
          const isExpanded = expandedRounds[corrida.round];
          return (
            <div key={corrida.round} className="bg-white p-6 rounded-xl border shadow-sm">
              <button onClick={() => toggleRound(corrida.round)} className="w-full flex flex-col sm:flex-row justify-between sm:items-center text-left">
                <div>
                  <p className="text-sm text-blue-600 font-semibold">Etapa {corrida.round}</p>
                  <h3 className="text-2xl font-bold">{corrida.country} {corrida.raceName}</h3>
                  <p className="text-gray-500">{corrida.circuitName}</p>
                </div>
                <div className="flex items-center mt-2 sm:mt-0">
                  <div className={`text-sm font-bold px-3 py-1 rounded-full ${
                    corrida.status === 'Próxima Corrida' ? 'bg-green-100 text-green-800' : 
                    corrida.status === 'Finalizado' ? 'bg-gray-100 text-gray-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {corrida.status}
                  </div>
                  <div className="ml-4">
                    {isExpanded ? <ChevronUpIcon className="h-6 w-6 text-gray-500" /> : <ChevronDownIcon className="h-6 w-6 text-gray-500" />}
                  </div>
                </div>
              </button>

              {isExpanded && (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mt-4 pt-4 border-t">
                    {corrida.sessoes.map((sessao) => (
                      <div key={sessao.nome} className="bg-gray-50 p-3 rounded-lg text-center">
                        <p className="font-semibold text-gray-800">{sessao.nome}</p>
                        <p className="text-gray-600">{formatarDataSessao(sessao.data)} - {sessao.hora || ' indefinido'}</p>
                        {corrida.status !== 'Finalizado' && sessao.transmissao.length > 0 && (
                          <p className="text-xs font-medium text-blue-800 bg-blue-100 mt-2 px-2 py-1 rounded-full">{sessao.transmissao.join(' / ')}</p>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Bloco para exibir os resultados */}
                  {corrida.status === 'Finalizado' && (corrida.results || corrida.sprintResults) && (
                    <div className="mt-4 pt-4 border-t space-y-4">
                      <h4 className="font-bold text-lg text-center sm:text-left">Resultados</h4>

                      {/* Resultados da Corrida Sprint (só aparece se existir) */}
                      {corrida.sprintResults && (
                        <div>
                          <p className="font-semibold text-center mb-2">Corrida Sprint</p>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                            <div className="bg-amber-50 p-2 rounded-lg"><p className="text-sm font-semibold">⏱️ Pole Sprint</p><p className="text-gray-700">{corrida.sprintResults.pole}</p></div>
                            <div className="bg-yellow-100 p-2 rounded-lg"><p className="text-sm font-semibold">🥇 1º Lugar</p><p className="text-gray-700">{corrida.sprintResults.p1}</p></div>
                            <div className="bg-gray-100 p-2 rounded-lg"><p className="text-sm font-semibold">🥈 2º Lugar</p><p className="text-gray-700">{corrida.sprintResults.p2}</p></div>
                            <div className="bg-orange-50 p-2 rounded-lg"><p className="text-sm font-semibold">🥉 3º Lugar</p><p className="text-gray-700">{corrida.sprintResults.p3}</p></div>
                          </div>
                        </div>
                      )}

                      {/* Resultados da Corrida Principal (só aparece se existir) */}
                      {corrida.results && (
                        <div>
                           <p className="font-semibold text-center mb-2 mt-4 sm:mt-0">Corrida Principal</p>
                           <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                            <div className="bg-amber-50 p-2 rounded-lg"><p className="text-sm font-semibold">⏱️ Pole Position</p><p className="text-gray-700">{corrida.results.pole}</p></div>
                            <div className="bg-yellow-100 p-2 rounded-lg"><p className="text-sm font-semibold">🥇 1º Lugar</p><p className="text-gray-700">{corrida.results.p1}</p></div>
                            <div className="bg-gray-100 p-2 rounded-lg"><p className="text-sm font-semibold">🥈 2º Lugar</p><p className="text-gray-700">{corrida.results.p2}</p></div>
                            <div className="bg-orange-50 p-2 rounded-lg"><p className="text-sm font-semibold">🥉 3º Lugar</p><p className="text-gray-700">{corrida.results.p3}</p></div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}