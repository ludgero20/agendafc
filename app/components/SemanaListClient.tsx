'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';

// Tipos 100% alinhados
export type JogoSemana = {
  id: number;
  data: string;
  campeonato: string;
  hora: string;
  canal: string;
  time1?: string | null;
  time2?: string | null;
  divisao?: string;
  fase?: string;
  evento_nome?: string | null;
  evento_descricao?: string | null;
};

export type CompeticaoInfo = { 
  nome: string; 
  prioridade: number; 
  bandeiraEmoji: string; 
  ativo: boolean; 
};

export type JogosPorData = Record<string, Record<string, JogoSemana[]>>;

type Props = {
  jogosPorDataIniciais: JogosPorData;
  campeonatosDisponiveis: string[];
  competicoesAtivas: Record<string, CompeticaoInfo>;
};

function extrairCanaisLimpos(canalStr: string): string[] {
  if (!canalStr) return [];
  const normalizado = canalStr.replace(/\s+(e|&)\s+(?![^(]*\))/gi, ', ');
  const partes = normalizado.split(/[,/]/);
  const canais: string[] = [];

  partes.forEach(parte => {
    let limpo = parte.trim().replace(/^[\(\)]+|[\(\)]+$/g, '').trim();
    if (limpo.length >= 2) canais.push(limpo);
  });

  return canais;
}

