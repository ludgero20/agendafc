// app/components/time/TimeHeader.tsx
import React from 'react';
import { TimeConfig } from '@/lib/times';

export default function TimeHeader({ time }: { time: TimeConfig }) {
  const emoji = time.esporte === 'f1' ? '🏎️' : time.esporte === 'nba' ? '🏀' : time.esporte === 'nfl' ? '🏈' : '⚽';
  const subtitulo = time.esporte === 'f1' 
    ? 'Ficha técnica oficial, pilotos e classificação no Mundial de Construtores.'
    : `Guia de transmissões na TV, classificação no ${time.competicaoNome} e calendário de partidas.`;

  const textoCompartilhar = `${emoji} *Guia de Jogos do ${time.nome} | Agenda FC*\nAcompanhe onde vão passar os jogos na TV, a tabela e os próximos confrontos!\n\n👉 Confira em: https://agendafc.com.br/time/${time.slug}`;
  const linkShareWhatsApp = `https://api.whatsapp.com/send?text=${encodeURIComponent(textoCompartilhar)}`;

  return (
    <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-200/90 flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
      <div className="flex flex-col sm:flex-row items-center gap-6">
        <div
          className={`w-24 h-24 flex-shrink-0 flex items-center justify-center p-3 rounded-2xl border shadow-xs ${
            time.corFundoLogo || 'bg-slate-50 border-slate-100'
          }`}
        >
          <img 
            src={time.escudo} 
            alt={time.nome} 
            className="max-h-20 max-w-20 object-contain drop-shadow-xs" 
            referrerPolicy="no-referrer"
          />
        </div>
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full mb-1">
            <span>{emoji}</span> {time.competicaoNome}
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900">{time.nome}</h1>
          <p className="text-slate-600 mt-1 max-w-2xl">{subtitulo}</p>
        </div>
      </div>

      <a
        href={linkShareWhatsApp}
        target="_blank"
        rel="noopener noreferrer"
        title={`Compartilhar página do ${time.nome} no WhatsApp`}
        className="flex-shrink-0 inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs sm:text-sm px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl transition-all shadow-sm hover:scale-105"
      >
        <svg className="w-4 h-4 sm:w-5 sm:h-5 fill-current flex-shrink-0" viewBox="0 0 24 24">
          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
        </svg>
        <span>Compartilhar</span>
      </a>
    </div>
  );
}