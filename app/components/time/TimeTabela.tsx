// app/components/time/TimeTabela.tsx
import React from 'react';
import { TimeConfig, formatarNomeTime } from '@/lib/times';

export type TimeLinhaTabela = {
  position: string | number;
  team: { id?: number | string; name: string; shortName: string; crest: string };
  playedGames?: number;
  won: number | string;
  draw?: number | string;
  lost: number | string;
  points?: number;
  pct?: string;
  goalDifference?: number;
};

export default function TimeTabela({
  tabela,
  time,
  nomeDivisao,
}: {
  tabela: TimeLinhaTabela[];
  time: TimeConfig;
  nomeDivisao: string;
}) {
  if (tabela.length === 0) return null;

  return (
    <section>
      <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
        🏆 Classificação - {nomeDivisao}
      </h2>
      <div className="overflow-x-auto bg-white rounded-2xl shadow-xs border border-slate-200/90">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200/80">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">#</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">
                {time.esporte === 'futebol' ? 'Time' : 'Franquia'}
              </th>
              {time.esporte === 'nba' ? (
                <>
                  <th className="px-3 py-3 text-center font-semibold text-slate-600">V</th>
                  <th className="px-3 py-3 text-center font-semibold text-slate-600">D</th>
                  <th className="px-3 py-3 text-center font-semibold text-slate-600">%</th>
                </>
              ) : time.esporte === 'nfl' ? (
                <>
                  <th className="px-3 py-3 text-center font-semibold text-slate-600">V</th>
                  <th className="px-3 py-3 text-center font-semibold text-slate-600">D</th>
                  <th className="px-3 py-3 text-center font-semibold text-slate-600">E</th>
                  <th className="px-3 py-3 text-center font-semibold text-slate-600">%</th>
                </>
              ) : (
                <>
                  <th className="px-3 py-3 text-center font-semibold text-slate-600">P</th>
                  <th className="px-3 py-3 text-center font-semibold text-slate-600">J</th>
                  <th className="px-3 py-3 text-center font-semibold text-slate-600">V</th>
                  <th className="px-3 py-3 text-center font-semibold text-slate-600">E</th>
                  <th className="px-3 py-3 text-center font-semibold text-slate-600">D</th>
                  <th className="px-3 py-3 text-center font-semibold text-slate-600">SG</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {tabela.map((t) => {
              const ehOTime =
                time.esporte !== 'futebol'
                  ? t.team.name.toLowerCase().includes(time.nome.toLowerCase()) ||
                    time.variacoesNome.some((v) => t.team.name.toLowerCase().includes(v.toLowerCase()))
                  : t.team.id === time.idAPI;

              return (
                <tr
                  key={String(t.team.name)}
                  className={`border-t transition-colors ${
                    ehOTime ? `${time.corPrimaria} font-bold border-l-4` : 'hover:bg-slate-50/60'
                  }`}
                >
                  <td className="px-4 py-3 text-slate-700">{t.position}</td>
                  <td className="px-4 py-3 flex items-center gap-2">
                    {t.team.crest && (
                      <img src={t.team.crest} alt={t.team.name} className="w-5 h-5 object-contain" />
                    )}
                    <span className="text-slate-900 truncate">
                      {time.esporte !== 'futebol' ? t.team.name : formatarNomeTime(t.team.shortName, t.team.name)}
                    </span>
                  </td>
                  {time.esporte === 'nba' ? (
                    <>
                      <td className="px-3 py-3 text-center font-bold text-slate-900">{t.won}</td>
                      <td className="px-3 py-3 text-center text-slate-700">{t.lost}</td>
                      <td className="px-3 py-3 text-center font-extrabold text-blue-600">{t.pct}</td>
                    </>
                  ) : time.esporte === 'nfl' ? (
                    <>
                      <td className="px-3 py-3 text-center font-bold text-slate-900">{t.won}</td>
                      <td className="px-3 py-3 text-center text-slate-700">{t.lost}</td>
                      <td className="px-3 py-3 text-center text-slate-700">{t.draw}</td>
                      <td className="px-3 py-3 text-center font-extrabold text-blue-600">{t.pct}</td>
                    </>
                  ) : (
                    <>
                      <td className="px-3 py-3 text-center font-extrabold text-blue-600">{t.points}</td>
                      <td className="px-3 py-3 text-center text-slate-700">{t.playedGames}</td>
                      <td className="px-3 py-3 text-center text-slate-700">{t.won}</td>
                      <td className="px-3 py-3 text-center text-slate-700">{t.draw}</td>
                      <td className="px-3 py-3 text-center text-slate-700">{t.lost}</td>
                      <td className="px-3 py-3 text-center font-medium text-slate-700">{t.goalDifference}</td>
                    </>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}