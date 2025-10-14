'use client';

import React, { useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/solid';

// Tipos de dados que o componente recebe
type JogoNBA = {
  idEvent: string;
  dateEvent: string;
  strTime: string;
  strHomeTeam: string;
  strAwayTeam: string;
  intHomeScore: string | null;
  intAwayScore: string | null;
  strStatus: string;
};

type Props = {
  todosOsJogos: JogoNBA[];
  dataInicial: string; // Data inicial no formato "YYYY-MM-DD"
};

export default function DiaNBAClient({ todosOsJogos, dataInicial }: Props) {
  const [dataExibida, setDataExibida] = useState(new Date(`${dataInicial}T12:00:00Z`));

  // ==================================================================
  // NOVA LÓGICA DE NAVEGAÇÃO
  // ==================================================================

  // 1. Criamos uma lista ordenada de todas as datas que têm jogos
  const diasComJogos = [...new Set(todosOsJogos.map(jogo => jogo.dateEvent))].sort();

  // 2. Encontramos o índice da data atual na nossa lista
  const dataExibidaStr = new Intl.DateTimeFormat('en-CA').format(dataExibida);
  const indiceAtual = diasComJogos.indexOf(dataExibidaStr);

  // 3. As funções agora pulam para o próximo/anterior índice da lista
  const irParaDiaAnteriorComJogo = () => {
    if (indiceAtual > 0) {
      const dataAnterior = diasComJogos[indiceAtual - 1];
      setDataExibida(new Date(`${dataAnterior}T12:00:00Z`));
    }
  };

  const irParaProximoDiaComJogo = () => {
    if (indiceAtual < diasComJogos.length - 1) {
      const proximaData = diasComJogos[indiceAtual + 1];
      setDataExibida(new Date(`${proximaData}T12:00:00Z`));
    }
  };
  // ==================================================================

  const jogosDoDia = todosOsJogos.filter(jogo => jogo.dateEvent === dataExibidaStr);

  // Formata a data para o cabeçalho (ex: "Hoje, 14 de Outubro")
  const formatarCabecalhoData = (data: Date): string => {
    const hoje = new Date(new Intl.DateTimeFormat('en-CA').format(new Date()) + 'T12:00:00Z');
    const ontem = new Date(hoje);
    ontem.setDate(hoje.getDate() - 1);
    const amanha = new Date(hoje);
    amanha.setDate(hoje.getDate() + 1);

    if (data.toDateString() === hoje.toDateString()) return `Hoje, ${data.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}`;
    if (data.toDateString() === ontem.toDateString()) return `Ontem, ${data.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}`;
    if (data.toDateString() === amanha.toDateString()) return `Amanhã, ${data.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}`;
    
    return data.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
  };

  return (
    <div className="lg:col-span-1">
      {/* Cabeçalho com Navegação */}
      <div className="flex items-center justify-between mb-4">
        <button 
          onClick={irParaDiaAnteriorComJogo} 
          disabled={indiceAtual <= 0} // Desabilita se for o primeiro dia com jogos
          className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="Dia Anterior com Jogos"
        >
          <ChevronLeftIcon className="h-6 w-6 text-gray-600" />
        </button>
        <h2 className="text-xl font-bold text-center">{formatarCabecalhoData(dataExibida)}</h2>
        <button 
          onClick={irParaProximoDiaComJogo}
          disabled={indiceAtual >= diasComJogos.length - 1} // Desabilita se for o último dia
          className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="Próximo Dia com Jogos"
        >
          <ChevronRightIcon className="h-6 w-6 text-gray-600" />
        </button>
      </div>

      {/* Lista de Jogos do Dia */}
      {jogosDoDia.length > 0 ? (
        <div className="space-y-4">
          {jogosDoDia.sort((a,b) => a.strTime.localeCompare(b.strTime)).map((jogo) => (
            <div key={jogo.idEvent} className="bg-white p-4 rounded-lg shadow-md border">
              <div className="flex items-center justify-center text-center font-medium">
                <div className="w-2/5 text-right"><p className="text-sm">{jogo.strAwayTeam}</p></div>
                
                <div className="w-1/5">
                  {jogo.strStatus === 'Match Finished' ? (
                    <p className="text-lg font-bold">{jogo.intAwayScore} - {jogo.intHomeScore}</p>
                  ) : (
                    <p className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-md">{jogo.strTime ? jogo.strTime.substring(0, 5) : '-'}</p>
                  )}
                </div>

                <div className="w-2/5 text-left"><p className="text-sm">{jogo.strHomeTeam}</p></div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white p-6 rounded-lg shadow-md border text-center">
          <p className="text-gray-600">Nenhum jogo agendado para este dia.</p>
        </div>
      )}
    </div>
  );
}