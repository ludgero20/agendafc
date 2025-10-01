'use client';

import React, { useState, useEffect } from 'react';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';

// Tipos
type JogoSemana = {
  id: number;
  data: string;
  campeonato: string;
  hora: string;
  canal: string;
  // Campos de Jogo
  time1?: string | null;
  time2?: string | null;
  divisao?: string;
  fase?: string;
  // Campos de Evento (F1)
  evento_nome?: string | null;
  evento_descricao?: string | null;
};

type CompeticaoInfo = { 
  nome: string; 
  prioridade: number; 
  bandeiraEmoji: string; 
  ativo: boolean; 
};

type JogosPorData = Record<string, Record<string, JogoSemana[]>>;

type Props = {
  jogosPorDataIniciais: JogosPorData;
  campeonatosDisponiveis: string[];
  competicoesAtivas: Record<string, CompeticaoInfo>;
};

export default function SemanaListClient({ 
  jogosPorDataIniciais, 
  campeonatosDisponiveis, 
  competicoesAtivas 
}: Props) {

  // --- ESTADOS E EFEITOS ---
  const [jogosPorData, setJogosPorData] = useState(jogosPorDataIniciais);
  const [filtroCompeticao, setFiltroCompeticao] = useState<string>("todos");
  const [campeonatosExpandidos, setCampeonatosExpandidos] = useState<Record<string, Record<string, boolean>>>({});

  useEffect(() => {
    if (filtroCompeticao === "todos") {
      setJogosPorData(jogosPorDataIniciais);
      return;
    }

    const jogosFiltrados: JogosPorData = {};
    for (const data in jogosPorDataIniciais) {
      for (const chave in jogosPorDataIniciais[data]) {
        const jogosDoGrupo = jogosPorDataIniciais[data][chave];
        if (jogosDoGrupo.length > 0 && jogosDoGrupo[0].campeonato === filtroCompeticao) {
          if (!jogosFiltrados[data]) {
            jogosFiltrados[data] = {};
          }
          jogosFiltrados[data][chave] = jogosDoGrupo;
        }
      }
    }
    setJogosPorData(jogosFiltrados);
  }, [filtroCompeticao, jogosPorDataIniciais]);

  // --- FUNÇÕES AUXILIARES ---
  const getBandeiraPorCompeticao = (campeonato: string): string => competicoesAtivas[campeonato]?.bandeiraEmoji || '🌎';

  const criarNomeExibicao = (jogo: JogoSemana) => {
    let nome = jogo.campeonato;
    if (jogo.divisao) nome += ` ${jogo.divisao}`;
    if (jogo.fase && jogo.campeonato !== 'Fórmula 1') nome += ` (${jogo.fase})`;
    return nome;
  };

  const formatarData = (data: string) => {
    const [ano, mes, dia] = data.split('-');
    const dataObj = new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia), 12);
    return dataObj.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
  };

  const toggleCampeonato = (data: string, chave: string) => {
    setCampeonatosExpandidos(prev => ({
      ...prev,
      [data]: { ...prev[data], [chave]: !prev[data]?.[chave] }
    }));
  };

  const ordenarCampeonatos = (chaves: string[], jogosGrupo: Record<string, JogoSemana[]>) => {
    return chaves.sort((a, b) => {
      const jogoA = jogosGrupo[a][0];
      const jogoB = jogosGrupo[b][0];
      const prioA = competicoesAtivas[jogoA.campeonato]?.prioridade || 6;
      const prioB = competicoesAtivas[jogoB.campeonato]?.prioridade || 6;
      if (prioA !== prioB) return prioA - prioB;
      return a.localeCompare(b);
    });
  };

  // --- JSX FINAL DO COMPONENTE ---
  return (
    <div className="space-y-8">
      {/* Filtro */}
      <div className="max-w-md mx-auto">
        <label htmlFor="filtroCompeticaoSemana" className="block text-sm font-medium text-gray-700 mb-2 text-center">
          🔍 Filtrar por campeonato:
        </label>
        <select
          id="filtroCompeticaoSemana"
          value={filtroCompeticao}
          onChange={(e) => setFiltroCompeticao(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500"
        >
          <option value="todos">📋 Todos os campeonatos</option>
          {campeonatosDisponiveis.map((campeonato) => (
            <option key={campeonato} value={campeonato}>
              {getBandeiraPorCompeticao(campeonato)} {campeonato}
            </option>
          ))}
        </select>
      </div>

      {/* Lista de Jogos */}
      {Object.keys(jogosPorData).length === 0 ? (
        <div className="bg-white rounded-xl p-8 text-center border">
          <h3 className="text-2xl font-semibold text-gray-800 mb-2">Nenhum evento encontrado!</h3>
          <p className="text-gray-600">Não há jogos ou corridas programadas para o filtro selecionado.</p>
        </div>
      ) : (
        <div className="space-y-12">
          {Object.keys(jogosPorData).sort().map((data) => (
            <section key={data}>
              <h2 className="text-3xl font-bold text-gray-800 capitalize mb-6 border-b pb-4">
                📅 {formatarData(data)}
              </h2>
              <div className="space-y-6">
                {ordenarCampeonatos(Object.keys(jogosPorData[data]), jogosPorData[data]).map((chave) => {
                  const jogosDoGrupo = jogosPorData[data][chave];
                  const jogoExemplo = jogosDoGrupo[0];
                  const nomeExibicao = criarNomeExibicao(jogoExemplo);
                  return (
                    <div key={chave} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                      <button
                        onClick={() => toggleCampeonato(data, chave)}
                        className="w-full bg-gray-50 px-6 py-4 border-b border-gray-200 hover:bg-gray-100 flex items-center justify-between"
                      >
                        <div className="flex items-center text-left">
                          <span className="mr-3 text-xl">{getBandeiraPorCompeticao(jogoExemplo.campeonato)}</span>
                          <h3 className="text-lg font-bold text-gray-800">{nomeExibicao}</h3>
                           <span className="ml-4 bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                             {jogosDoGrupo.length} {jogosDoGrupo.length === 1 ? 'evento' : 'eventos'}
                           </span>
                        </div>
                        <div className="flex items-center flex-shrink-0 ml-4">
                           <span className="text-sm text-gray-500 mr-2 hidden sm:inline">
                             {campeonatosExpandidos[data]?.[chave] ? 'Recolher' : 'Ver eventos'}
                           </span>
                           {campeonatosExpandidos[data]?.[chave] ? <ChevronUpIcon className="h-5 w-5" /> : <ChevronDownIcon className="h-5 w-5" />}
                        </div>
                      </button>
                      {campeonatosExpandidos[data]?.[chave] && (
                        <div className="p-4">
                           <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
                            {jogosDoGrupo.map((jogo) => (
                              <div key={jogo.id} className="bg-white p-4 rounded-lg shadow-md border">
                                {jogo.time1 ? ( // Se for JOGO
                                  <>
                                    <div className="flex items-center justify-center mb-3">
                                      <span className="text-sm font-medium text-green-600 bg-green-50 px-2 py-1 rounded">🕒 {jogo.hora}</span>
                                      {jogo.fase && (<span className="ml-2 text-xs font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded">🏆 {jogo.fase}</span>)}
                                    </div>
                                    <div className="text-center mb-3">
                                      <div className="font-semibold text-gray-800">
                                        <span>{jogo.time1}</span>
                                        <span className="mx-2 text-gray-400 font-bold">vs</span>
                                        <span>{jogo.time2}</span>
                                      </div>
                                    </div>
                                  </>
                                ) : ( // Senão, é EVENTO (F1)
                                  <>
                                    <div className="flex items-center justify-center mb-3">
                                      <span className="text-sm font-medium text-green-600 bg-green-50 px-2 py-1 rounded">🕒 {jogo.hora}</span>
                                    </div>
                                    <div className="text-center mb-3">
                                      <div className="font-semibold text-gray-800">
                                        <p className="text-lg">{jogo.evento_nome}</p>
                                        <p className="text-sm text-gray-500 font-normal">{jogo.evento_descricao}</p>
                                      </div>
                                    </div>
                                  </>
                                )}
                                <div className="text-center bg-white py-2 px-3 rounded-lg border border-gray-200">
                                  <span className="text-sm text-gray-700 font-medium">📺 {jogo.canal}</span>
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
            </section>
          ))}
        </div>
      )}
    </div>
  );
}