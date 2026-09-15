'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  LockClosedIcon,
  SparklesIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  ArrowDownTrayIcon,
  ShareIcon,
  BookmarkIcon,
  ClipboardDocumentIcon,
  ClipboardDocumentCheckIcon,
  ArrowTopRightOnSquareIcon,
  BoltIcon
} from '@heroicons/react/24/solid';
import EstudioPostX from '@/app/components/admin/EstudioPostX';

export default function AdminPage() {
  const [senha, setSenha] = useState('');
  const [autenticado, setAutenticado] = useState(false);
  const [abaAtiva, setAbaAtiva] = useState<'importador' | 'estudio-x'>('importador');

  // Estados do Importador Rápido
  const [textoBruto, setTextoBruto] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [resultado, setResultado] = useState<{ sucesso?: boolean; mensagem?: string; quantidade?: number } | null>(null);
  const [copiadoBookmarklet, setCopiadoBookmarklet] = useState(false);
  const bookmarkRef = useRef<HTMLAnchorElement>(null);

  const bookmarkletCode = `javascript:(function(){const u='https://agendafc.com.br/api/processar-texto';function t(m,y){let e=document.getElementById('afc-t');if(!e){e=document.createElement('div');e.id='afc-t';e.style.cssText='position:fixed;top:24px;right:24px;z-index:2147483647;padding:14px 20px;border-radius:14px;font-family:system-ui,-apple-system,sans-serif;font-size:13px;font-weight:600;box-shadow:0 12px 30px rgba(0,0,0,0.5);display:flex;align-items:center;gap:10px;max-width:380px;line-height:1.4;cursor:pointer;';document.body.appendChild(e);e.onclick=function(){e.remove();};}let i='';if(y==='info'){e.style.background='#0f172a';e.style.color='#38bdf8';e.style.border='1px solid #0284c7';i='<div style="width:14px;height:14px;border:2px solid #38bdf8;border-top-color:transparent;border-radius:50%;animation:afcs 0.8s linear infinite;flex-shrink:0;"></div><style>@keyframes afcs{to{transform:rotate(360deg)}}</style>';}else if(y==='ok'){e.style.background='#064e3b';e.style.color='#6ee7b7';e.style.border='1px solid #10b981';i='⚽ ';}else{e.style.background='#450a0a';e.style.color='#fca5a5';e.style.border='1px solid #ef4444';i='⚠️ ';}e.innerHTML=i+'<span>'+m+'</span>';if(y!=='info'){setTimeout(function(){if(e)e.remove();},7000);}}let p=localStorage.getItem('agendafc_admin_senha');if(!p){p=prompt('🔒 Digite sua senha de administrador do Agenda FC:');if(!p)return;p=p.trim();localStorage.setItem('agendafc_admin_senha',p);}let s=window.getSelection().toString().trim();if(!s||s.length<50){let el=document.querySelectorAll('h2,h3,table'),tb=[],d='';el.forEach(function(x){let g=x.tagName.toLowerCase();if(g==='h2'||g==='h3'){let h=(x.innerText||'').trim();if(/jogos de/i.test(h)||/\\d{1,2}\\s+de\\s+[a-zçãéíóú]+/i.test(h)){d=h;tb.push('\\n'+d);}}else if(g==='table'&&d){x.querySelectorAll('tr').forEach(function(r){let c=Array.from(r.querySelectorAll('td')).map(function(td){return (td.innerText||'').trim();});if(c.length>=4&&(c[0].includes(' x ')||c[0].includes(' X ')||c[0].includes(' vs '))){tb.push(c.slice(0,4).join('\\t'));}});}});s=tb.length>=3?tb.join('\\n'):(document.querySelector('article,main,.article-body')||document.body).innerText;}if(!s||s.length<50){t('Não foi possível extrair a programação de jogos desta página.','err');return;}t('O Agenda FC está processando os jogos...','info');fetch(u,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({senha:p,textoBruto:s})}).then(function(r){return r.json().then(function(d){return {ok:r.ok,d:d};});}).then(function(res){if(res.ok&&res.d.success){const tot=res.d.quantidadeTotalSalva?' ('+res.d.quantidadeTotalSalva+' jogos)':'';t('✅ '+(res.d.message||'Jogos publicados na Agenda!')+tot,'ok');}else{if(res.d.error&&res.d.error.toLowerCase().includes('senha')){localStorage.removeItem('agendafc_admin_senha');}t('❌ Erro: '+(res.d.error||'Falha ao processar.'),'err');}}).catch(function(e){t('❌ Erro de conexão: '+e.message,'err');});})();`;

  useEffect(() => {
    if (bookmarkRef.current) {
      bookmarkRef.current.setAttribute('href', bookmarkletCode);
    }
  }, [bookmarkletCode, abaAtiva, autenticado]);

  const handleCopiarBookmarklet = () => {
    navigator.clipboard.writeText(bookmarkletCode);
    setCopiadoBookmarklet(true);
    setTimeout(() => setCopiadoBookmarklet(false), 3000);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (senha.trim().length > 0) {
      setAutenticado(true);
    }
  };

  const handleProcessar = async () => {
    if (!textoBruto.trim()) {
      alert("Por favor, cole o texto antes de processar.");
      return;
    }

    setCarregando(true);
    setResultado(null);

    try {
      const res = await fetch('/api/processar-texto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senha, textoBruto })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setResultado({ sucesso: true, mensagem: data.message, quantidade: data.quantidadeTotalSalva || data.quantidadeJogos });
        setTextoBruto('');
      } else {
        setResultado({ sucesso: false, mensagem: data.error || 'Erro ao processar.' });
      }
    } catch (err: any) {
      setResultado({ sucesso: false, mensagem: err.message || 'Erro de conexão.' });
    } finally {
      setCarregando(false);
    }
  };

  // TELA DE LOGIN POR SENHA
  if (!autenticado) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <form onSubmit={handleLogin} className="bg-white p-8 rounded-2xl border border-slate-200 shadow-md max-w-md w-full space-y-5 text-center">
          <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto">
            <LockClosedIcon className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">Painel Administrativo</h1>
            <p className="text-xs text-slate-500 mt-1">Digite sua senha de acesso para atualizar a agenda</p>
          </div>
          <div>
            <input
              type="password"
              placeholder="Digite a senha de administrador"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden text-sm text-center font-medium"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-xs cursor-pointer"
          >
            Acessar Painel
          </button>
        </form>
      </div>
    );
  }

  // PAINEL ADMINISTRATIVO AUTENTICADO COM ABAS
  return (
    <div className="max-w-5xl mx-auto py-8 px-4 space-y-6">
      {/* BARRA SUPERIOR DE AUTENTICAÇÃO E NAVEGAÇÃO DE ABAS */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
            Autenticado
          </span>
          <span className="text-sm font-bold text-slate-700">Agenda FC Admin</span>
        </div>

        {/* NAVEGADOR DE ABAS */}
        <div className="flex bg-slate-100 p-1.5 rounded-2xl w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setAbaAtiva('importador')}
            className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              abaAtiva === 'importador'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ArrowDownTrayIcon className="w-4 h-4 text-emerald-600" />
            Importador de Jogos
          </button>
          <button
            type="button"
            onClick={() => setAbaAtiva('estudio-x')}
            className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              abaAtiva === 'estudio-x'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShareIcon className="w-4 h-4 text-blue-600" />
            Estúdio do X (Twitter)
          </button>
        </div>

        <button
          onClick={() => { setAutenticado(false); setSenha(''); }}
          className="text-xs font-bold text-slate-500 hover:text-red-600 transition-colors"
        >
          Sair do Painel
        </button>
      </div>

      {/* CONTEÚDO DA ABA 1: IMPORTADOR */}
      {abaAtiva === 'importador' && (
        <div className="space-y-6">
          {/* CARD NOVO: BOOKMARKLET DE 1 CLIQUE */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6 sm:p-8 rounded-3xl border border-slate-700/60 shadow-lg relative overflow-hidden">
            {/* Decoração sutil de fundo */}
            <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="relative z-10 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="inline-flex items-center gap-2 bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
                  <BoltIcon className="w-3.5 h-3.5" />
                  Alimentação em 1 Clique
                </div>
                <a
                  href="https://www.goal.com/br/listas/futebol-programacao-jogos-tv-aberta-fechada-onde-assistir-online-app/bltc0a7361374657315"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-slate-300 hover:text-white transition-colors bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-xl border border-white/10"
                >
                  <span>Abrir Matéria da Goal.com</span>
                  <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" />
                </a>
              </div>

              <div>
                <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                  <span>⚽ Atalho de Favoritos (Bookmarklet)</span>
                </h2>
                <p className="text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
                  Atualize toda a agenda diretamente do <strong>Goal.com</strong> sem precisar copiar e colar.
                  Arraste o botão abaixo para a sua barra de favoritos do navegador:
                </p>
              </div>

              {/* ÁREA DE AÇÃO DO BOOKMARKLET */}
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <a
                  ref={bookmarkRef}
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    alert('👉 Para instalar:\nArraste este botão diretamente para a sua Barra de Favoritos do navegador!\n\n(Ou clique em "Copiar Código" ao lado).');
                  }}
                  className="inline-flex items-center gap-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black px-6 py-3.5 rounded-2xl shadow-lg hover:shadow-emerald-500/25 transition-all cursor-grab active:cursor-grabbing text-sm sm:text-base select-none"
                  title="Arraste para sua barra de favoritos"
                >
                  <BookmarkIcon className="w-5 h-5 text-slate-900" />
                  <span>⚽ Enviar p/ Agenda FC</span>
                </a>

                <button
                  type="button"
                  onClick={handleCopiarBookmarklet}
                  className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-4 py-3.5 rounded-2xl transition-all text-sm border border-slate-700 cursor-pointer"
                >
                  {copiadoBookmarklet ? (
                    <>
                      <ClipboardDocumentCheckIcon className="w-5 h-5 text-emerald-400" />
                      <span className="text-emerald-400 font-bold">Código Copiado!</span>
                    </>
                  ) : (
                    <>
                      <ClipboardDocumentIcon className="w-5 h-5 text-slate-400" />
                      <span>Copiar Código</span>
                    </>
                  )}
                </button>
              </div>

              {/* GUIA PASSO A PASSO */}
              <div className="bg-slate-950/60 rounded-2xl p-4 border border-slate-800/80 text-xs text-slate-300 space-y-2">
                <div className="font-bold text-emerald-400 uppercase tracking-wide text-[11px]">Como Instalar e Usar:</div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-white/5 p-3 rounded-xl border border-white/5 space-y-1">
                    <span className="font-extrabold text-white">1. Ative os Favoritos</span>
                    <p className="text-slate-400">Pressione <kbd className="bg-slate-800 px-1.5 py-0.5 rounded text-[10px] text-white">Ctrl + Shift + B</kbd> (Mac: <kbd className="bg-slate-800 px-1.5 py-0.5 rounded text-[10px] text-white">Cmd + Shift + B</kbd>) para exibir a barra.</p>
                  </div>
                  <div className="bg-white/5 p-3 rounded-xl border border-white/5 space-y-1">
                    <span className="font-extrabold text-white">2. Arraste o Botão</span>
                    <p className="text-slate-400">Arraste o botão verde <strong className="text-emerald-300">⚽ Enviar p/ Agenda FC</strong> para a barra de favoritos.</p>
                  </div>
                  <div className="bg-white/5 p-3 rounded-xl border border-white/5 space-y-1">
                    <span className="font-extrabold text-white">3. Clique na Goal.com</span>
                    <p className="text-slate-400">Abra a matéria da Goal.com e clique no favorito. Ele pedirá a senha apenas na 1ª vez e atualizará tudo!</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* CARD TRADICIONAL: IMPORTADOR RÁPIDO MANUAL */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                Importador Manual (Copiar e Colar)
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Caso prefira, copie o texto com os jogos e cole abaixo para processar.
              </p>
            </div>

            {/* FEEDBACK DE SUCESSO OU ERRO */}
            {resultado && (
              <div className={`p-4 rounded-xl border flex items-center gap-3 ${
                resultado.sucesso ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-red-50 text-red-800 border-red-200'
              }`}>
                {resultado.sucesso && <CheckCircleIcon className="w-6 h-6 flex-shrink-0 text-emerald-600" />}
                <p className="text-sm font-bold">{resultado.mensagem}</p>
              </div>
            )}

            {/* CAMPO DE TEXTO GRANDE */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-800">
                Cole aqui o texto bruto com as tabelas de jogos:
              </label>
              <textarea
                rows={12}
                placeholder="Cole aqui o texto copiado (com jogos de sexta, sábado, domingo...)"
                value={textoBruto}
                onChange={(e) => setTextoBruto(e.target.value)}
                disabled={carregando}
                className="w-full p-4 border border-slate-300 rounded-2xl font-mono text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden bg-slate-50/50 leading-relaxed"
              />
              <div className="flex justify-between text-xs text-slate-400">
                <span>{textoBruto.length} caracteres colados</span>
                <button 
                  type="button" 
                  onClick={() => setTextoBruto('')} 
                  className="text-slate-500 hover:underline"
                >
                  Limpar caixa
                </button>
              </div>
            </div>

            {/* BOTÃO DE AÇÃO */}
            <button
              type="button"
              onClick={handleProcessar}
              disabled={carregando || !textoBruto.trim()}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold py-4 rounded-2xl transition-all shadow-md flex items-center justify-center gap-2.5 text-base hover:scale-[1.01] cursor-pointer"
            >
              {carregando ? (
                <>
                  <ArrowPathIcon className="w-5 h-5 animate-spin" />
                  <span>O servidor está processando todos os jogos e salvando...</span>
                </>
              ) : (
                <>
                  <SparklesIcon className="w-5 h-5" />
                  <span>Processar e Publicar na Agenda</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* CONTEÚDO DA ABA 2: ESTÚDIO DE POSTAGEM DO X */}
      {abaAtiva === 'estudio-x' && (
        <EstudioPostX senha={senha} />
      )}
    </div>
  );
}