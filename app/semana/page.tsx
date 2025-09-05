"use client";

import React, { useState, useEffect } from 'react'
import JogoCard from '../components/JogoCard'

type JogoSemana = {
  id: number;
  data: string;
  campeonato: string;
  time1: string;
  time2: string;
  hora: string;
  canal: string;
};

export default function Semana() {
  const [jogos, setJogos] = useState<JogoSemana[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const carregarJogos = async () => {
      try {
        const response = await fetch('/jogos.json');
        const data = await response.json();
        
        // Obter data de hoje usando timezone de São Paulo
        const agora = new Date();
        const hojeDate = new Date(agora.toLocaleString("en-US", {timeZone: "America/Sao_Paulo"}));
        const hojeStr = hojeDate.getFullYear() + '-' + 
                       String(hojeDate.getMonth() + 1).padStart(2, '0') + '-' + 
                       String(hojeDate.getDate()).padStart(2, '0');
        
        // Filtrar jogos para mostrar apenas de hoje em diante
        const jogosFiltrados = data.jogosSemana.filter((jogo: JogoSemana) => {
          return jogo.data >= hojeStr; // Mostra jogos de hoje em diante
        });
        
        setJogos(jogosFiltrados);
      } catch (error) {
        console.error('Erro ao carregar jogos da semana:', error);
        setJogos([]);
      } finally {
        setLoading(false);
      }
    };

    carregarJogos();
  }, []);

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="text-center py-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            📅 Agenda da Semana
          </h1>
          <p className="text-xl text-gray-600">Carregando jogos...</p>
        </div>
      </div>
    );
  }

  // Organizar jogos por data, depois por campeonato
  const jogosPorData = jogos.reduce((acc, jogo) => {
    const data = jogo.data;
    if (!acc[data]) {
      acc[data] = {};
    }
    if (!acc[data][jogo.campeonato]) {
      acc[data][jogo.campeonato] = [];
    }
    acc[data][jogo.campeonato].push(jogo);
    return acc;
  }, {} as Record<string, Record<string, JogoSemana[]>>);

  // Ordenar jogos dentro de cada campeonato por horário
  Object.keys(jogosPorData).forEach(data => {
    Object.keys(jogosPorData[data]).forEach(campeonato => {
      jogosPorData[data][campeonato].sort((a, b) => a.hora.localeCompare(b.hora));
    });
  });

  const formatarData = (data: string) => {
    const [ano, mes, dia] = data.split('-');
    const dataObj = new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia));
    return dataObj.toLocaleDateString('pt-BR', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long' 
    });
  };

  const formatarDataCurta = (data: string) => {
    const [ano, mes, dia] = data.split('-');
    const dataObj = new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia));
    return dataObj.toLocaleDateString('pt-BR', { 
      weekday: 'short', 
      day: 'numeric', 
      month: 'short' 
    });
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
      case 'Copa do Nordeste sub-20 (semifinal)':
      case 'Copa do Nordeste (final)':
        return '🇧🇷';
      case 'Eliminatórias Africanas':
        return '🌍';
      case 'Eliminatórias Europeias':
        return '🇪🇺';
      case 'Eliminatórias da Concacaf':
        return '🇺🇸';
      case 'Campeonato Inglês (Quarta Divisão)':
      case 'Campeonato Inglês Feminino':
        return '🏴󠁧󠁢󠁥󠁮󠁧󠁿';
      case 'Campeonato Norte-Irlandês':
        return '🏴󠁧󠁢󠁮󠁩󠁲󠁿';
      case 'Campeonato Espanhol (Segunda Divisão)':
        return '🇪🇸';
      case 'Campeonato Uruguaio':
        return '🇺🇾';
      case 'Supercopa da Argentina':
      case 'Copa da Argentina':
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
      case 'Campeonato Alemão Feminino':
        return '🇩🇪';
      case 'Amistoso Internacional':
        return '🌐';
      default:
        return '⚽';
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center py-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          📅 Agenda da Semana
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Veja todos os jogos programados para esta semana com horários e canais
        </p>
      </div>
      
      {Object.keys(jogosPorData).length === 0 ? (
        <div className="bg-gray-100 rounded-xl p-8 text-center">
          <h3 className="text-2xl font-semibold text-gray-800 mb-2">Nenhum jogo encontrado!</h3>
          <p className="text-gray-600">Não há jogos programados para esta semana.</p>
        </div>
      ) : (
        <div className="space-y-10">
          {Object.keys(jogosPorData).sort().map((data) => (
            <div key={data} className="">
              <h2 className="text-3xl font-bold text-gray-800 mb-6">
                📅 {formatarData(data)}
              </h2>
              
              <div className="space-y-6">
                {Object.keys(jogosPorData[data]).sort().map((campeonato) => (
                  <div key={campeonato} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                      <h3 className="text-xl font-bold text-gray-800 flex items-center">
                        <span className="mr-3 text-2xl">{getBandeiraPorCompeticao(campeonato)}</span>
                        {campeonato}
                        <span className="ml-auto bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                          {jogosPorData[data][campeonato].length} {jogosPorData[data][campeonato].length === 1 ? 'jogo' : 'jogos'}
                        </span>
                      </h3>
                    </div>
                    <div className="p-6">
                      <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
                        {jogosPorData[data][campeonato].map((jogo) => (
                          <div key={jogo.id} className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-sm font-medium text-green-600 bg-green-50 px-2 py-1 rounded">
                                🕒 {jogo.hora}
                              </span>
                            </div>
                            <div className="text-center mb-3">
                              <div className="flex items-center justify-center">
                                <span className="text-lg font-semibold text-gray-800">{jogo.time1}</span>
                                <span className="mx-3 text-gray-400 font-bold">VS</span>
                                <span className="text-lg font-semibold text-gray-800">{jogo.time2}</span>
                              </div>
                            </div>
                            <div className="text-center">
                              <span className="text-sm text-gray-600">
                                📺 {jogo.canal}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}