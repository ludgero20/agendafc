'use client';

import React, { useState } from 'react';
import {
  LockClosedIcon,
  SparklesIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  ArrowDownTrayIcon,
  ShareIcon
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
        setResultado({ sucesso: true, mensagem: data.message, quantidade: data.quantidadeJogos });
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

      {/* CONTEÚDO DA ABA 1: IMPORTADOR RÁPIDO */}
      {abaAtiva === 'importador' && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Importador Rápido de Jogos com IA
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Copie o texto com os jogos do fim de semana e cole abaixo para atualizar todo o site.
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
              rows={14}
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
                <span>O Gemini está processando todos os jogos e salvando...</span>
              </>
            ) : (
              <>
                <SparklesIcon className="w-5 h-5" />
                <span>Processar com IA e Publicar na Agenda</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* CONTEÚDO DA ABA 2: ESTÚDIO DE POSTAGEM DO X */}
      {abaAtiva === 'estudio-x' && (
        <EstudioPostX senha={senha} />
      )}
    </div>
  );
}