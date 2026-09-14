// app/components/nfl/NFLLideres.tsx
import React from 'react';
import { CategoriaLideresNFL } from '@/lib/services/nfl-service';

interface Props {
  categorias: CategoriaLideresNFL[];
}

export default function NFLLideres({ categorias }: Props) {
  if (!categorias || categorias.length === 0) return null;

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <span>⭐</span> Líderes em Estatísticas da NFL
        </h2>
        <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
          Temporada Regular
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {categorias.map((cat) => (
          <div key={cat.titulo} className="bg-white rounded-2xl shadow-xs border border-slate-200/90 overflow-hidden flex flex-col justify-between">
            {/* Cabeçalho da Categoria */}
            <div className="bg-slate-50/80 px-4 py-3 border-b border-slate-200/80 flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5 uppercase tracking-wider">
                <span>{cat.icone}</span> {cat.titulo}
              </h3>
              <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200/60">
                Top 5
              </span>
            </div>

            {/* Lista dos 5 Atletas */}
            <div className="divide-y divide-slate-100">
              {cat.atletas.map((atleta) => (
                <div key={`${cat.titulo}-${atleta.rank}-${atleta.nome}`} className="p-3 hover:bg-slate-50/60 transition-colors flex items-center justify-between gap-3">
                  {/* Posição e Foto */}
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="font-black text-xs text-slate-400 w-4 text-center">
                      {atleta.rank}º
                    </span>

                    <div className="w-11 h-11 rounded-full bg-slate-100 border border-slate-200 flex-shrink-0 overflow-hidden flex items-center justify-center">
                      <img
                        src={atleta.foto}
                        alt={atleta.nome}
                        className="w-full h-full object-cover object-top"
                        loading="lazy"
                        referrerPolicy="no-referrer"
                      />
                    </div>

                    {/* Nome, Time e Posição */}
                    <div className="min-w-0">
                      <h4 className="font-bold text-sm text-slate-900 truncate leading-tight">
                        {atleta.nome}
                      </h4>
                      <p className="text-[11px] font-semibold text-slate-500 mt-0.5">
                        {atleta.time} • <span className="text-slate-400">{atleta.posicao}</span>
                      </p>
                    </div>
                  </div>

                  {/* Números: Jardas e Touchdowns */}
                  <div className="text-right flex-shrink-0">
                    <div className="font-black text-base text-blue-700 leading-tight">
                      {atleta.jardas} <span className="text-[10px] text-slate-400 font-bold uppercase">yds</span>
                    </div>
                    <div className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded inline-block mt-0.5 border border-emerald-200/60">
                      {atleta.touchdowns} TD
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}