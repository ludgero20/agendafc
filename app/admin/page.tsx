'use client';

import React, { useState } from 'react';
import { LockClosedIcon, SparklesIcon, CheckCircleIcon, ArrowPathIcon } from '@heroicons/react/24/solid';

export default function AdminPage() {
  const [senha, setSenha] = useState('');
  const [autenticado, setAutenticado] = useState(false);
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
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm text-center font-medium"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-sm"
          >
            Acessar Painel
          </button>
        </form>
      </div>
    );
  }

  // PAINEL DE COLAR TEXTO
  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-8">
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/90 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-5">
          <div>
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
              Autenticado
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
              Importador Rápido de Jogos com IA
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Copie o texto com os jogos do fim de semana e cole abaixo para atualizar todo o site.
            </p>
          </div>
          <button
            onClick={() => { setAutenticado(false); setSenha(''); }}
            className="text-xs font-bold text-slate-500 hover:text-red-600 transition-colors"
          >
            Sair do Painel
          </button>
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
            className="w-full p-4 border border-slate-300 rounded-2xl font-mono text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-slate-50/50 leading-relaxed"
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
          className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold py-4 rounded-2xl transition-all shadow-md flex items-center justify-center gap-2.5 text-base hover:scale-[1.01]"
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
    </div>
  );
}