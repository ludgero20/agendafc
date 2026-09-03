import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Sobre o Agenda FC - Onde assistir futebol, F1, NFL e mais",
  description: "Conheça a nossa história e missão. O Agenda FC é a sua plataforma completa para encontrar horários e canais de transmissão de futebol, Fórmula 1, NFL e outros esportes de forma fácil e rápida.",
  keywords: "Agenda FC, sobre nós, missão, visão, futebol, NFL, fórmula 1, onde assistir, transmissão esportiva, canais de esporte",
  authors: [{ name: "Agenda FC" }],
};

export default function Sobre() {
  return (
    <div className="space-y-12 max-w-5xl mx-auto py-6">
      <div className="text-center py-6 space-y-3">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
          ℹ️ Sobre o Agenda FC
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          Mais do que um site, somos a sua bússola para não perder nenhum lance no mundo dos esportes.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Nossa Missão */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
              <span>🎯</span> Nossa Missão
            </h2>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed mb-4">
              O <strong>Agenda FC</strong> nasceu de uma necessidade diária de todo fã de esportes: a dificuldade de saber, de forma rápida e confiável, onde e a que horas assistir às principais partidas e corridas. 
            </p>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              Nossa missão é acabar com essa busca cansativa, compilando as informações oficiais sobre transmissões de <strong>Futebol, Fórmula 1, NFL</strong> e grandes eventos esportivos em um só lugar.
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-100 text-xs font-semibold text-blue-600">
            A parada obrigatória de quem ama esporte.
          </div>
        </div>

        {/* O que Você Encontra Aqui */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/90 shadow-xs">
          <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
            <span>✨</span> O que Você Encontra Aqui
          </h2>
          <ul className="space-y-3.5 text-sm sm:text-base text-slate-600">
            <li className="flex items-start gap-2.5">
              <span className="text-emerald-500 font-bold">✓</span>
              <span>
                <strong className="text-slate-900">Grade de Jogos Atualizada:</strong> Informações diárias sobre partidas do Brasil e do futebol internacional com canais verificados.
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="text-emerald-500 font-bold">✓</span>
              <span>
                <strong className="text-slate-900">Cobertura de Ligas e Modalidades:</strong> Acompanhamento do Brasileirão, Champions League, Premier League, La Liga, além de cobertura completa da Fórmula 1 e da NFL.
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="text-emerald-500 font-bold">✓</span>
              <span>
                <strong className="text-slate-900">Agilidade e Simplicidade:</strong> Design limpo e intuitivo, feito para que você encontre a informação que precisa em poucos cliques, no celular ou no computador.
              </span>
            </li>
          </ul>
        </div>

        {/* Por que Confiar em Nós */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 col-span-full border border-slate-200/90 shadow-xs text-center space-y-3">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center justify-center gap-2">
            <span>🛡️</span> Por que Confiar no Agenda FC?
          </h2>
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed max-w-3xl mx-auto">
            Nossa dedicação é total à <strong>precisão das informações</strong>. Os dados de transmissão são checados e compilados continuamente para garantir que você não perca nenhum evento ao vivo. O Agenda FC é feito por torcedores, para torcedores, com a convicção de que a emoção do jogo começa com a informação certa.
          </p>
        </div>
      </div>
    </div>
  );
}