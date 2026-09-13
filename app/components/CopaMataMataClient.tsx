// app/components/CopaMataMataClient.tsx
'use client';

import React, { useState } from 'react';

export type ConfrontoCopa = {
  id: string;
  data: string;
  hora: string;
  timeCasa: string;
  timeVisitante: string;
  escudoCasa: string;
  escudoVisitante: string;
  placarCasa: string | null;
  placarVisitante: string | null;
  faseSlug: string;
  faseTitulo: string;
  notaAgregado: string;
  status: 'Finalizado' | 'Ao Vivo' | 'Agendado';
};

export type EtapaCopa = {
  slug: string;
  titulo: string;
  jogos: ConfrontoCopa[];
};

export interface CopaMataMataClientProps {
  etapas: EtapaCopa[];
  etapaInicialSlug: string;
}

// 🧠 Separa a perna ("Ida" / "Volta") do texto longo do agregado
function separarNotaAgregado(nota: string): { pernaBadge: string | null; detalheAgregado: string | null } {
  if (!nota) return { pernaBadge: null, detalheAgregado: null };

  let pernaBadge: string | null = null;
  let detalheAgregado: string | null = null;

  if (nota.includes(' - ')) {
    const partes = nota.split(' - ');
    pernaBadge = partes[0].trim(); // Ex: "Jogo de Volta" ou "Jogo de Ida"
    detalheAgregado = partes.slice(1).join(' - ').trim(); // Ex: "Grêmio venceu por 3-1 no agregado"
  } else if (nota.toLowerCase().includes('ida')) {
    pernaBadge = 'Jogo de Ida';
  } else if (nota.toLowerCase().includes('volta')) {
    pernaBadge = 'Jogo de Volta';
  } else {
    detalheAgregado = nota;
  }

  // Encurta a etiqueta do topo para ficar super limpa
  if (pernaBadge?.toLowerCase().includes('volta')) pernaBadge = 'Volta';
  if (pernaBadge?.toLowerCase().includes('ida')) pernaBadge = 'Ida';

  return { pernaBadge, detalheAgregado };
}

export default function CopaMataMataClient({ etapas, etapaInicialSlug }: CopaMataMataClientProps) {
  const [etapaAtiva, setEtapaAtiva] = useState<string>(etapaInicialSlug || etapas[0]?.slug || '');

  const etapaSelecionada = etapas.find((e) => e.slug === etapaAtiva) || etapas[0];

  return (
    <div className="space-y-6">
      {/* SELETOR DE ABAS DAS FASES */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200 no-scrollbar">
        {etapas.map((etapa) => {
          const isActive = etapa.slug === etapaAtiva;
          return (
            <button
              key={etapa.slug}
              onClick={() => setEtapaAtiva(etapa.slug)}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all shadow-2xs ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'
              }`}
            >
              {etapa.titulo} ({etapa.jogos.length})
            </button>
          );
        })}
      </div>

      {/* LISTA DE CONFRONTOS DA FASE SELECIONADA */}
      {etapaSelecionada && etapaSelecionada.jogos.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {etapaSelecionada.jogos.map((jogo) => {
            const finalizado = jogo.status === 'Finalizado';
            const aoVivo = jogo.status === 'Ao Vivo';
            const { pernaBadge, detalheAgregado } = separarNotaAgregado(jogo.notaAgregado);

            return (
              <div
                key={jogo.id}
                className="bg-white rounded-2xl shadow-xs hover:shadow-md transition-all border border-slate-200/90 p-4 flex flex-col justify-between gap-3"
              >
                {/* 1. TOPO: Data/Hora e Etiqueta Limpa (Ida ou Volta) */}
                <div className="flex justify-between items-center text-xs text-slate-500 font-semibold border-b border-slate-100 pb-2">
                  <span>
                    {jogo.data} às {jogo.hora}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {pernaBadge && (
                      <span className="text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md text-[10px] font-bold border border-slate-200">
                        {pernaBadge}
                      </span>
                    )}
                    {aoVivo && (
                      <span className="text-red-700 bg-red-50 px-2 py-0.5 rounded-md text-[10px] font-extrabold animate-pulse border border-red-200">
                        Ao Vivo
                      </span>
                    )}
                  </div>
                </div>

                {/* 2. CENTRO: Times e Placar no Padrão do Agenda FC */}
                <div className="flex items-center justify-between py-1">
                  {/* Mandante */}
                  <div className="flex items-center gap-2 w-[40%] justify-end text-right">
                    <span className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                      {jogo.timeCasa}
                    </span>
                    <img
                      src={jogo.escudoCasa}
                      alt={jogo.timeCasa}
                      className="w-5 h-5 object-contain flex-shrink-0"
                    />
                  </div>

                  {/* Placar Esportivo */}
                  <div className="w-[20%] flex justify-center text-center">
                    {finalizado || aoVivo ? (
                      <div className="inline-flex items-center font-mono font-black text-sm text-slate-900 bg-slate-50 border border-slate-200 px-2.5 py-0.5 rounded-lg">
                        <span>{jogo.placarCasa ?? 0}</span>
                        <span className="mx-1 text-slate-300 font-normal">:</span>
                        <span>{jogo.placarVisitante ?? 0}</span>
                      </div>
                    ) : (
                      <span className="text-[10px] font-black uppercase text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">
                        vs
                      </span>
                    )}
                  </div>

                  {/* Visitante */}
                  <div className="flex items-center gap-2 w-[40%] justify-start text-left">
                    <img
                      src={jogo.escudoVisitante}
                      alt={jogo.timeVisitante}
                      className="w-5 h-5 object-contain flex-shrink-0"
                    />
                    <span className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                      {jogo.timeVisitante}
                    </span>
                  </div>
                </div>

                {/* 3. RODAPÉ DEDICADO: Informação de Agregado / Classificação */}
                {detalheAgregado && (
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[11px] font-bold text-purple-700 bg-purple-50/60 rounded-xl py-1.5 px-3 text-center">
                    <span className="text-xs">🏆</span>
                    <span className="capitalize">{detalheAgregado}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-10 text-center border border-slate-200 text-slate-400 text-sm">
          Confrontos desta fase aguardando sorteio e definição da CBF.
        </div>
      )}
    </div>
  );
}