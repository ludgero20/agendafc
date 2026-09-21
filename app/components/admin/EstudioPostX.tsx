// app/components/admin/EstudioPostX.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  SparklesIcon,
  ArrowPathIcon,
  CheckIcon,
  ArrowDownTrayIcon,
  ClipboardDocumentCheckIcon,
  ArrowTopRightOnSquareIcon,
  FunnelIcon,
  CalendarDaysIcon,
  TrophyIcon,
  CheckCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/solid';

type JogoEstudio = {
  id: string | number;
  data: string;
  hora: string;
  campeonato: string;
  canal: string;
  time1?: string | null;
  time2?: string | null;
  escudo1?: string | null;
  escudo2?: string | null;
  divisao?: string;
  fase?: string;
  evento_nome?: string | null;
  evento_descricao?: string | null;
};

type Props = {
  senha: string;
};

export default function EstudioPostX({ senha }: Props) {
  const [carregandoJogos, setCarregandoJogos] = useState(true);
  const [todosJogos, setTodosJogos] = useState<JogoEstudio[]>([]);
  const [campeonatosDisponiveis, setCampeonatosDisponiveis] = useState<string[]>([]);
  const [hojeStr, setHojeStr] = useState('');

  // Filtros
  const [filtroPeriodo, setFiltroPeriodo] = useState<'hoje' | 'amanha' | 'fim_de_semana' | 'semana' | 'todos'>('hoje');
  const [filtroCampeonato, setFiltroCampeonato] = useState<string>('todos');
  const [buscaTexto, setBuscaTexto] = useState<string>('');

  // Jogos selecionados (IDs)
  const [selecionados, setSelecionados] = useState<JogoEstudio[]>([]);

  // Título customizável para a arte
  const [tituloBanner, setTituloBanner] = useState('⚽ JOGOS DE HOJE NA TV');

  // Estados de Geração
  const [gerando, setGerando] = useState(false);
  const [copiaGerada, setCopiaGerada] = useState<string>('');
  const [copiaEditada, setCopiaEditada] = useState<string>('');
  const [bannerUrl, setBannerUrl] = useState<string>('');
  const [copiado, setCopiado] = useState(false);
  const [baixando, setBaixando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // 1. Carrega todos os jogos futuros
  useEffect(() => {
    async function carregar() {
      setCarregandoJogos(true);
      setErro(null);
      try {
        const res = await fetch('/api/admin/jogos-estudio');
        const data = await res.json();
        if (data.success) {
          setTodosJogos(data.jogos || []);
          setCampeonatosDisponiveis(data.campeonatos || []);
          setHojeStr(data.hoje || '');
        } else {
          setErro(data.error || 'Erro ao carregar jogos.');
        }
      } catch (err: any) {
        setErro(err.message || 'Erro de conexão com o servidor.');
      } finally {
        setCarregandoJogos(false);
      }
    }
    carregar();
  }, []);

  // Datas calculadas para filtros
  const datasFiltro = useMemo(() => {
    const hoje = hojeStr ? new Date(hojeStr + 'T12:00:00') : new Date();
    const amanha = new Date(hoje);
    amanha.setDate(amanha.getDate() + 1);

    const formatYMD = (d: Date) => d.toISOString().split('T')[0];

    const amanhaYMD = formatYMD(amanha);
    const hojeYMD = formatYMD(hoje);

    // Fim de semana mais próximo (Sábado e Domingo)
    const diaDaSemana = hoje.getDay(); // 0 = Domingo, 6 = Sábado
    let sabado = new Date(hoje);
    let domingo = new Date(hoje);

    if (diaDaSemana === 6) {
      domingo.setDate(hoje.getDate() + 1);
    } else if (diaDaSemana === 0) {
      sabado.setDate(hoje.getDate() - 1);
    } else {
      const diasAteSabado = 6 - diaDaSemana;
      sabado.setDate(hoje.getDate() + diasAteSabado);
      domingo.setDate(hoje.getDate() + diasAteSabado + 1);
    }

    const sabadoYMD = formatYMD(sabado);
    const domingoYMD = formatYMD(domingo);

    // Próximos 7 dias
    const limiteSemana = new Date(hoje);
    limiteSemana.setDate(limiteSemana.getDate() + 7);
    const limiteSemanaYMD = formatYMD(limiteSemana);

    return {
      hoje: hojeYMD,
      amanha: amanhaYMD,
      sabado: sabadoYMD,
      domingo: domingoYMD,
      limiteSemana: limiteSemanaYMD,
    };
  }, [hojeStr]);

  // Atualiza título padrão do banner ao trocar o filtro de período
  useEffect(() => {
    if (filtroCampeonato !== 'todos') {
      if (filtroCampeonato.toLowerCase().includes('nfl')) {
        setTituloBanner('🏈 NFL • JOGOS DA SEMANA');
      } else if (filtroCampeonato.toLowerCase().includes('fórmula 1') || filtroCampeonato.toLowerCase().includes('f1')) {
        setTituloBanner('🏎️ FÓRMULA 1 • PROGRAMAÇÃO');
      } else {
        setTituloBanner(`⚽ ${filtroCampeonato.toUpperCase()} NA TV`);
      }
      return;
    }

    switch (filtroPeriodo) {
      case 'hoje':
        setTituloBanner('⚽ JOGOS DE HOJE NA TV');
        break;
      case 'amanha':
        setTituloBanner('⚽ JOGOS DE AMANHÃ NA TV');
        break;
      case 'fim_de_semana':
        setTituloBanner('⚽ JOGOS DO FIM DE SEMANA');
        break;
      case 'semana':
        setTituloBanner('⚽ DESTAQUES DA SEMANA NA TV');
        break;
      default:
        setTituloBanner('⚽ JOGOS EM DESTAQUE NA TV');
        break;
    }
  }, [filtroPeriodo, filtroCampeonato]);

  // Lista filtrada
  const jogosFiltrados = useMemo(() => {
    return todosJogos.filter((jogo) => {
      // Filtro de Período
      if (filtroPeriodo === 'hoje' && jogo.data !== datasFiltro.hoje) return false;
      if (filtroPeriodo === 'amanha' && jogo.data !== datasFiltro.amanha) return false;
      if (filtroPeriodo === 'fim_de_semana' && jogo.data !== datasFiltro.sabado && jogo.data !== datasFiltro.domingo)
        return false;
      if (filtroPeriodo === 'semana' && (jogo.data < datasFiltro.hoje || jogo.data > datasFiltro.limiteSemana))
        return false;

      // Filtro de Campeonato
      if (filtroCampeonato !== 'todos' && jogo.campeonato !== filtroCampeonato) return false;

      // Filtro de Busca de texto
      if (buscaTexto.trim()) {
        const busca = buscaTexto.toLowerCase();
        const t1 = (jogo.time1 || '').toLowerCase();
        const t2 = (jogo.time2 || '').toLowerCase();
        const camp = (jogo.campeonato || '').toLowerCase();
        const ev = (jogo.evento_nome || '').toLowerCase();
        const desc = (jogo.evento_descricao || '').toLowerCase();
        if (!t1.includes(busca) && !t2.includes(busca) && !camp.includes(busca) && !ev.includes(busca) && !desc.includes(busca)) {
          return false;
        }
      }

      return true;
    });
  }, [todosJogos, filtroPeriodo, filtroCampeonato, buscaTexto, datasFiltro]);

  // Toggle seleção de jogo
  const handleToggleJogo = (jogo: JogoEstudio) => {
    const jaSelecionado = selecionados.some((j) => j.id === jogo.id);

    if (jaSelecionado) {
      setSelecionados(selecionados.filter((j) => j.id !== jogo.id));
    } else {
      if (selecionados.length >= 6) {
        alert('Você pode selecionar no máximo 6 jogos/eventos para manter a arte em alta qualidade!');
        return;
      }
      setSelecionados([...selecionados, jogo]);
    }
  };

  // Limpar seleção
  const handleLimparSelecao = () => {
    setSelecionados([]);
  };

  // Gerar post completo (Imagem + Legenda IA)
  const handleGerarPostCompleto = async () => {
    if (selecionados.length < 2) {
      alert('Por favor, selecione de 2 a 6 jogos para gerar o post!');
      return;
    }

    setGerando(true);
    setErro(null);

    try {
      // 1. Constrói a URL para a imagem OG
      const payloadMinimo = selecionados.map((j) => ({
        id: j.id,
        data: j.data,
        hora: j.hora,
        campeonato: j.campeonato,
        canal: j.canal,
        time1: j.time1,
        time2: j.time2,
        escudo1: j.escudo1,
        escudo2: j.escudo2,
        evento_nome: j.evento_nome,
        evento_descricao: j.evento_descricao,
      }));

      const urlOg = `/api/og/post-x?titulo=${encodeURIComponent(tituloBanner)}&jogos=${encodeURIComponent(
        JSON.stringify(payloadMinimo)
      )}&t=${Date.now()}`;
      setBannerUrl(urlOg);

      // 2. Chama a API do Gemini para gerar a legenda magnética
      const resCopy = await fetch('/api/admin/gerar-copy-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senha,
          jogos: payloadMinimo,
          contexto: tituloBanner,
        }),
      });

      const dataCopy = await resCopy.json();

      if (resCopy.ok && dataCopy.sucesso) {
        setCopiaGerada(dataCopy.texto);
        setCopiaEditada(dataCopy.texto);
      } else {
        setErro(dataCopy.error || 'Erro ao gerar legenda com a IA.');
      }
    } catch (err: any) {
      setErro(err.message || 'Erro durante a geração.');
    } finally {
      setGerando(false);
    }
  };

  // Download do Banner como PNG
  const handleBaixarImagem = async () => {
    if (!bannerUrl) return;
    setBaixando(true);
    try {
      const response = await fetch(bannerUrl);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      const slugTitulo = tituloBanner.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      a.download = `agendafc-${slugTitulo || 'post-x'}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(blobUrl);
      document.body.removeChild(a);
    } catch (err: any) {
      alert('Erro ao baixar imagem: ' + err.message);
    } finally {
      setBaixando(false);
    }
  };

  // Copiar legenda para o clipboard
  const handleCopiarLegenda = async () => {
    if (!copiaEditada) return;
    try {
      await navigator.clipboard.writeText(copiaEditada);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch {
      alert('Não foi possível copiar automaticamente.');
    }
  };

  // Link de intenção de postagem no X
  const linkIntencaoX = useMemo(() => {
    if (!copiaEditada) return '';
    return `https://x.com/intent/post?text=${encodeURIComponent(copiaEditada)}`;
  }, [copiaEditada]);

  // Contagem de caracteres em tempo real
  const contagemCaracteres = copiaEditada.length;
  const limiteEstourado = contagemCaracteres > 280;

  return (
    <div className="space-y-8">
      {/* CABEÇALHO DO ESTÚDIO */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white p-6 sm:p-8 rounded-2xl border border-blue-900/50 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 bg-blue-500/20 text-blue-300 border border-blue-400/30 px-3 py-1 rounded-full text-xs font-black tracking-wide uppercase mb-2">
              <SparklesIcon className="w-3.5 h-3.5" />
              Estúdio de Postagem para o X em 1 Clique
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Gerador de Banner & Tweet Viral
            </h2>
            <p className="text-slate-300 text-sm mt-1 max-w-2xl">
              Filtre por campeonato (NFL, F1, Brasileirão) ou período, selecione de 2 a 6 confrontos e gere a arte 16:9 em alta definição com legenda pronta para postar.
            </p>
          </div>

          <div className="bg-slate-800/80 border border-slate-700/80 px-4 py-3 rounded-xl text-center flex-shrink-0">
            <span className="block text-2xl font-black text-blue-400">{selecionados.length} / 6</span>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Jogos Selecionados</span>
          </div>
        </div>
      </div>

      {erro && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-semibold flex items-center gap-2">
          <XMarkIcon className="w-5 h-5 flex-shrink-0 text-red-500" />
          <span>{erro}</span>
        </div>
      )}

      {/* ÁREA DE FILTROS & SELEÇÃO */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2 text-slate-800 font-extrabold text-base">
            <FunnelIcon className="w-5 h-5 text-blue-600" />
            <span>Filtros Rápidos</span>
          </div>

          {selecionados.length > 0 && (
            <button
              onClick={handleLimparSelecao}
              className="text-xs font-bold text-slate-500 hover:text-red-600 transition-colors"
            >
              Desmarcar todos ({selecionados.length})
            </button>
          )}
        </div>

        {/* 1. SELETOR DE PERÍODO (ABAS) */}
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            Período da Agenda
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {[
              { id: 'hoje', label: 'Hoje' },
              { id: 'amanha', label: 'Amanhã' },
              { id: 'fim_de_semana', label: 'Fim de Semana' },
              { id: 'semana', label: 'Próximos 7 Dias' },
              { id: 'todos', label: 'Todos os Dias' },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setFiltroPeriodo(p.id as any)}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all border ${
                  filtroPeriodo === p.id
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* 2. FILTRO POR CAMPEONATO & BUSCA */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Filtrar por Campeonato / Liga
            </label>
            <div className="relative">
              <select
                value={filtroCampeonato}
                onChange={(e) => setFiltroCampeonato(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="todos">🌟 Todos os Campeonatos</option>
                {campeonatosDisponiveis.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Buscar por time ou evento
            </label>
            <input
              type="text"
              placeholder="Ex: Flamengo, Chiefs, Monza..."
              value={buscaTexto}
              onChange={(e) => setBuscaTexto(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* 3. TÍTULO CUSTOMIZADO DO BANNER */}
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            Título / Tag que aparecerá no topo do Banner
          </label>
          <input
            type="text"
            value={tituloBanner}
            onChange={(e) => setTituloBanner(e.target.value)}
            placeholder="Ex: ⚽ JOGOS DE HOJE NA TV ou 🏈 NFL • QUINTA A SEGUNDA"
            className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-extrabold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* LISTA DE JOGOS DISPONÍVEIS COM CHECKBOXES */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <TrophyIcon className="w-5 h-5 text-emerald-600" />
            <h3 className="text-base font-extrabold text-slate-900">
              Escolha de 2 a 6 Jogos para a Postagem
            </h3>
          </div>
          <span className="text-xs font-bold text-slate-500">
            {jogosFiltrados.length} evento{jogosFiltrados.length !== 1 ? 's' : ''} encontrado{jogosFiltrados.length !== 1 ? 's' : ''}
          </span>
        </div>

        {carregandoJogos ? (
          <div className="py-12 text-center text-slate-500 flex flex-col items-center justify-center gap-3">
            <ArrowPathIcon className="w-7 h-7 animate-spin text-blue-600" />
            <span className="text-sm font-bold">Carregando jogos e escudos da agenda...</span>
          </div>
        ) : jogosFiltrados.length === 0 ? (
          <div className="py-10 text-center text-slate-500">
            <p className="text-sm font-semibold">Nenhum jogo encontrado para os filtros selecionados.</p>
            <p className="text-xs text-slate-400 mt-1">Tente mudar o período ou selecionar "Todos os Campeonatos".</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[460px] overflow-y-auto pr-1">
            {jogosFiltrados.map((jogo) => {
              const estaSelecionado = selecionados.some((j) => j.id === jogo.id);
              const ehF1 = Boolean(jogo.evento_nome);

              return (
                <div
                  key={jogo.id}
                  onClick={() => handleToggleJogo(jogo)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    estaSelecionado
                      ? 'bg-blue-50/80 border-blue-500 ring-2 ring-blue-500/20 shadow-sm'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div
                      className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all flex-shrink-0 ${
                        estaSelecionado ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 bg-white'
                      }`}
                    >
                      {estaSelecionado && <CheckIcon className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>

                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-bold text-blue-700 bg-blue-100/60 px-2 py-0.5 rounded">
                          {jogo.campeonato}
                        </span>
                        <span className="font-semibold text-slate-500">
                          {jogo.data.split('-').reverse().slice(0, 2).join('/')} às {jogo.hora}
                        </span>
                      </div>

                      {ehF1 ? (
                        <div className="font-bold text-sm text-slate-900 truncate">
                          🏁 {jogo.evento_nome} <span className="text-xs text-slate-500">({jogo.evento_descricao})</span>
                        </div>
                      ) : (
                        <div className="font-extrabold text-sm text-slate-900 truncate flex items-center gap-1.5">
                          <span>{jogo.time1}</span>
                          <span className="text-slate-400 font-normal">x</span>
                          <span>{jogo.time2}</span>
                        </div>
                      )}

                      <div className="text-[11px] font-medium text-slate-500 truncate">
                        📺 {jogo.canal || 'Transmissão a confirmar'}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* BOTÃO PRINCIPAL DE GERAÇÃO */}
        <div className="pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={handleGerarPostCompleto}
            disabled={gerando || selecionados.length < 2}
            className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 text-white font-extrabold py-4 px-6 rounded-xl shadow-md transition-all flex items-center justify-center gap-3 text-base"
          >
            {gerando ? (
              <>
                <ArrowPathIcon className="w-5 h-5 animate-spin" />
                <span>O Gemini e o Estúdio estão criando seu Post e Arte...</span>
              </>
            ) : (
              <>
                <SparklesIcon className="w-5 h-5" />
                <span>
                  🚀 Gerar Post Completo (Arte 16:9 + Legenda IA) • {selecionados.length} jogo{selecionados.length !== 1 ? 's' : ''}
                </span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ÁREA DE RESULTADOS (PRÉVIA DA IMAGEM + LEGENDA DO X) */}
      {(bannerUrl || copiaGerada) && (
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-md space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
            <CheckCircleIcon className="w-6 h-6 text-emerald-600" />
            <h3 className="text-xl font-black text-slate-900">Post Pronto para Publicar no X!</h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            {/* 1. PRÉVIA DA IMAGEM GERADA */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Arte Gerada em Alta Resolução (1200x675 px)
                </span>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Formato Perfeito X (16:9)
                </span>
              </div>

              <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-950 aspect-video shadow-sm relative group">
                {bannerUrl && (
                  <img
                    src={bannerUrl}
                    alt="Banner gerado para o X"
                    className="w-full h-full object-cover transition-transform duration-300"
                  />
                )}
              </div>

              <button
                type="button"
                onClick={handleBaixarImagem}
                disabled={baixando}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 text-sm"
              >
                {baixando ? (
                  <>
                    <ArrowPathIcon className="w-4 h-4 animate-spin" />
                    <span>Baixando Imagem PNG...</span>
                  </>
                ) : (
                  <>
                    <ArrowDownTrayIcon className="w-4 h-4" />
                    <span>📥 Baixar Imagem (PNG em Alta)</span>
                  </>
                )}
              </button>
            </div>

            {/* 2. LEGENDA GERADA COM O GEMINI */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Legenda Gerada com IA (Gemini 2.5 Flash)
                </span>
                <span
                  className={`text-xs font-extrabold px-2 py-0.5 rounded border ${
                    limiteEstourado
                      ? 'bg-red-50 text-red-700 border-red-300'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-300'
                  }`}
                >
                  {contagemCaracteres} / 280 caracteres {limiteEstourado ? '(Ultrapassou!)' : '(Válido para o X ✅)'}
                </span>
              </div>

              <div className="space-y-1">
                <textarea
                  rows={8}
                  value={copiaEditada}
                  onChange={(e) => setCopiaEditada(e.target.value)}
                  placeholder="A legenda do tweet aparecerá aqui..."
                  className={`w-full p-4 border rounded-xl font-sans text-sm focus:ring-2 focus:outline-none leading-relaxed transition-all ${
                    limiteEstourado
                      ? 'border-red-400 bg-red-50/20 focus:ring-red-400'
                      : 'border-slate-300 bg-slate-50 focus:ring-blue-500'
                  }`}
                />
                <p className="text-[11px] text-slate-400">
                  Você pode editar o texto acima à vontade antes de copiar ou abrir no X.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCopiarLegenda}
                  className="bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 font-bold py-3 px-4 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 text-sm"
                >
                  {copiado ? (
                    <>
                      <CheckIcon className="w-4 h-4 text-emerald-600" />
                      <span className="text-emerald-700">Legenda Copiada!</span>
                    </>
                  ) : (
                    <>
                      <ClipboardDocumentCheckIcon className="w-4 h-4 text-slate-600" />
                      <span>📋 Copiar Legenda</span>
                    </>
                  )}
                </button>

                <a
                  href={linkIntencaoX}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[#0f1419] hover:bg-black text-white font-bold py-3 px-4 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 text-sm"
                >
                  <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                  <span>🌐 Abrir e Publicar no X</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
