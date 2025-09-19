"use client";

import React, { useState, useEffect } from "react";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/outline";
// Removidas dependências do arquivo prioridades.ts - agora usa JSON direto

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

export default function Home() {
  const [jogosHoje, setJogosHoje] = useState<Record<string, JogoSemana[]>>({});
  const [jogosAmanha, setJogosAmanha] = useState<Record<string, JogoSemana[]>>(
    {},
  );
  const [loading, setLoading] = useState(true);
  const [competicoesData, setCompeticoesData] = useState<any>(null);
  const [campeonatosExpandidosHoje, setCampeonatosExpandidosHoje] = useState<
    Record<string, boolean>
  >({});
  const [campeonatosExpandidosAmanha, setCampeonatosExpandidosAmanha] =
    useState<Record<string, boolean>>({});
  const [filtroCompeticao, setFiltroCompeticao] = useState<string>("todos");
  const [campeonatosDisponiveis, setCampeonatosDisponiveis] = useState<string[]>([]);

  // Funções auxiliares para trabalhar com dados das competições
  const getPrioridadeCampeonato = (campeonato: string, time1?: string, time2?: string): number => {
    // Regra especial: Seleção Brasileira sempre no Grupo 1
    if (time1 || time2) {
      const times = [time1, time2].filter(Boolean).map(t => t?.toLowerCase());
      const temSelecaoBrasileira = times.some(time => 
        time?.includes('brasil') || 
        time?.includes('brazil') || 
        time === 'seleção brasileira' ||
        time === 'selecao brasileira'
      );
      
      if (temSelecaoBrasileira) {
        return 1;
      }
    }

    // Buscar nas competições
    if (competicoesData?.competicoes) {
      const competicao = competicoesData.competicoes.find((comp: any) => 
        comp.nome === campeonato && comp.ativo
      );
      if (competicao) {
        return competicao.prioridade;
      }
    }
    
    // Se não encontrar, retorna prioridade 6 (nova) e log para identificação
    console.warn(`⚠️ CAMPEONATO NÃO CADASTRADO: "${campeonato}" - Necessário definir prioridade!`);
    return 6;
  };

  const getBandeiraPorCompeticao = (campeonato: string): string => {
    if (competicoesData?.competicoes) {
      const competicao = competicoesData.competicoes.find((comp: any) => 
        comp.nome === campeonato && comp.ativo
      );
      if (competicao) {
        return competicao.bandeiraEmoji;
      }
    }
    return '🌎'; // Emoji padrão se não encontrar
  };

  const getCampeonatosSemPrioridade = (jogos: JogoSemana[]): string[] => {
    const campeonatosUnicos = [...new Set(jogos.map(jogo => jogo.campeonato))];
    const campeonatosSemPrioridade: string[] = [];
    
    for (const campeonato of campeonatosUnicos) {
      if (getPrioridadeCampeonato(campeonato, '', '') === 6) {
        campeonatosSemPrioridade.push(campeonato);
      }
    }
    
    return campeonatosSemPrioridade;
  };

  // Função para criar nome de exibição do campeonato
  const criarNomeExibicao = (jogo: JogoSemana) => {
    let nome = jogo.campeonato;
    if (jogo.divisao) nome += ` ${jogo.divisao}`;
    if (jogo.fase) nome += ` (${jogo.fase})`;
    return nome;
  };

  // Função para agrupar jogos por campeonato+divisão
  const agruparJogos = (jogos: JogoSemana[]) => {
    return jogos.reduce(
      (acc: Record<string, JogoSemana[]>, jogo: JogoSemana) => {
        const chave = jogo.divisao
          ? `${jogo.campeonato}_${jogo.divisao}`
          : jogo.campeonato;
        if (!acc[chave]) {
          acc[chave] = [];
        }
        acc[chave].push(jogo);
        return acc;
      },
      {} as Record<string, JogoSemana[]>,
    );
  };

  useEffect(() => {
    const carregarJogos = async () => {
      try {
        const competicoesResponse = await fetch('/competicoes-unificadas.json');
        const competicoesData = await competicoesResponse.json();
        setCompeticoesData(competicoesData);

        const response = await fetch("/jogos.json");
        const data = await response.json();

        // Obter data de hoje e amanhã (usando timezone de São Paulo)
        const agora = new Date();
        const hojeDate = new Date(
          agora.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }),
        );
        const amanhaDate = new Date(hojeDate);
        amanhaDate.setDate(hojeDate.getDate() + 1);

        // Formatar datas para comparar (YYYY-MM-DD) usando timezone de São Paulo
        const hojeStr =
          hojeDate.getFullYear() +
          "-" +
          String(hojeDate.getMonth() + 1).padStart(2, "0") +
          "-" +
          String(hojeDate.getDate()).padStart(2, "0");
        const amanhaStr =
          amanhaDate.getFullYear() +
          "-" +
          String(amanhaDate.getMonth() + 1).padStart(2, "0") +
          "-" +
          String(amanhaDate.getDate()).padStart(2, "0");

        // Filtrar jogos por data PRIMEIRO
        const jogosDaSemanа = data.jogosSemana || [];
        const jogosDeHoje = jogosDaSemanа.filter((jogo: JogoSemana) => {
          // Converter formato DD/MM para YYYY-MM-DD se necessário
          let dataJogo = jogo.data;
          if (dataJogo.includes("/")) {
            const [dia, mes] = dataJogo.split("/");
            const ano = hojeDate.getFullYear();
            dataJogo = `${ano}-${mes.padStart(2, "0")}-${dia.padStart(2, "0")}`;
          }
          return dataJogo === hojeStr;
        });

        const jogosDeAmanha = jogosDaSemanа.filter((jogo: JogoSemana) => {
          let dataJogo = jogo.data;
          if (dataJogo.includes("/")) {
            const [dia, mes] = dataJogo.split("/");
            const ano = hojeDate.getFullYear();
            dataJogo = `${ano}-${mes.padStart(2, "0")}-${dia.padStart(2, "0")}`;
          }
          return dataJogo === amanhaStr;
        });

        // DEPOIS extrair campeonatos únicos APENAS dos jogos que serão exibidos
        const jogosRelevantes = [...jogosDeHoje, ...jogosDeAmanha];
        const campeonatosUnicos = [...new Set(jogosRelevantes.map((jogo: JogoSemana) => jogo.campeonato))] as string[];
        setCampeonatosDisponiveis(campeonatosUnicos.sort());

        // Aplicar filtro de competição se selecionado
        const jogosHojeFiltrados = filtroCompeticao === "todos" 
          ? jogosDeHoje 
          : jogosDeHoje.filter((jogo: JogoSemana) => jogo.campeonato === filtroCompeticao);
        
        const jogosAmanhaFiltrados = filtroCompeticao === "todos" 
          ? jogosDeAmanha 
          : jogosDeAmanha.filter((jogo: JogoSemana) => jogo.campeonato === filtroCompeticao);

        // Organizar jogos por campeonato+divisão
        const jogosHojePorCampeonato = agruparJogos(jogosHojeFiltrados);
        const jogosAmanhaPorCampeonato = agruparJogos(jogosAmanhaFiltrados);

        // Ordenar jogos por horário dentro de cada campeonato
        Object.keys(jogosHojePorCampeonato).forEach((chave) => {
          jogosHojePorCampeonato[chave].sort((a: JogoSemana, b: JogoSemana) =>
            a.hora.localeCompare(b.hora),
          );
        });
        Object.keys(jogosAmanhaPorCampeonato).forEach((chave) => {
          jogosAmanhaPorCampeonato[chave].sort((a: JogoSemana, b: JogoSemana) =>
            a.hora.localeCompare(b.hora),
          );
        });

        setJogosHoje(jogosHojePorCampeonato);
        setJogosAmanha(jogosAmanhaPorCampeonato);

        // Verificar campeonatos sem prioridade
        const campeonatosSemPrioridade = getCampeonatosSemPrioridade(data.jogosSemana);
        if (campeonatosSemPrioridade.length > 0) {
          console.warn(
            "🚨 CAMPEONATOS SEM PRIORIDADE DETECTADOS:",
            campeonatosSemPrioridade,
          );
        }
      } catch (error) {
        console.error("Erro ao carregar jogos:", error);
        // Fallback para dados fixos em caso de erro
        setJogosHoje({});
        setJogosAmanha({});
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
            Jogos de Hoje e Amanhã
          </h1>
          <p className="text-xl text-gray-600">Carregando jogos...</p>
        </div>
      </div>
    );
  }

  const formatarData = (data: Date) => {
    return data.toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  };

  const agora = new Date();
  const hoje = new Date(
    agora.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }),
  );
  const amanha = new Date(hoje);
  amanha.setDate(hoje.getDate() + 1);

  // Função para alternar expansão do campeonato
  const toggleCampeonatoHoje = (chave: string) => {
    setCampeonatosExpandidosHoje((prev) => ({
      ...prev,
      [chave]: !prev[chave],
    }));
  };

  const toggleCampeonatoAmanha = (chave: string) => {
    setCampeonatosExpandidosAmanha((prev) => ({
      ...prev,
      [chave]: !prev[chave],
    }));
  };

  // Função para ordenar campeonatos por prioridade
  const ordenarCampeonatos = (
    chaves: string[],
    jogosGrupo: Record<string, JogoSemana[]>,
  ) => {
    return chaves.sort((a, b) => {
      if (!competicoesData) return a.localeCompare(b);

      const jogoA = jogosGrupo[a][0];
      const jogoB = jogosGrupo[b][0];

      const prioridadeA = getPrioridadeCampeonato(jogoA.campeonato, "", "");
      const prioridadeB = getPrioridadeCampeonato(jogoB.campeonato, "", "");

      if (prioridadeA !== prioridadeB) {
        return prioridadeA - prioridadeB;
      }
      return a.localeCompare(b);
    });
  };

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center py-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          ⚽ Agenda FC 🏈
        </h1>
        <h2 className="text-2xl text-gray-700 mb-2">Jogos de Hoje e Amanhã</h2>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-6">
          Onde assistir os principais jogos de futebol e da NFL!
        </p>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-6">
          Horários e canais de transmissão!
        </p>
        
        {/* Filtro de campeonatos */}
        <div className="max-w-md mx-auto">
          <label htmlFor="filtroCompeticao" className="block text-sm font-medium text-gray-700 mb-2">
            🔍 Filtrar por campeonato:
          </label>
          <select
            id="filtroCompeticao"
            value={filtroCompeticao}
            onChange={(e) => setFiltroCompeticao(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
          >
            <option value="todos">📋 Todos os campeonatos</option>
            {campeonatosDisponiveis.map((campeonato) => (
              <option key={campeonato} value={campeonato}>
                {getBandeiraPorCompeticao(campeonato)} {campeonato}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Jogos de Hoje */}
      <div className="">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800 capitalize">
            📅 Hoje - {formatarData(hoje)}
          </h2>
        </div>
        {Object.keys(jogosHoje).length === 0 ? (
          <div className="bg-gray-100 rounded-xl p-6 text-center">
            <p className="text-gray-600">Nenhum jogo programado para hoje</p>
          </div>
        ) : (
          <div className="space-y-6">
            {ordenarCampeonatos(Object.keys(jogosHoje), jogosHoje).map(
              (chave) => {
                const jogosDoGrupo = jogosHoje[chave];
                const jogoExemplo = jogosDoGrupo[0];
                const nomeExibicao = criarNomeExibicao(jogoExemplo);

                return (
                  <div
                    key={chave}
                    className="bg-white rounded-xl border border-gray-200 overflow-hidden"
                  >
                    <button
                      onClick={() => toggleCampeonatoHoje(chave)}
                      className="w-full bg-gray-50 px-6 py-4 border-b border-gray-200 hover:bg-gray-100 transition-colors flex items-center justify-between"
                    >
                      <div className="flex items-center">
                        <span className="mr-3 text-xl">
                          {getBandeiraPorCompeticao(jogoExemplo.campeonato)}
                        </span>
                        <h3 className="text-lg font-bold text-gray-800">
                          {nomeExibicao}
                        </h3>
                        <span className="ml-4 bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                          {jogosDoGrupo.length}{" "}
                          {jogosDoGrupo.length === 1 ? "jogo" : "jogos"}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-sm text-gray-500 mr-2">
                          {campeonatosExpandidosHoje[chave]
                            ? "Recolher"
                            : "Ver jogos"}
                        </span>
                        {campeonatosExpandidosHoje[chave] ? (
                          <ChevronUpIcon className="h-5 w-5 text-gray-400" />
                        ) : (
                          <ChevronDownIcon className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                    </button>
                    {campeonatosExpandidosHoje[chave] && (
                      <div className="p-4">
                        <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
                          {jogosDoGrupo.map((jogo) => (
                            <div
                              key={jogo.id}
                              className="bg-gray-50 rounded-lg p-4 border border-gray-100"
                            >
                              <div className="flex items-center justify-center mb-3">
                                <span className="text-sm font-medium text-green-600 bg-green-50 px-2 py-1 rounded">
                                  🕒 {jogo.hora}
                                </span>
                                {jogo.fase && (
                                  <span className="ml-2 text-xs font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded">
                                    🏆 {jogo.fase}
                                  </span>
                                )}
                              </div>
                              <div className="text-center mb-3">
                                <div className="flex items-center justify-center">
                                  <span className="text-lg font-semibold text-gray-800">
                                    {jogo.time1}
                                  </span>
                                  <span className="mx-3 text-gray-400 font-bold">
                                    VS
                                  </span>
                                  <span className="text-lg font-semibold text-gray-800">
                                    {jogo.time2}
                                  </span>
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
              },
            )}
          </div>
        )}
      </div>

      {/* Jogos de Amanhã */}
      <div className="">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800 capitalize">
            📅 Amanhã - {formatarData(amanha)}
          </h2>
        </div>
        {Object.keys(jogosAmanha).length === 0 ? (
          <div className="bg-gray-100 rounded-xl p-6 text-center">
            <p className="text-gray-600">Nenhum jogo programado para amanhã</p>
          </div>
        ) : (
          <div className="space-y-6">
            {ordenarCampeonatos(Object.keys(jogosAmanha), jogosAmanha).map(
              (chave) => {
                const jogosDoGrupo = jogosAmanha[chave];
                const jogoExemplo = jogosDoGrupo[0];
                const nomeExibicao = criarNomeExibicao(jogoExemplo);

                return (
                  <div
                    key={chave}
                    className="bg-white rounded-xl border border-gray-200 overflow-hidden"
                  >
                    <button
                      onClick={() => toggleCampeonatoAmanha(chave)}
                      className="w-full bg-gray-50 px-6 py-4 border-b border-gray-200 hover:bg-gray-100 transition-colors flex items-center justify-between"
                    >
                      <div className="flex items-center">
                        <span className="mr-3 text-xl">
                          {getBandeiraPorCompeticao(jogoExemplo.campeonato)}
                        </span>
                        <h3 className="text-lg font-bold text-gray-800">
                          {nomeExibicao}
                        </h3>
                        <span className="ml-4 bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                          {jogosDoGrupo.length}{" "}
                          {jogosDoGrupo.length === 1 ? "jogo" : "jogos"}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-sm text-gray-500 mr-2">
                          {campeonatosExpandidosAmanha[chave]
                            ? "Recolher"
                            : "Ver jogos"}
                        </span>
                        {campeonatosExpandidosAmanha[chave] ? (
                          <ChevronUpIcon className="h-5 w-5 text-gray-400" />
                        ) : (
                          <ChevronDownIcon className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                    </button>
                    {campeonatosExpandidosAmanha[chave] && (
                      <div className="p-4">
                        <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
                          {jogosDoGrupo.map((jogo) => (
                            <div
                              key={jogo.id}
                              className="bg-gray-50 rounded-lg p-4 border border-gray-100"
                            >
                              <div className="flex items-center justify-center mb-3">
                                <span className="text-sm font-medium text-green-600 bg-green-50 px-2 py-1 rounded">
                                  🕒 {jogo.hora}
                                </span>
                                {jogo.fase && (
                                  <span className="ml-2 text-xs font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded">
                                    🏆 {jogo.fase}
                                  </span>
                                )}
                              </div>
                              <div className="text-center mb-3">
                                <div className="flex items-center justify-center">
                                  <span className="text-lg font-semibold text-gray-800">
                                    {jogo.time1}
                                  </span>
                                  <span className="mx-3 text-gray-400 font-bold">
                                    VS
                                  </span>
                                  <span className="text-lg font-semibold text-gray-800">
                                    {jogo.time2}
                                  </span>
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
              },
            )}
          </div>
        )}
      </div>
    </div>
  );
}
