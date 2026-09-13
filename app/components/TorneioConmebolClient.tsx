// app/components/TorneioConmebolClient.tsx
'use client';

import React, { useState } from 'react';
import CopaMataMataClient, { EtapaCopa } from './CopaMataMataClient';

interface Props {
  etapas: EtapaCopa[];
  etapaInicialSlug: string;
  renderGrupos: React.ReactNode;
}

export default function TorneioConmebolClient({ etapas, etapaInicialSlug, renderGrupos }: Props) {
  // Mantém a visualização inicial no mata-mata (que é a fase decisiva de setembro),
  // mas a ordem visual das abas fica [ Fase de Grupos | Mata-Mata ]
  const [visaoAtiva, setVisaoAtiva] = useState<'matamata' | 'grupos'>(
    etapas.length > 0 ? 'matamata' : 'grupos'
  );

  return (
    <div className="space-y-6">
      {/* SELETOR CRONOLÓGICO: FASE DE GRUPOS (ESQUERDA) | MATA-MATA (DIREITA) */}
      <div className="flex justify-center">
        <div className="inline-flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shadow-2xs">
          {/* LADO ESQUERDO: GRUPOS */}
          <button
            onClick={() => setVisaoAtiva('grupos')}
            className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              visaoAtiva === 'grupos'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🏆 Fase de Grupos
          </button>

          {/* LADO DIREITO: MATA-MATA */}
          <button
            onClick={() => setVisaoAtiva('matamata')}
            className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              visaoAtiva === 'matamata'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ⚔️ Mata-Mata e Fases Finais
          </button>
        </div>
      </div>

      {/* CONTEÚDO DINÂMICO */}
      {visaoAtiva === 'matamata' ? (
        <div className="space-y-4">
          <CopaMataMataClient etapas={etapas} etapaInicialSlug={etapaInicialSlug} />
        </div>
      ) : (
        <div>{renderGrupos}</div>
      )}
    </div>
  );
}