export default function SemanaListClient({ 
  jogosPorDataIniciais, 
  campeonatosDisponiveis, 
  competicoesAtivas 
}: Props) {

  const [jogosPorData, setJogosPorData] = useState(jogosPorDataIniciais);
  const [filtroCompeticao, setFiltroCompeticao] = useState<string>("todos");
  const [filtroCanal, setFiltroCanal] = useState<string>("todos");
  const [campeonatosExpandidos, setCampeonatosExpandidos] = useState<Record<string, Record<string, boolean>>>({});

  const canaisDisponiveis = useMemo(() => {
    const canaisSet = new Set<string>();
    Object.values(jogosPorDataIniciais).forEach(porCampeonato => {
      Object.values(porCampeonato).forEach(lista => {
        lista.forEach(jogo => {
          if (!jogo.canal) return;
          extrairCanaisLimpos(jogo.canal).forEach(c => canaisSet.add(c));
        });
      });
    });
    return Array.from(canaisSet).sort((a, b) => a.localeCompare(b));
  }, [jogosPorDataIniciais]);

  useEffect(() => {
    if (filtroCompeticao === "todos" && filtroCanal === "todos") {
      setJogosPorData(jogosPorDataIniciais);
      return;
    }

    const jogosFiltrados: JogosPorData = {};
    for (const data in jogosPorDataIniciais) {
      for (const chave in jogosPorDataIniciais[data]) {
        const jogosDoGrupo = jogosPorDataIniciais[data][chave].filter(jogo => {
          const matchComp = filtroCompeticao === "todos" || jogo.campeonato === filtroCompeticao;
          const matchCanal = filtroCanal === "todos" || (jogo.canal && jogo.canal.toLowerCase().includes(filtroCanal.toLowerCase()));
          return matchComp && matchCanal;
        });

        if (jogosDoGrupo.length > 0) {
          if (!jogosFiltrados[data]) jogosFiltrados[data] = {};
          jogosFiltrados[data][chave] = jogosDoGrupo;
        }
      }
    }
    setJogosPorData(jogosFiltrados);
  }, [filtroCompeticao, filtroCanal, jogosPorDataIniciais]);

  const getBandeiraPorCompeticao = (campeonato: string): string => competicoesAtivas[campeonato]?.bandeiraEmoji || '🌎';

  const criarNomeExibicao = (jogo: JogoSemana) => {
    let nome = jogo.campeonato;
    if (jogo.divisao) nome += ` ${jogo.divisao}`;
    if (jogo.fase && jogo.campeonato !== 'Fórmula 1') nome += ` (${jogo.fase})`;
    return nome;
  };

  const formatarTituloData = (dataStr: string) => {
    const agora = new Date();
    const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' });
    const hoje = formatter.format(agora);

    const dataAmanha = new Date(agora);
    dataAmanha.setDate(dataAmanha.getDate() + 1);
    const amanha = formatter.format(dataAmanha);

    const [ano, mes, dia] = dataStr.split('-').map(Number);
    const dataObj = new Date(ano, mes - 1, dia, 12);
    const textoData = dataObj.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });

    if (dataStr === hoje) return `📅 Hoje - ${textoData}`;
    if (dataStr === amanha) return `📅 Amanhã - ${textoData}`;
    return `📅 ${textoData}`;
  };

  const formatarDiaParaWhatsApp = (dataStr: string) => {
    const agora = new Date();
    const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' });
    const hoje = formatter.format(agora);

    const dataAmanha = new Date(agora);
    dataAmanha.setDate(dataAmanha.getDate() + 1);
    const amanha = formatter.format(dataAmanha);

    if (dataStr === hoje) return "Hoje";
    if (dataStr === amanha) return "Amanhã";

    const [ano, mes, dia] = dataStr.split('-').map(Number);
    const dataObj = new Date(ano, mes - 1, dia, 12);
    const diaSemana = dataObj.toLocaleDateString('pt-BR', { weekday: 'long' });
    const diaMes = dataObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    const diaSemanaCap = diaSemana.charAt(0).toUpperCase() + diaSemana.slice(1);

    return `${diaSemanaCap} (${diaMes})`;
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

  const gerarLinkWhatsApp = (jogo: JogoSemana) => {
    const ehJogo = Boolean(jogo.time1);
    const titulo = ehJogo ? `⚽ ${jogo.time1} x ${jogo.time2}` : `🏁 ${jogo.evento_nome} (${jogo.evento_descricao || 'Fórmula 1'})`;
    const campeonato = jogo.divisao ? `${jogo.campeonato} ${jogo.divisao}` : jogo.campeonato;
    const fase = jogo.fase ? ` - ${jogo.fase}` : '';
    const diaFormatado = formatarDiaParaWhatsApp(jogo.data);

    const mensagem = `${titulo}
🏆 ${campeonato}${fase}
📅 ${diaFormatado} às ${jogo.hora}
📺 ${jogo.canal}

Confira a agenda completa em: https://agendafc.com.br`;

    return `https://api.whatsapp.com/send?text=${encodeURIComponent(mensagem)}`;
  };

  const gerarLinkGoogleAgenda = (jogo: JogoSemana) => {
    const ehJogo = Boolean(jogo.time1);
    const titulo = ehJogo ? `${jogo.time1} x ${jogo.time2}` : `${jogo.evento_nome} - ${jogo.evento_descricao || 'F1'}`;
    const campeonato = jogo.divisao ? `${jogo.campeonato} ${jogo.divisao}` : jogo.campeonato;

    const [hStr, mStr] = (jogo.hora || '12h00').replace('h', ':').split(':');
    const horaNum = parseInt(hStr || '12', 10);
    const minNum = parseInt(mStr || '0', 10);

    const [ano, mes, dia] = (jogo.data || '2026-01-01').split('-').map(Number);

    const dataInicio = new Date(Date.UTC(ano, mes - 1, dia, horaNum + 3, minNum));
    const dataFim = new Date(dataInicio.getTime() + (ehJogo ? 2 : 1.5) * 60 * 60 * 1000);

    const formatUTC = (d: Date) => d.toISOString().replace(/-|:|\.\d+/g, '');
    const startIso = formatUTC(dataInicio);
    const endIso = formatUTC(dataFim);

    const detalhes = `🏆 Campeonato: ${campeonato}\n📺 Transmissão: ${jogo.canal}\n\nAgenda completa em: https://agendafc.com.br`;
    const local = ehJogo ? "Estádio / TV" : (jogo.evento_descricao || "Autódromo");

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(titulo)}&dates=${startIso}/${endIso}&details=${encodeURIComponent(detalhes)}&location=${encodeURIComponent(local)}`;
  };

  return (
    <div className="space-y-8">
      {/* FILTROS NO TOPO */}
      <div className="max-w-2xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50/80 p-4 rounded-2xl border border-slate-200/80">
        <div>
          <label htmlFor="filtroCompeticaoSemana" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
            🏆 Campeonato:
          </label>
          <select
            id="filtroCompeticaoSemana"
            value={filtroCompeticao}
            onChange={(e) => setFiltroCompeticao(e.target.value)}
            className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl shadow-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm font-medium text-slate-800"
          >
            <option value="todos">📋 Todos os campeonatos</option>
            {campeonatosDisponiveis.map((campeonato) => (
              <option key={campeonato} value={campeonato}>
                {getBandeiraPorCompeticao(campeonato)} {campeonato}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="filtroCanalSemana" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
            📺 Canal de Transmissão:
          </label>
          <select
            id="filtroCanalSemana"
            value={filtroCanal}
            onChange={(e) => setFiltroCanal(e.target.value)}
            className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl shadow-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm font-medium text-slate-800"
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

      {/* LISTA DE CARDS POR DATA */}
      {Object.keys(jogosPorData).length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center border border-slate-200 shadow-xs max-w-lg mx-auto">
          <div className="text-4xl mb-3">🔍</div>
          <h3 className="text-xl font-bold text-slate-800 mb-1">Nenhum evento encontrado</h3>
          <p className="text-sm text-slate-500">Tente selecionar outro campeonato ou canal no filtro acima.</p>
        </div>
      ) : (
        <div className="space-y-12">
          {Object.keys(jogosPorData).sort().map((data) => (
            <section key={data}>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 capitalize mb-6 border-b border-slate-200 pb-3 flex items-center gap-2">
                {formatarTituloData(data)}
              </h2>

              <div className="space-y-6">
                {ordenarCampeonatos(Object.keys(jogosPorData[data]), jogosPorData[data]).map((chave) => {
                  const jogosDoGrupo = jogosPorData[data][chave];
                  const jogoExemplo = jogosDoGrupo[0];
                  const nomeExibicao = criarNomeExibicao(jogoExemplo);
                  const ehCorrida = jogoExemplo.campeonato === 'Fórmula 1';
                  const labelSingular = ehCorrida ? 'evento' : 'jogo';
                  const labelPlural = ehCorrida ? 'eventos' : 'jogos';
                  const countLabel = jogosDoGrupo.length === 1 ? labelSingular : labelPlural;

                  return (
                    <div key={chave} className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-sm transition-all overflow-hidden">
                      {/* CABEÇALHO DO CAMPEONATO */}
                      <button
                        onClick={() => toggleCampeonato(data, chave)}
                        className="w-full bg-slate-50/70 hover:bg-slate-100/80 px-5 py-3.5 border-b border-slate-200/80 transition-colors flex items-center justify-between"
                      >
                        <div className="flex items-center text-left gap-3">
                          <span className="text-2xl">{getBandeiraPorCompeticao(jogoExemplo.campeonato)}</span>
                          <div>
                            <h3 className="text-base sm:text-lg font-bold text-slate-800 leading-tight">{nomeExibicao}</h3>
                          </div>
                          <span className="ml-2 bg-blue-100/80 text-blue-800 text-xs font-bold px-2.5 py-0.5 rounded-full">
                            {jogosDoGrupo.length} {countLabel}
                          </span>
                        </div>
                        
                        <div className="flex items-center flex-shrink-0 text-slate-400">
                           <span className="text-xs font-semibold text-slate-500 mr-2 hidden sm:inline">
                             {campeonatosExpandidos[data]?.[chave] ? 'Recolher' : 'Ver eventos'}
                           </span>
                           {campeonatosExpandidos[data]?.[chave] ? <ChevronUpIcon className="h-5 w-5 text-slate-600" /> : <ChevronDownIcon className="h-5 w-5 text-slate-600" />}
                        </div>
                      </button>

                      {/* GRADE DE CARDS */}
                      {campeonatosExpandidos[data]?.[chave] && (
                        <div className="p-4 sm:p-6 bg-slate-50/30">
                           <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {jogosDoGrupo.map((jogo) => (
                              <div 
                                key={jogo.id} 
                                className="bg-white p-4 sm:p-5 rounded-2xl shadow-xs hover:shadow-md transition-all border border-slate-200/80 flex flex-col justify-between gap-3.5"
                              >
                                {jogo.time1 ? (
                                  <>
                                    {/* Topo do Card: Horário e Fase */}
                                    <div className="flex items-center justify-between">
                                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/60">
                                        🕒 {jogo.hora}
                                      </span>
                                      {jogo.fase && (
                                        <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200/60">
                                          🏆 {jogo.fase}
                                        </span>
                                      )}
                                    </div>

                                    {/* Confronto */}
                                    <div className="py-2.5 flex items-center justify-between text-slate-900 font-bold text-sm sm:text-base">
                                      <span className="w-[42%] text-right truncate">{jogo.time1}</span>
                                      <span className="w-[16%] text-center text-xs font-extrabold uppercase text-slate-400 bg-slate-100 py-0.5 px-1.5 rounded border border-slate-200/80">
                                        vs
                                      </span>
                                      <span className="w-[42%] text-left truncate">{jogo.time2}</span>
                                    </div>
                                  </>
                                ) : (
                                  <>
                                    {/* Card de F1 / Evento */}
                                    <div className="flex items-center justify-between">
                                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/60">
                                        🕒 {jogo.hora}
                                      </span>
                                    </div>

                                    <div className="py-2 text-center">
                                      <p className="text-base sm:text-lg font-black text-slate-900 leading-snug">{jogo.evento_nome}</p>
                                      <p className="text-xs text-slate-500 font-medium mt-0.5">{jogo.evento_descricao}</p>
                                    </div>
                                  </>
                                )}

                                {/* 📺 Rodapé: Canais com 2 linhas liberadas + Botões de Ação */}
                                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2.5 mt-auto">
                                  <div className="text-xs font-semibold text-slate-600 flex items-start gap-1.5 flex-1 min-w-0 pr-1">
                                    <span className="flex-shrink-0 mt-0.5">📺</span>
                                    <span className="line-clamp-2 leading-snug">{jogo.canal}</span>
                                  </div>
                                  
                                  <div className="flex items-center gap-1.5 flex-shrink-0 self-center">
                                    {/* Botão Agenda */}
                                    <a
                                      href={gerarLinkGoogleAgenda(jogo)}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      title="Adicionar ao Google Agenda"
                                      className="inline-flex items-center gap-1 text-xs font-bold bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 px-2.5 py-1.5 rounded-lg transition-all shadow-2xs hover:scale-105"
                                    >
                                      <svg className="w-3.5 h-3.5 fill-current text-blue-600" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M5.75 2a.75.75 0 01.75.75V4h7V2.75a.75.75 0 011.5 0V4h.25A2.75 2.75 0 0118 6.75v8.5A2.75 2.75 0 0115.25 18H4.75A2.75 2.75 0 012 15.25v-8.5A2.75 2.75 0 014.75 4H5V2.75A.75.75 0 015.75 2zm-1 5.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h10.5c.69 0 1.25-.56 1.25-1.25v-6.5c0-.69-.56-1.25-1.25-1.25H4.75z" clipRule="evenodd" />
                                      </svg>
                                      <span className="hidden sm:inline">Agenda</span>
                                    </a>

                                    {/* Botão Zap */}
                                    <a
                                      href={gerarLinkWhatsApp(jogo)}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      title="Compartilhar no WhatsApp"
                                      className="inline-flex items-center gap-1 text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-white px-2.5 py-1.5 rounded-lg transition-all shadow-2xs hover:scale-105"
                                    >
                                      <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                                        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                                      </svg>
                                      <span className="hidden sm:inline">Zap</span>
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
            </section>
          ))}
        </div>
      )}
    </div>
  );
}