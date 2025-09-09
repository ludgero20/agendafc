"use client";

import React, { useState, useEffect } from 'react'
import JogoCard from '../components/JogoCard'
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline'
import { carregarPrioridades, getPrioridadeCampeonato, getCampeonatosSemPrioridade, getBandeiraPorCompeticao } from '../utils/prioridades'

type JogoSemana = {
  id: number;
  data: string;
  campeonato: string;
  time1: string;
  time2: string;
  hora: string;
  canal: string;
  divisao?: string;
  fase?: string;
};

export default function Semana() {
  const [jogos, setJogos] = useState<JogoSemana[]>([]);
  const [loading, setLoading] = useState(true);
  const [prioridades, setPrioridades] = useState<any>(null);
  const [campeonatosExpandidos, setCampeonatosExpandidos] = useState<Record<string, Record<string, boolean>>>({});

  // Função para criar nome de exibição do campeonato
  const criarNomeExibicao = (jogo: JogoSemana) => {
    let nome = jogo.campeonato;
    if (jogo.divisao) nome += ` ${jogo.divisao}`;
    if (jogo.fase) nome += ` (${jogo.fase})`;
    return nome;
  };

  // Função para agrupar jogos por campeonato+divisão
  const agruparJogos = (jogos: JogoSemana[]) => {
    return jogos.reduce((acc: Record<string, JogoSemana[]>, jogo: JogoSemana) => {
      const chave = jogo.divisao ? `${jogo.campeonato}_${jogo.divisao}` : jogo.campeonato;
      if (!acc[chave]) {
        acc[chave] = [];
      }
      acc[chave].push(jogo);
      return acc;
    }, {} as Record<string, JogoSemana[]>);
  };

  useEffect(() => {
    const carregarJogos = async () => {
      try {
        const prioridadesData = await carregarPrioridades();
        setPrioridades(prioridadesData);
        
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

  // Organizar jogos por data, depois por campeonato+divisão
  const jogosPorData = jogos.reduce((acc, jogo) => {
    const data = jogo.data;
    if (!acc[data]) {
      acc[data] = {};
    }
    
    const chave = jogo.divisao ? `${jogo.campeonato}_${jogo.divisao}` : jogo.campeonato;
    if (!acc[data][chave]) {
      acc[data][chave] = [];
    }
    acc[data][chave].push(jogo);
    return acc;
  }, {} as Record<string, Record<string, JogoSemana[]>>);

  // Ordenar jogos dentro de cada campeonato por horário
  Object.keys(jogosPorData).forEach(data => {
    Object.keys(jogosPorData[data]).forEach(chave => {
      jogosPorData[data][chave].sort((a, b) => a.hora.localeCompare(b.hora));
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

  // Função para alternar expansão do campeonato
  const toggleCampeonato = (data: string, chave: string) => {
    setCampeonatosExpandidos(prev => ({
      ...prev,
      [data]: {
        ...prev[data],
        [chave]: !prev[data]?.[chave]
      }
    }));
  };

  // Função para ordenar campeonatos por prioridade
  const ordenarCampeonatos = (chaves: string[], jogosGrupo: Record<string, JogoSemana[]>) => {
    return chaves.sort((a, b) => {
      if (!prioridades) return a.localeCompare(b);
      
      const jogoA = jogosGrupo[a][0];
      const jogoB = jogosGrupo[b][0];
      
      const prioridadeA = getPrioridadeCampeonato(jogoA.campeonato, prioridades, '', '');
      const prioridadeB = getPrioridadeCampeonato(jogoB.campeonato, prioridades, '', '');
      
      if (prioridadeA !== prioridadeB) {
        return prioridadeA - prioridadeB;
      }
      return a.localeCompare(b);
    });
  };

  return (
    <div className="space-y-8">
      <div className="text-center py-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          ⚽ Agenda FC 🏈
        </h1>
        <h2 className="text-2xl text-gray-700 mb-4">
          📅 Programação da Semana
        </h2>
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
                {ordenarCampeonatos(Object.keys(jogosPorData[data]), jogosPorData[data]).map((chave) => {
                  const jogosDoGrupo = jogosPorData[data][chave];
                  const jogoExemplo = jogosDoGrupo[0];
                  const nomeExibicao = criarNomeExibicao(jogoExemplo);
                  
                  return (
                    <div key={chave} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                      <button
                        onClick={() => toggleCampeonato(data, chave)}
                        className="w-full bg-gray-50 px-6 py-4 border-b border-gray-200 hover:bg-gray-100 transition-colors flex items-center justify-between"
                      >
                        <div className="flex items-center">
                          <span className="mr-3 text-2xl">{getBandeiraPorCompeticao(jogoExemplo.campeonato)}</span>
                          <h3 className="text-xl font-bold text-gray-800">{nomeExibicao}</h3>
                          <span className="ml-4 bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                            {jogosDoGrupo.length} {jogosDoGrupo.length === 1 ? 'jogo' : 'jogos'}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <span className="text-sm text-gray-500 mr-2">
                            {campeonatosExpandidos[data]?.[chave] ? 'Recolher' : 'Ver jogos'}
                          </span>
                          {campeonatosExpandidos[data]?.[chave] ? (
                            <ChevronUpIcon className="h-5 w-5 text-gray-400" />
                          ) : (
                            <ChevronDownIcon className="h-5 w-5 text-gray-400" />
                          )}
                        </div>
                      </button>
                      {campeonatosExpandidos[data]?.[chave] && (
                        <div className="p-6">
                          <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
                            {jogosDoGrupo.map((jogo) => (
                              <div key={jogo.id} className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                                <div className="flex items-center justify-between mb-3">
                                  <span className="text-sm font-medium text-green-600 bg-green-50 px-2 py-1 rounded">
                                    🕒 {jogo.hora}
                                  </span>
                                  {jogo.fase && (
                                    <span className="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded">
                                      🏆 {jogo.fase}
                                    </span>
                                  )}
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
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}