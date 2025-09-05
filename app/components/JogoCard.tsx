"use client";

import React from 'react';

type JogoProps = {
  campeonato: string;
  time1: string;
  time2: string;
  hora: string;
  canal: string;
};

export default function JogoCard({ campeonato, time1, time2, hora, canal }: JogoProps) {
  const getPrioridadeCampeonato = (comp: string): number => {
    // GRUPO 1 - MÁXIMA PRIORIDADE (Futebol Brasileiro)
    if (['Brasileirão Série A', 'Brasileirão Série B', 'Brasileirão Série C', 'Brasileirão Série D (quartas)', 'Brasileirão Feminino (final)', 'Copa do Brasil', 'Copa do Nordeste (final)'].includes(comp)) {
      return 1;
    }
    // GRUPO 2 - ALTA PRIORIDADE (Sul-América)
    if (['Eliminatórias Sul-Americanas', 'Copa Libertadores da América', 'Copa Sul-Americana', 'Copa da Argentina', 'Supercopa da Argentina', 'Campeonato Uruguaio'].includes(comp)) {
      return 2;
    }
    // GRUPO 3 - PRIORIDADE MÉDIA (Europa Top)
    if (['Champions League', 'Europa League', 'Premier League', 'La Liga', 'Serie A', 'Bundesliga', 'Ligue 1', 'Campeonato Português', 'Eliminatórias Europeias'].includes(comp)) {
      return 3;
    }
    // GRUPO 4 - PRIORIDADE BAIXA (Outras Competições)
    if (['Copa da Inglaterra', 'Copa da França', 'Copa da Alemanha', 'Copa de Portugal', 'Copa da Itália', 'Copa da Espanha', 'MLS', 'Eliminatórias Africanas', 'Copa da Liga Japonesa (quartas)'].includes(comp)) {
      return 4;
    }
    // GRUPO 5 - PRIORIDADE MÍNIMA
    return 5;
  };

  const getBandeiraPorCompeticao = (comp: string) => {
    switch (comp) {
      case 'Brasileirão Série A':
      case 'Brasileirão Série B':
      case 'Brasileirão Série C':
      case 'Brasileirão Série D (quartas)':
      case 'Brasileirão Feminino (final)':
      case 'Brasileirão Feminino sub-20':
      case 'Copa do Brasil':
      case 'Copa do Nordeste (final)':
      case 'Copa do Brasil':
        return '🇧🇷';
      case 'Libertadores da América':
      case 'Copa Sul-Americana':
        return '🌎';
      case 'Premier League':
      case 'Campeonato Inglês Feminino':
      case 'Campeonato Inglês (Quarta Divisão)':
        return '🏴󠁧󠁢󠁥󠁮󠁧󠁿';
      case 'Campeonato Norte-Irlandês':
        return '🏴󠁧󠁢󠁮󠁩󠁲󠁿';
      case 'La Liga':
      case 'Campeonato Espanhol (Segunda Divisão)':
        return '🇪🇸';
      case 'Serie A':
        return '🇮🇹';
      case 'Ligue 1':
        return '🇫🇷';
      case 'Saudi Pro League':
        return '🇸🇦';
      case 'Champions League':
      case 'Europa League':
      case 'Eliminatórias Europeias':
        return '🇪🇺';
      case 'Eliminatórias Africanas':
        return '🌍';
      case 'Eliminatórias Sul-Americanas':
        return '🌎';
      case 'Eliminatórias da Concacaf':
        return '🇺🇸';
      case 'Amistoso Internacional':
        return '🌐';
      case 'Campeonato Uruguaio':
        return '🇺🇾';
      case 'Copa da Argentina':
      case 'Supercopa da Argentina':
        return '🇦🇷';
      case 'Liga Feminina dos EUA':
      case 'MLS':
        return '🇺🇸';
      case 'Campeonato Holandês (Segunda Divisão)':
        return '🇳🇱';
      case 'Campeonato Português':
        return '🇵🇹';
      case 'Copa da Liga Japonesa (quartas)':
        return '🇯🇵';
      case 'Champions League':
      case 'Europa League':
        return '🇪🇺';
      case 'Premier League':
        return '🏴󠁧󠁢󠁥󠁮󠁧󠁿';
      case 'La Liga':
        return '🇪🇸';
      case 'Serie A':
        return '🇮🇹';
      case 'Bundesliga':
        return '🇩🇪';
      case 'Ligue 1':
        return '🇫🇷';
      case 'Copa Libertadores da América':
      case 'Copa Sul-Americana':
        return '🌎';
      case 'Copa da Inglaterra':
        return '🏴󠁧󠁢󠁥󠁮󠁧󠁿';
      case 'Copa da França':
        return '🇫🇷';
      case 'Copa da Alemanha':
        return '🇩🇪';
      case 'Copa de Portugal':
        return '🇵🇹';
      case 'Copa da Itália':
        return '🇮🇹';
      case 'Copa da Espanha':
        return '🇪🇸';
      case 'Campeonato Alemão Feminino':
        return '🇩🇪';
      case 'NFL':
        return '🏈';
      default:
        return '⚽';
    }
  };

  return (
    <div className="bg-gray-100 hover:bg-gray-200 shadow-sm hover:shadow-md p-6 rounded-xl transition-all duration-200 border border-gray-200">
      <h3 className="font-bold text-lg mb-3 text-gray-800 flex items-center">
        <span className="mr-2">{getBandeiraPorCompeticao(campeonato)}</span>
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