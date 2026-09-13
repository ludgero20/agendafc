// app/components/time/TimeF1Info.tsx
import React from 'react';
import { TimeConfig } from '@/lib/times';
import { EquipeF1 } from '@/lib/services/f1-service';

export default function TimeF1Info({
  time,
  equipesF1,
}: {
  time: TimeConfig;
  equipesF1: EquipeF1[];
}) {
  const dadosTemporada = equipesF1.find(
    (e) => e.name.toLowerCase().includes(time.nomeOficialAPI.toLowerCase()) || time.nome.toLowerCase().includes(e.name.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* GRID: PILOTOS E FICHA TÉCNICA */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* PILOTOS OFICIAIS */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs space-y-4">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <span>🏎️</span> Pilotos Oficiais (Temporada 2026)
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {time.pilotos?.map((piloto) => (
              <div key={piloto} className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 text-center">
                <span className="text-2xl block mb-1">🏁</span>
                <span className="font-extrabold text-sm sm:text-base text-slate-900 block">{piloto}</span>
                <span className="text-[11px] text-slate-500 font-medium">Piloto Titular</span>
              </div>
            ))}
          </div>

          {/* CLASSIFICAÇÃO NO MUNDIAL DE CONSTRUTORES */}
          {dadosTemporada && (
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-700">
              <span>Posição Atual no Mundial:</span>
              <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-lg border border-blue-200">
                {dadosTemporada.position}º Lugar ({dadosTemporada.points} pts)
              </span>
            </div>
          )}
        </div>

        {/* FICHA TÉCNICA & HISTÓRICO */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs space-y-3 text-sm">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <span>📋</span> Ficha Técnica da Garagem
          </h3>

          <div className="divide-y divide-slate-100">
            <div className="py-2 flex justify-between">
              <span className="text-slate-500 font-medium">Sede:</span>
              <span className="font-bold text-slate-900">{time.sede}</span>
            </div>
            <div className="py-2 flex justify-between">
              <span className="text-slate-500 font-medium">Chefe de Equipe:</span>
              <span className="font-bold text-slate-900">{time.chefeEquipe}</span>
            </div>
            <div className="py-2 flex justify-between">
              <span className="text-slate-500 font-medium">Unidade de Potência (Motor):</span>
              <span className="font-bold text-slate-900">{time.motor}</span>
            </div>
            <div className="py-2 flex justify-between">
              <span className="text-slate-500 font-medium">Fundação:</span>
              <span className="font-bold text-slate-900">{time.fundacao}</span>
            </div>
          </div>
        </div>
      </div>

      {/* GALERIA DE TÍTULOS E BIOGRAFIA */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-amber-50/70 border border-amber-200/80 p-4 rounded-xl text-center">
            <span className="text-2xl font-black text-amber-900 block">{time.titulosConstrutores ?? 0}</span>
            <span className="text-xs font-bold text-amber-800">Mundiais de Construtores</span>
          </div>
          <div className="bg-blue-50/70 border border-blue-200/80 p-4 rounded-xl text-center">
            <span className="text-2xl font-black text-blue-900 block">{time.titulosPilotos ?? 0}</span>
            <span className="text-xs font-bold text-blue-800">Mundiais de Pilotos</span>
          </div>
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-center">
            <span className="text-2xl font-black text-slate-900 block">{dadosTemporada?.points ?? 0}</span>
            <span className="text-xs font-bold text-slate-700">Pontos em 2026</span>
          </div>
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-center">
            <span className="text-2xl font-black text-slate-900 block">{dadosTemporada?.wins ?? 0}</span>
            <span className="text-xs font-bold text-slate-700">Vitórias em 2026</span>
          </div>
        </div>

        {time.biografia && (
          <div className="pt-4 border-t border-slate-100">
            <h4 className="text-base font-bold text-slate-900 mb-2">História e Legado</h4>
            <p className="text-slate-600 text-sm leading-relaxed">{time.biografia}</p>
          </div>
        )}
      </div>
    </div>
  );
}