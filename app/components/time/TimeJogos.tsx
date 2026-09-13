// app/components/time/TimeJogos.tsx
import React from 'react';
import { TimeConfig, formatarNomeTime } from '@/lib/times';

export type JogoTemporada = {
  id: string | number;
  dateStr: string;
  status: string;
  roundLabel: string;
  homeTeam: { id?: number | string; name: string; shortName: string; crest?: string };
  awayTeam: { id?: number | string; name: string; shortName: string; crest?: string };
  homeScore: string | number | null;
  awayScore: string | number | null;
};

export default function TimeJogos({
  finalizados,
  proximos,
  time,
}: {
  finalizados: JogoTemporada[];
  proximos: JogoTemporada[];
  time: TimeConfig;
}) {
  return (
    <section className="grid md:grid-cols-2 gap-8">
      {/* ÚLTIMOS RESULTADOS */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          ⏮️ Últimos Resultados
        </h3>
        {finalizados.length > 0 ? (
          <div className="space-y-3">
            {finalizados.map((jogo) => (
              <div key={String(jogo.id)} className="bg-slate-50/70 hover:bg-slate-100/80 transition-all p-3.5 sm:p-4 rounded-xl border border-slate-200/70 flex flex-col gap-2 shadow-2xs">
                <div className="flex justify-between items-center text-xs text-slate-500 font-semibold border-b border-slate-200/40 pb-1.5">
                  <span className="capitalize">{jogo.dateStr}</span>
                  <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60 text-[10px] font-bold uppercase tracking-wider">
                    Finalizado
                  </span>
                </div>

                <div className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-2 w-[40%] justify-end text-right">
                    <span className="text-xs sm:text-sm font-bold truncate text-slate-900">
                      {time.esporte !== 'futebol' ? jogo.homeTeam.shortName : formatarNomeTime(jogo.homeTeam.shortName, jogo.homeTeam.name)}
                    </span>
                    {jogo.homeTeam.crest && <img src={jogo.homeTeam.crest} alt={jogo.homeTeam.name} className="w-5 h-5 object-contain flex-shrink-0" />}
                  </div>

                  <div className="w-[20%] flex justify-center text-center px-1">
                    <div className="inline-flex items-center font-mono font-black text-sm text-slate-900 bg-white border border-slate-300/80 px-2.5 py-1 rounded-lg">
                      <span>{jogo.homeScore ?? 0}</span>
                      <span className="mx-1 text-slate-300 font-normal">:</span>
                      <span>{jogo.awayScore ?? 0}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-[40%] justify-start text-left">
                    {jogo.awayTeam.crest && <img src={jogo.awayTeam.crest} alt={jogo.awayTeam.name} className="w-5 h-5 object-contain flex-shrink-0" />}
                    <span className="text-xs sm:text-sm font-bold truncate text-slate-900">
                      {time.esporte !== 'futebol' ? jogo.awayTeam.shortName : formatarNomeTime(jogo.awayTeam.shortName, jogo.awayTeam.name)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500 bg-slate-50/70 p-5 rounded-xl border border-slate-200">Sem resultados anteriores registrados.</p>
        )}
      </div>

      {/* PRÓXIMAS RODADAS */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          ⏭️ Próximas Rodadas Agendadas
        </h3>
        {proximos.length > 0 ? (
          <div className="space-y-3">
            {proximos.map((jogo) => (
              <div key={String(jogo.id)} className="bg-slate-50/70 hover:bg-slate-100/80 transition-all p-3.5 sm:p-4 rounded-xl border border-slate-200/70 flex flex-col gap-2 shadow-2xs">
                <div className="flex justify-between items-center text-xs text-slate-500 font-semibold border-b border-slate-200/40 pb-1.5">
                  <span>{jogo.roundLabel} - {jogo.dateStr}</span>
                  <span className="text-slate-400 text-[11px] font-medium">Agendado</span>
                </div>

                <div className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-2 w-[40%] justify-end text-right">
                    <span className="text-xs sm:text-sm font-bold truncate text-slate-900">
                      {time.esporte !== 'futebol' ? jogo.homeTeam.shortName : formatarNomeTime(jogo.homeTeam.shortName, jogo.homeTeam.name)}
                    </span>
                    {jogo.homeTeam.crest && <img src={jogo.homeTeam.crest} alt={jogo.homeTeam.name} className="w-5 h-5 object-contain flex-shrink-0" />}
                  </div>

                  <div className="w-[20%] flex justify-center text-center px-1">
                    <span className="text-[11px] font-black uppercase text-slate-400 bg-white px-2 py-0.5 rounded border border-slate-200">vs</span>
                  </div>

                  <div className="flex items-center gap-2 w-[40%] justify-start text-left">
                    {jogo.awayTeam.crest && <img src={jogo.awayTeam.crest} alt={jogo.awayTeam.name} className="w-5 h-5 object-contain flex-shrink-0" />}
                    <span className="text-xs sm:text-sm font-bold truncate text-slate-900">
                      {time.esporte !== 'futebol' ? jogo.awayTeam.shortName : formatarNomeTime(jogo.awayTeam.shortName, jogo.awayTeam.name)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500 bg-slate-50/70 p-5 rounded-xl border border-slate-200">Aguardando definição dos próximos confrontos.</p>
        )}
      </div>
    </section>
  );
}