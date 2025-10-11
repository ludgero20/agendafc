"use client";

import React, { useState, useEffect } from "react";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/outline";

// Tipos
type JogoSemana = {
  id: number;
  data: string;
  campeonato: string;
  time1: string | null;
  time2: string | null;
  hora: string;
  canal: string;
  divisao?: string;
  fase?: string;
  evento_nome?: string | null;
  evento_descricao?: string | null;
};

type CompeticaoInfo = { 
  nome: string; 
  prioridade: number; 
  bandeiraEmoji: string; 
  ativo: boolean; 
};

type Props = {
  jogosHoje: Record<string, JogoSemana[]>;
  jogosAmanha: Record<string, JogoSemana[]>;
  campeonatosDisponiveis: string[];
  competicoesAtivas: Record<string, CompeticaoInfo>;
  helpers: {
    hoje: Date;
    amanha: Date;
  }
};

export default function JogoListClient({ 
  jogosHoje: jogosHojeIniciais, 
  jogosAmanha: jogosAmanhaIniciais, 
  campeonatosDisponiveis, 
  competicoesAtivas,
  helpers
}: Props) {

  // --- FUNÇÕES AUXILIARES ---
  const formatarData = (data: Date) => data.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", timeZone: 'UTC' });
  const getBandeiraPorCompeticao = (campeonato: string): string => competicoesAtivas[campeonato]?.bandeiraEmoji || '🌎';

  const criarNomeExibicao = (jogo: JogoSemana) => {
    let nome = jogo.campeonato;
    if (jogo.divisao) nome += ` ${jogo.divisao}`;
    if (jogo.fase && jogo.campeonato !== 'Fórmula 1') nome += ` (${jogo.fase})`;
    return nome;
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

  const { hoje, amanha } = helpers;

  // --- ESTADOS E EFEITOS ---
  const [jogosHoje, setJogosHoje] = useState(jogosHojeIniciais);
  const [jogosAmanha, setJogosAmanha] = useState(jogosAmanhaIniciais);
  const [filtroCompeticao, setFiltroCompeticao] = useState<string>("todos");
  const [campeonatosExpandidosHoje, setCampeonatosExpandidosHoje] = useState<Record<string, boolean>>({});
  const [campeonatosExpandidosAmanha, setCampeonatosExpandidosAmanha] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const filtrar = (jogosOriginais: Record<string, JogoSemana[]>) => {
      if (filtroCompeticao === "todos") return jogosOriginais;
      const jogosFiltrados: Record<string, JogoSemana[]> = {};
      for (const chave in jogosOriginais) {
        const jogosDoGrupo = jogosOriginais[chave];
        if (jogosDoGrupo.length > 0 && jogosDoGrupo[0].campeonato === filtroCompeticao) {
          jogosFiltrados[chave] = jogosDoGrupo;
        }
      }
      return jogosFiltrados;
    };

    setJogosHoje(filtrar(jogosHojeIniciais));
    setJogosAmanha(filtrar(jogosAmanhaIniciais));
  }, [filtroCompeticao, jogosHojeIniciais, jogosAmanhaIniciais]);

  const toggleCampeonatoHoje = (chave: string) => setCampeonatosExpandidosHoje((prev) => ({ ...prev, [chave]: !prev[chave] }));
  const toggleCampeonatoAmanha = (chave: string) => setCampeonatosExpandidosAmanha((prev) => ({ ...prev, [chave]: !prev[chave] }));

  // --- FUNÇÃO DE RENDERIZAÇÃO AUXILIAR ---
  const renderizarGrupoDeJogos = (
    jogos: Record<string, JogoSemana[]>,
    toggleFn: (chave: string) => void,
    expandidos: Record<string, boolean>,
    dia: string
  ) => {
    if (Object.keys(jogos).length === 0) {
      return (
        <div className="bg-white rounded-xl p-6 text-center border">
          <p className="text-gray-600">Nenhum evento programado para {dia} com o filtro selecionado.</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {ordenarCampeonatos(Object.keys(jogos), jogos).map((chave) => {
          const jogosDoGrupo = jogos[chave];
          const jogoExemplo = jogosDoGrupo[0];
          const nomeExibicao = criarNomeExibicao(jogoExemplo);
        const ehCorrida = jogoExemplo.campeonato === 'Fórmula 1';
        const labelSingular = ehCorrida ? 'evento' : 'jogo';
        const labelPlural = ehCorrida ? 'eventos' : 'jogos';
        const countLabel = jogosDoGrupo.length === 1 ? labelSingular : labelPlural;
          return (
            <div key={chave} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
              <button
                onClick={() => toggleFn(chave)}
                className="w-full bg-gray-50 px-6 py-4 border-b border-gray-200 hover:bg-gray-100 transition-colors flex items-center justify-between"
              >
                <div className="flex items-center text-left">
                  <span className="mr-3 text-xl">{getBandeiraPorCompeticao(jogoExemplo.campeonato)}</span>
                  <h3 className="text-lg font-bold text-gray-800">{nomeExibicao}</h3>
                  <span className="ml-4 bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                    {jogosDoGrupo.length} {countLabel}
                  </span>
                </div>
                <div className="flex items-center flex-shrink-0 ml-4">
                  <span className="text-sm text-gray-500 mr-2 hidden sm:inline">{expandidos[chave] ? "Recolher" : "Ver eventos"}</span>
                  {expandidos[chave] ? (<ChevronUpIcon className="h-5 w-5 text-gray-400" />) : (<ChevronDownIcon className="h-5 w-5 text-gray-400" />)}
                </div>
              </button>
              {expandidos[chave] && (
                <div className="p-4">
                  <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
                    {jogosDoGrupo.map((jogo) => (
                      <div key={jogo.id} className="bg-white p-4 rounded-lg shadow-md border">
                        <script
                          type="application/ld+json"
                          dangerouslySetInnerHTML={{ __html: JSON.stringify({
                            "@context": "https://schema.org",
                            "@type": "SportsEvent",
                            "name": jogo.time1 ? `${jogo.time1} vs ${jogo.time2}` : `${jogo.evento_nome} - ${jogo.evento_descricao}`,
                            "startDate": `${jogo.data}T${jogo.hora}`,
                            "location": { "@type": "Place", "name": jogo.campeonato === 'Fórmula 1' ? jogo.evento_descricao : "Estádio" },
                            "homeTeam": jogo.time1 ? { "@type": "SportsTeam", "name": jogo.time1 } : undefined,
                            "awayTeam": jogo.time2 ? { "@type": "SportsTeam", "name": jogo.time2 } : undefined,
                            "competitor": jogo.time1 ? [
                              { "@type": "SportsTeam", "name": jogo.time1 },
                              { "@type": "SportsTeam", "name": jogo.time2 }
                            ] : undefined,
                            "broadcastChannel": { "@type": "BroadcastChannel", "name": jogo.canal }
                          })}}
                        />

                        {jogo.time1 ? (
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
                        ) : (
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
    );
  };

  // --- JSX FINAL DO COMPONENTE ---
  return (
    <div className="space-y-12">
      <div className="max-w-md mx-auto">
        <label htmlFor="filtroCompeticao" className="block text-sm font-medium text-gray-700 mb-2 text-center">🔍 Filtrar por campeonato:</label>
        <select
          id="filtroCompeticao"
          value={filtroCompeticao}
          onChange={(e) => setFiltroCompeticao(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
        >
          <option value="todos">📋 Todos os campeonatos</option>
          {campeonatosDisponiveis.map((campeonato) => (
            <option key={campeonato} value={campeonato}>
              {getBandeiraPorCompeticao(campeonato)} {campeonato}
            </option>
          ))}
        </select>
      </div>

      <section>
        <h2 className="text-3xl font-bold text-gray-800 capitalize mb-6 border-b pb-4">📅 Hoje - {formatarData(new Date(hoje))}</h2>
        {renderizarGrupoDeJogos(jogosHoje, toggleCampeonatoHoje, campeonatosExpandidosHoje, "hoje")}
      </section>

      <section>
        <h2 className="text-3xl font-bold text-gray-800 capitalize mb-6 border-b pb-4">📅 Amanhã - {formatarData(new Date(amanha))}</h2>
        {renderizarGrupoDeJogos(jogosAmanha, toggleCampeonatoAmanha, campeonatosExpandidosAmanha, "amanhã")}
      </section>
    </div>
  );
}