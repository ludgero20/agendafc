'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  SparklesIcon,
  ArrowDownTrayIcon,
  DocumentDuplicateIcon,
  CheckCircleIcon,
  ArrowTopRightOnSquareIcon,
  ArrowPathIcon,
  PhotoIcon,
  CalendarDaysIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/solid';

type JogoDisponivel = {
  id: number;
  data: string;
  dataLabel: 'hoje' | 'amanha';
  hora: string;
  campeonato: string;
  time1: string;
  time2: string;
  canal: string;
  fase?: string;
};

type EstudioPostXProps = {
  senha: string;
};

export default function EstudioPostX({ senha }: EstudioPostXProps) {
  const [dataSelecionada, setDataSelecionada] = useState<'hoje' | 'amanha'>('hoje');
  const [jogosPorData, setJogosPorData] = useState<{ hoje: JogoDisponivel[]; amanha: JogoDisponivel[] }>({
    hoje: [],
    amanha: []
  });
  const [carregandoJogos, setCarregandoJogos] = useState(true);
  const [erroCarregamento, setErroCarregamento] = useState<string | null>(null);

  // Seleção de jogos (IDs)
  const [selecionados, setSelecionados] = useState<number[]>([]);

  // Estados de geração
  const [gerando, setGerando] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [copy, setCopy] = useState<string>('');
  const [copiadoTexto, setCopiadoTexto] = useState(false);
  const [copiadoImagem, setCopiadoImagem] = useState(false);
  const [baixandoImagem, setBaixandoImagem] = useState(false);
  const [feedbackAviso, setFeedbackAviso] = useState<string | null>(null);

  // Carregar jogos disponíveis
  const carregarJogos = useCallback(async () => {
    setCarregandoJogos(true);
    setErroCarregamento(null);
    try {
      const res = await fetch(`/api/admin/jogos-disponiveis?senha=${encodeURIComponent(senha)}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setJogosPorData(data.jogos);
      } else {
        setErroCarregamento(data.error || 'Erro ao carregar jogos.');
      }
    } catch (err: any) {
      setErroCarregamento(err.message || 'Erro de conexão.');
    } finally {
      setCarregandoJogos(false);
    }
  }, [senha]);

  useEffect(() => {
    carregarJogos();
  }, [carregarJogos]);

  // Lista de jogos da aba atual
  const jogosAtuais = useMemo(() => {
    return jogosPorData[dataSelecionada] || [];
  }, [jogosPorData, dataSelecionada]);

  // Limpa seleção ao trocar de data
  const handleTrocarData = (novaData: 'hoje' | 'amanha') => {
    setDataSelecionada(novaData);
    setSelecionados([]);
    setImageUrl(null);
    setCopy('');
    setFeedbackAviso(null);
  };

  // Alterna checkbox de jogo (mín 2, máx 4)
  const toggleJogo = (id: number) => {
    setFeedbackAviso(null);
    if (selecionados.includes(id)) {
      setSelecionados(selecionados.filter(item => item !== id));
    } else {
      if (selecionados.length >= 4) {
        setFeedbackAviso('Você pode selecionar no máximo 4 jogos para garantir que o card fique nítido no feed.');
        return;
      }
      setSelecionados([...selecionados, id]);
    }
  };

  // Jogos selecionados como objetos
  const jogosObjetosSelecionados = useMemo(() => {
    return jogosAtuais.filter(j => selecionados.includes(j.id));
  }, [jogosAtuais, selecionados]);

  // Contador de caracteres real do X (URLs contam como 23 chars no t.co)
  const contagemCaracteresX = useMemo(() => {
    const textoComUrlPadrao = copy.replace(/(?:https?:\/\/)?agendafc\.com\.br[^\s]*/gi, '12345678901234567890123');
    return textoComUrlPadrao.length;
  }, [copy]);

  const limiteExcedido = contagemCaracteresX > 280;

  // Gerar post (Arte + Copywriting)
  const handleGerarPost = async () => {
    if (selecionados.length < 2) {
      setFeedbackAviso('Selecione pelo menos 2 jogos para montar o post do X.');
      return;
    }

    setGerando(true);
    setFeedbackAviso(null);
    setCopiadoTexto(false);
    setCopiadoImagem(false);

    try {
      const payloadJogos = jogosObjetosSelecionados.map(j => ({
        time1: j.time1,
        time2: j.time2,
        hora: j.hora,
        canal: j.canal,
        campeonato: j.campeonato
      }));

      const dataTituloStr = dataSelecionada === 'amanha' ? 'JOGOS DE AMANHÃ NA TV' : 'JOGOS DE HOJE NA TV';

      // 1. URL da Imagem gerada via next/og
      const imgUrl = `/api/og/post-x?jogos=${encodeURIComponent(JSON.stringify(payloadJogos))}&dataTitulo=${encodeURIComponent(dataTituloStr)}&v=${Date.now()}`;
      setImageUrl(imgUrl);

      // 2. Chamada para o gerador de copy (Gemini)
      const resCopy = await fetch('/api/admin/gerar-copy-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senha,
          jogos: payloadJogos,
          dataLabel: dataSelecionada
        })
      });

      const dataCopy = await resCopy.json();
      if (resCopy.ok && dataCopy.success) {
        setCopy(dataCopy.texto);
      } else {
        // Fallback de texto caso a rota falhe
        const fallbackTxt = `⚽ Jogos de ${dataSelecionada} na TV:\n` +
          payloadJogos.map(j => `• ${j.time1} x ${j.time2} às ${j.hora} (${j.canal})`).join('\n') +
          `\n📲 Guia completo em agendafc.com.br`;
        setCopy(fallbackTxt);
      }
    } catch (err: any) {
      setFeedbackAviso(`Erro ao gerar conteúdo: ${err.message}`);
    } finally {
      setGerando(false);
    }
  };

  // Copiar Imagem para a Área de Transferência (Clipboard API)
  const handleCopiarImagem = async () => {
    if (!imageUrl) return;
    try {
      setCopiadoImagem(false);
      const res = await fetch(imageUrl);
      const blob = await res.blob();

      if (navigator.clipboard && typeof ClipboardItem !== 'undefined') {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ]);
        setCopiadoImagem(true);
        setTimeout(() => setCopiadoImagem(false), 4000);
      } else {
        // Fallback caso navegador não suporte cópia de blob
        handleBaixarImagem();
      }
    } catch (err) {
      console.warn('Cópia direta da imagem não suportada no navegador, iniciando download...', err);
      handleBaixarImagem();
    }
  };

  // Baixar imagem em arquivo PNG
  const handleBaixarImagem = async () => {
    if (!imageUrl) return;
    setBaixandoImagem(true);
    try {
      const res = await fetch(imageUrl);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `agendafc-jogos-${dataSelecionada}-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      alert('Erro ao baixar a imagem.');
    } finally {
      setBaixandoImagem(false);
    }
  };

  // Copiar texto da legenda
  const handleCopiarTexto = async () => {
    if (!copy) return;
    await navigator.clipboard.writeText(copy);
    setCopiadoTexto(true);
    setTimeout(() => setCopiadoTexto(false), 3000);
  };

  // Abrir caixa de post no X via Web Intent
  const handleAbrirNoX = () => {
    const url = `https://x.com/intent/post?text=${encodeURIComponent(copy)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-8">
      {/* CABEÇALHO DO ESTÚDIO */}
      <div className="bg-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-bold uppercase tracking-wider mb-3">
            <SparklesIcon className="w-4 h-4" /> Estúdio de Divulgação
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
            Gerador de Posts para o X (Twitter)
          </h2>
          <p className="text-slate-400 text-sm sm:text-base mt-2">
            Selecione de 2 a 4 jogos em destaque. Gere em 1 clique a arte em 1200x675 px com escudos oficiais e a legenda persuasiva criada por IA.
          </p>
        </div>
      </div>

      {/* SELETOR DE DATA & RECARREGAR */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2">
          <CalendarDaysIcon className="w-5 h-5 text-slate-500" />
          <span className="text-sm font-bold text-slate-700">Data dos Jogos:</span>
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => handleTrocarData('hoje')}
              className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${
                dataSelecionada === 'hoje'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Jogos de Hoje ({jogosPorData.hoje.length})
            </button>
            <button
              type="button"
              onClick={() => handleTrocarData('amanha')}
              className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${
                dataSelecionada === 'amanha'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Jogos de Amanhã ({jogosPorData.amanha.length})
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={carregarJogos}
          disabled={carregandoJogos}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-blue-600 bg-slate-50 hover:bg-slate-100 px-3 py-2 rounded-xl transition-all"
        >
          <ArrowPathIcon className={`w-4 h-4 ${carregandoJogos ? 'animate-spin' : ''}`} />
          Atualizar Lista
        </button>
      </div>

      {/* MENSAGEM DE ERRO OU FEEDBACK */}
      {erroCarregamento && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
          <ExclamationCircleIcon className="w-5 h-5 flex-shrink-0" />
          <span>{erroCarregamento}</span>
        </div>
      )}

      {feedbackAviso && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-sm flex items-center gap-2">
          <ExclamationCircleIcon className="w-5 h-5 flex-shrink-0" />
          <span>{feedbackAviso}</span>
        </div>
      )}

      {/* LISTA DE JOGOS PARA SELEÇÃO */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-extrabold text-slate-900">
              Escolha os Destaques ({selecionados.length}/4 selecionados)
            </h3>
            <p className="text-xs text-slate-500">
              Marque os 2 a 4 confrontos que você quer divulgar no post.
            </p>
          </div>
          {selecionados.length > 0 && (
            <button
              type="button"
              onClick={() => setSelecionados([])}
              className="text-xs font-bold text-red-600 hover:underline"
            >
              Limpar seleção
            </button>
          )}
        </div>

        {carregandoJogos ? (
          <div className="py-12 text-center text-slate-400 text-sm">
            <ArrowPathIcon className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
            Carregando jogos ativos de {dataSelecionada}...
          </div>
        ) : jogosAtuais.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-sm bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            Nenhum jogo encontrado para {dataSelecionada}. Verifique se a planilha ou a base de dados possui jogos agendados.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[360px] overflow-y-auto pr-1">
            {jogosAtuais.map((jogo) => {
              const marcado = selecionados.includes(jogo.id);
              return (
                <div
                  key={jogo.id}
                  onClick={() => toggleJogo(jogo.id)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    marcado
                      ? 'border-blue-600 bg-blue-50/70 shadow-2xs'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <input
                      type="checkbox"
                      checked={marcado}
                      onChange={() => {}} // tratado no onClick do container
                      className="w-4 h-4 text-blue-600 rounded-md border-slate-300 focus:ring-blue-500 pointer-events-none"
                    />
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-slate-900 truncate">
                        {jogo.time1} <span className="text-slate-400 font-normal">x</span> {jogo.time2}
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                        <span className="font-semibold text-blue-600">🕒 {jogo.hora}</span>
                        <span>•</span>
                        <span className="truncate">📺 {jogo.canal}</span>
                      </div>
                    </div>
                  </div>
                  {jogo.campeonato && (
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[11px] font-bold whitespace-nowrap flex-shrink-0">
                      {jogo.campeonato}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* BOTÃO GERAR */}
        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={handleGerarPost}
            disabled={gerando || selecionados.length < 2}
            className={`inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-black transition-all shadow-md ${
              gerando || selecionados.length < 2
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                : 'bg-blue-600 hover:bg-blue-700 text-white hover:shadow-lg active:scale-98'
            }`}
          >
            {gerando ? (
              <>
                <ArrowPathIcon className="w-5 h-5 animate-spin" />
                Criando Arte e Copy...
              </>
            ) : (
              <>
                <SparklesIcon className="w-5 h-5" />
                Gerar Post Completo (Arte + Legenda)
              </>
            )}
          </button>
        </div>
      </div>

      {/* ÁREA DE PRÉ-VISUALIZAÇÃO E AÇÕES RÁPIDAS */}
      {imageUrl && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-blue-200 shadow-lg space-y-6 animate-fade-in">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
              <h3 className="text-xl font-black text-slate-900">Prévia do Post Gerado</h3>
            </div>
            <span className="text-xs font-bold text-slate-500">
              Formato Oficial 16:9 (1200 x 675 px)
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* COLUNA ESQUERDA: IMAGEM GERADA */}
            <div className="lg:col-span-7 space-y-4">
              <div className="relative rounded-2xl overflow-hidden border border-slate-800 shadow-md bg-slate-950 aspect-[16/9] group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageUrl}
                  alt="Prévia do Post para o X"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Botões de Imagem */}
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleCopiarImagem}
                  className={`flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border shadow-2xs ${
                    copiadoImagem
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-slate-900 hover:bg-slate-800 text-white border-slate-900'
                  }`}
                >
                  {copiadoImagem ? (
                    <>
                      <CheckCircleIcon className="w-4 h-4 text-white" />
                      Imagem Copiada! Pressione Ctrl+V no X
                    </>
                  ) : (
                    <>
                      <PhotoIcon className="w-4 h-4" />
                      Copiar Imagem (Ctrl+V no X)
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleBaixarImagem}
                  disabled={baixandoImagem}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-all"
                >
                  <ArrowDownTrayIcon className="w-4 h-4" />
                  {baixandoImagem ? 'Baixando...' : 'Baixar PNG'}
                </button>
              </div>
            </div>

            {/* COLUNA DIREITA: LEGENDA / COPY */}
            <div className="lg:col-span-5 space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Legenda para o X (Editável)
                  </label>
                  <span
                    className={`text-xs font-black px-2 py-0.5 rounded-full ${
                      limiteExcedido
                        ? 'bg-red-100 text-red-700'
                        : contagemCaracteresX > 250
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {contagemCaracteresX} / 280 caracteres
                  </span>
                </div>

                <textarea
                  rows={6}
                  value={copy}
                  onChange={(e) => setCopy(e.target.value)}
                  placeholder="Texto do tweet gerado por IA..."
                  className="w-full p-3.5 text-sm bg-slate-50 border border-slate-300 rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-hidden transition-all text-slate-800 resize-none font-sans leading-relaxed"
                />

                {limiteExcedido && (
                  <p className="text-xs text-red-600 font-bold mt-1.5 flex items-center gap-1">
                    <ExclamationCircleIcon className="w-4 h-4" />
                    O texto ultrapassou 280 caracteres. Reduza algumas palavras antes de postar.
                  </p>
                )}
              </div>

              {/* AÇÕES DA LEGENDA */}
              <div className="space-y-3 pt-2">
                <button
                  type="button"
                  onClick={handleCopiarTexto}
                  className={`w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border shadow-2xs ${
                    copiadoTexto
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                      : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-300'
                  }`}
                >
                  {copiadoTexto ? (
                    <>
                      <CheckCircleIcon className="w-4 h-4 text-emerald-600" />
                      Legenda copiada com sucesso!
                    </>
                  ) : (
                    <>
                      <DocumentDuplicateIcon className="w-4 h-4 text-slate-500" />
                      Copiar Apenas o Texto
                    </>
                  )}
                </button>

                {/* BOTÃO PRINCIPAL: ABRIR NO X */}
                <button
                  type="button"
                  onClick={handleAbrirNoX}
                  disabled={limiteExcedido}
                  className={`w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-sm font-black transition-all shadow-md ${
                    limiteExcedido
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                      : 'bg-black hover:bg-slate-900 text-white hover:shadow-lg active:scale-98'
                  }`}
                >
                  <ArrowTopRightOnSquareIcon className="w-4 h-4 text-blue-400" />
                  Abrir Caixa de Tweet no X 🚀
                </button>
                <p className="text-[11px] text-center text-slate-400">
                  Dica: Clique em <strong>Copiar Imagem</strong> e, na janela do X que abrir, aperte <strong>Ctrl + V</strong> para colar a arte!
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

