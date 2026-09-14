// app/components/ArtilhariaTable.tsx
import React from 'react';
import { ArtilheiroFutebol } from '@/lib/services/futebol-service';

interface Props {
  artilheiros: ArtilheiroFutebol[];
}

export default function ArtilhariaTable({ artilheiros }: Props) {
  if (!artilheiros || artilheiros.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <span>⚽</span> Top 10 Artilheiros
        </h2>
        <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
          Temporada Atual
        </span>
      </div>

      <div className="overflow-x-auto bg-white rounded-2xl shadow-sm border border-gray-200">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200 text-slate-600">
            <tr>
              <th className="px-3 py-3 text-left font-semibold w-10 text-center">#</th>
              <th className="px-3 py-3 text-left font-semibold">Jogador</th>
              <th className="px-3 py-3 text-left font-semibold">Clube</th>
              <th className="px-3 py-3 text-center font-semibold w-16">Gols</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {artilheiros.map((artilheiro) => (
              <tr key={`${artilheiro.posicao}-${artilheiro.jogadorNome}`} className="hover:bg-gray-50/70 transition-colors">
                <td className="px-3 py-2.5 text-center font-bold text-gray-600 text-xs">
                  {artilheiro.posicao}º
                </td>
                <td className="px-3 py-2.5 font-bold text-slate-900 truncate">
                  {artilheiro.jogadorNome}
                </td>
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    {artilheiro.timeEscudo && (
                      <img
                        src={artilheiro.timeEscudo}
                        alt={artilheiro.timeNome}
                        className="w-5 h-5 object-contain flex-shrink-0"
                        loading="lazy"
                      />
                    )}
                    <span className="text-slate-700 text-xs sm:text-sm font-medium truncate max-w-[140px] sm:max-w-[200px]">
                      {artilheiro.timeNome}
                    </span>
                  </div>
                </td>
                <td className="px-3 py-2.5 text-center font-extrabold text-blue-600 bg-blue-50/40 text-sm sm:text-base">
                  {artilheiro.gols}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}