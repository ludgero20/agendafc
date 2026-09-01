"use client";

import React, { useState, useEffect, useMemo } from "react";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/outline";

// Tipos 100% alinhados
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

  // 📲 LINK DO WHATSAPP
  const gerarLinkWhatsApp = (jogo: JogoSemana) => {
    const ehJogo = Boolean(jogo.time1);
    const titulo = ehJogo ? `⚽ ${jogo.time1} x ${jogo.time2}` : `🏁 ${jogo.evento_nome} (${jogo.evento_descricao || 'Fórmula 1'})`;
    const campeonato = jogo.divisao ? `${jogo.campeonato} ${jogo.divisao}` : jogo.campeonato;
    const fase = jogo.fase ? ` - ${jogo.fase}` : '';

    const mensagem = `${titulo}
🏆 ${campeonato}${fase}
🕒 ${jogo.hora}
📺 ${jogo.canal}

Confira a agenda completa em: https://agendafc.com.br`;

    return `https://api.whatsapp.com/send?text=${encodeURIComponent(mensagem)}`;
  };

  // 📅 LINK DO GOOGLE AGENDA
  const gerarLinkGoogleAgenda = (jogo: JogoSemana) => {
    const ehJogo = Boolean(jogo.time1);
    const titulo = ehJogo ? `${jogo.time1} x ${jogo.time2}` : `${jogo.evento_nome} - ${jogo.evento_descricao || 'F1'}`;
    const campeonato = jogo.divisao ? `${jogo.campeonato} ${jogo.divisao}` : jogo.campeonato;

    // Extrai hora e minuto (ex: "16h00" ou "16:00")
    const [hStr, mStr] = (jogo.hora || '12h00').replace('h', ':').split(':');
    const horaNum = parseInt(hStr || '12', 10);
    const minNum = parseInt(mStr || '0', 10);

    const [ano, mes, dia] = (jogo.data || '2026-01-01').split('-').map(Number);

    // Converte horário de Brasília (UTC-3) para UTC somando 3 horas
    const dataInicio = new Date(Date.UTC(ano, mes - 1, dia, horaNum + 3, minNum));
    const dataFim = new Date(dataInicio.getTime() + (ehJogo ? 2 : 1.5) * 60 * 60 * 1000); // 2h de duração

    const formatUTC = (d: Date) => d.toISOString().replace(/-|:|\.\d+/g, '');
    const startIso = formatUTC(dataInicio);
    const endIso = formatUTC(dataFim);

    const detalhes = `🏆 Campeonato: ${campeonato}\n📺 Transmissão: ${jogo.canal}\n\nAgenda completa em: https://agendafc.com.br`;
    const local = ehJogo ? "Estádio / TV" : (jogo.evento_descricao || "Autódromo");

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(titulo)}&dates=${startIso}/${endIso}&details=${encodeURIComponent(detalhes)}&location=${encodeURIComponent(local)}`;
  };

  const { hoje, amanha } = helpers;

  // --- ESTADOS ---
  const [jogosHoje, setJogosHoje] = useState(jogosHojeIniciais);
  const [jogosAmanha, setJogosAmanha] = useState(jogosAmanhaIniciais);
  const [filtroCompeticao, setFiltroCompeticao] = useState<string>("todos");
  const [filtroCanal, setFiltroCanal] = useState<string>("todos");
  const [campeonatosExpandidosHoje, setCampeonatosExpandidosHoje] = useState<Record<string, boolean>>({});
  const [campeonatosExpandidosAmanha, setCampeonatosExpandidosAmanha] = useState<Record<string, boolean>>({});

  // 📺 EXTRAI CANAIS ÚNICOS DINAMICAMENTE
  const canaisDisponiveis = useMemo(() => {
    const canaisSet = new Set<string>();
    const todosJogos = [
      ...Object.values(jogosHojeIniciais).flat(),
      ...Object.values(jogosAmanhaIniciais).flat()
    ];

    todosJogos.forEach(jogo => {
      if (!jogo.canal) return;
      jogo.canal.split(/,|\/|\be\b/gi).forEach(c => {
        const canalLimpo = c.trim();
        if (canalLimpo.length >= 2) canaisSet.add(canalLimpo);
      });
    });

    return Array.from(canaisSet).sort((a, b) => a.localeCompare(b));
  }, [jogosHojeIniciais, jogosAmanhaIniciais]);

  // --- FILTRO COMBINADO ---
  useEffect(() => {
    const filtrar = (jogosOriginais: Record<string, JogoSemana[]>) => {
      if (filtroCompeticao === "todos" && filtroCanal === "todos") return jogosOriginais;
      
      const jogosFiltrados: Record<string, JogoSemana[]> = {};
      for (const chave in jogosOriginais) {
        const jogosDoGrupo = jogosOriginais[chave].filter(jogo => {
          const matchComp = filtroCompeticao === "todos" || jogo.campeonato === filtroCompeticao;
          const matchCanal = filtroCanal === "todos" || (jogo.canal && jogo.canal.toLowerCase().includes(filtroCanal.toLowerCase()));
          return matchComp && matchCanal;
        });

        if (jogosDoGrupo.length > 0) {
          jogosFiltrados[chave] = jogosDoGrupo;
        }
      }
      return jogosFiltrados;
    };

    setJogosHoje(filtrar(jogosHojeIniciais));
    setJogosAmanha(filtrar(jogosAmanhaIniciais));
  }, [filtroCompeticao, filtroCanal, jogosHojeIniciais, jogosAmanhaIniciais]);

  const toggleCampeonatoHoje = (chave: string) => setCampeonatosExpandidosHoje((prev) => ({ ...prev, [chave]: !prev[chave] }));
  const toggleCampeonatoAmanha = (chave: string) => setCampeonatosExpandidosAmanha((prev) => ({ ...prev, [chave]: !prev[chave] }));

  // --- RENDERIZADOR DOS CARDS ---
  const renderizarGrupoDeJogos = (
    jogos: Record<string, JogoSemana[]>,
    toggleFn: (chave: string) => void,
    expandidos: Record<string, boolean>,
    dia: string
  ) => {
    if (Object.keys(jogos).length === 0) {
      return (
        <div className="bg-white rounded-xl p-6 text-center border">
          <p className="text-gray-600">Nenhum evento programado para {dia} com os filtros selecionados.</p>
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
                      <div key={jogo.id} className="bg-white p-4 rounded-lg shadow-md border flex flex-col justify-between">
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

                        {/* Bloco de Canais + Botões de Ação */}
                        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                          <span className="text-xs text-gray-700 font-medium truncate">📺 {jogo.canal}</span>
                          
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            {/* Botão Google Agenda */}
                            <a
                              href={gerarLinkGoogleAgenda(jogo)}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Adicionar ao Google Agenda"
                              className="inline-flex items-center gap-1 text-xs font-semibold bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 px-2 py-1.5 rounded-md transition-colors shadow-sm"
                            >
                              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M5.75 2a.75.75 0 01.75.75V4h7V2.75a.75.75 0 011.5 0V4h.25A2.75 2.75 0 0118 6.75v8.5A2.75 2.75 0 0115.25 18H4.75A2.75 2.75 0 012 15.25v-8.5A2.75 2.75 0 014.75 4H5V2.75A.75.75 0 015.75 2zm-1 5.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h10.5c.69 0 1.25-.56 1.25-1.25v-6.5c0-.69-.56-1.25-1.25-1.25H4.75z" clipRule="evenodd" />
                              </svg>
                              <span className="hidden sm:inline">Agenda</span>
                            </a>

                            {/* Botão WhatsApp */}
                            <a
                              href={gerarLinkWhatsApp(jogo)}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Compartilhar no WhatsApp"
                              className="inline-flex items-center gap-1 text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 text-white px-2 py-1.5 rounded-md transition-colors shadow-sm"
                            >
                              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                              </svg>
                              <span>Zap</span>
                            </a>
                          </div>
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

  // --- FILTROS NO TOPO ---
  return (
    <div className="space-y-12">
      <div className="max-w-2xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Filtro por Campeonato */}
        <div>
          <label htmlFor="filtroCompeticao" className="block text-sm font-medium text-gray-700 mb-1">
            🏆 Filtrar por campeonato:
          </label>
          <select
            id="filtroCompeticao"
            value={filtroCompeticao}
            onChange={(e) => setFiltroCompeticao(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 bg-white text-sm"
          >
            <option value="todos">📋 Todos os campeonatos</option>
            {campeonatosDisponiveis.map((campeonato) => (
              <option key={campeonato} value={campeonato}>
                {getBandeiraPorCompeticao(campeonato)} {campeonato}
              </option>
            ))}
          </select>
        </div>

        {/* Filtro por Canal */}
        <div>
          <label htmlFor="filtroCanal" className="block text-sm font-medium text-gray-700 mb-1">
            📺 Filtrar por canal:
          </label>
          <select
            id="filtroCanal"
            value={filtroCanal}
            onChange={(e) => setFiltroCanal(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 bg-white text-sm"
          >
            <option value="todos">📺 Todos os canais</option>
            {canaisDisponiveis.map((canal) => (
              <option key={canal} value={canal}>
                📺 {canal}
              </option>
            ))}
          </select>
        </div>
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