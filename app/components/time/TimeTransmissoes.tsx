// app/components/time/TimeTransmissoes.tsx
import React from 'react';
import { JogoTransmissao } from '@/lib/services/tv-service';
import { TimeConfig } from '@/lib/times';

export default function TimeTransmissoes({ jogosTV, time }: { jogosTV: JogoTransmissao[]; time: TimeConfig }) {
  if (jogosTV.length === 0) return null;

  const formatarDiaCard = (dataStr: string) => {
    if (!dataStr) return '';
    const agora = new Date();
    const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' });
    const hoje = formatter.format(agora);
    const dataAmanha = new Date(agora);
    dataAmanha.setDate(dataAmanha.getDate() + 1);
    const amanha = formatter.format(dataAmanha);

    if (dataStr === hoje) return 'Hoje';
    if (dataStr === amanha) return 'Amanhã';

    const [ano, mes, dia] = dataStr.split('-').map(Number);
    const dataObj = new Date(ano, mes - 1, dia, 12);
    return dataObj.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' });
  };

  const gerarLinkWhatsAppCard = (jogo: JogoTransmissao) => {
    const emoji = time.esporte === 'nba' ? '🏀' : time.esporte === 'nfl' ? '🏈' : '⚽';
    const titulo = `${emoji} ${jogo.time1} x ${jogo.time2}`;
    const campeonato = jogo.divisao ? `${jogo.campeonato} ${jogo.divisao}` : jogo.campeonato;
    const diaFormatado = formatarDiaCard(jogo.data);

    const mensagem = `${titulo}\n🏆 ${campeonato}\n📅 ${diaFormatado} às ${jogo.hora}\n📺 ${jogo.canal}\n\nConfira a agenda completa em: https://agendafc.com.br/time/${time.slug}`;
    return `https://api.whatsapp.com/send?text=${encodeURIComponent(mensagem)}`;
  };

  const gerarLinkGoogleAgenda = (jogo: JogoTransmissao) => {
    const titulo = `${jogo.time1} x ${jogo.time2}`;
    const campeonato = jogo.divisao ? `${jogo.campeonato} ${jogo.divisao}` : jogo.campeonato;

    const [hStr, mStr] = (jogo.hora || '12h00').replace('h', ':').split(':');
    const horaNum = parseInt(hStr || '12', 10);
    const minNum = parseInt(mStr || '0', 10);

    const [ano, mes, dia] = (jogo.data || '2026-01-01').split('-').map(Number);
    const dataInicio = new Date(Date.UTC(ano, mes - 1, dia, horaNum + 3, minNum));
    const duracaoHoras = time.esporte === 'nba' ? 2.5 : time.esporte === 'nfl' ? 3 : 2;
    const dataFim = new Date(dataInicio.getTime() + duracaoHoras * 60 * 60 * 1000);

    const formatUTC = (d: Date) => d.toISOString().replace(/-|:|\.\d+/g, '');
    const startIso = formatUTC(dataInicio);
    const endIso = formatUTC(dataFim);

    const detalhes = `🏆 Campeonato: ${campeonato}\n📺 Transmissão: ${jogo.canal}\n\nAgenda completa em: https://agendafc.com.br/time/${time.slug}`;
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(titulo)}&dates=${startIso}/${endIso}&details=${encodeURIComponent(detalhes)}`;
  };

  return (
    <section>
      <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
        📺 Próximos Jogos com Transmissão na TV
      </h2>
      <div className="grid gap-4 md:grid-cols-2">
        {jogosTV.map((jogo) => (
          <div key={jogo.id} className="bg-white rounded-2xl p-5 shadow-xs hover:shadow-md transition-all border border-slate-200/90 flex flex-col justify-between gap-3">
            <div className="flex justify-between items-center text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg border border-blue-200/60">
                  {jogo.campeonato}
                </span>
                <span className="font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                  📅 {formatarDiaCard(jogo.data)}
                </span>
              </div>
              <span className="font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/60">
                🕒 {jogo.hora}
              </span>
            </div>

            <div className="py-2.5 flex items-center justify-between text-slate-900 font-bold text-base sm:text-lg">
              <span className="w-[42%] text-right truncate">{jogo.time1}</span>
              <span className="w-[16%] text-center text-xs font-extrabold uppercase text-slate-400 bg-slate-100 py-0.5 px-1.5 rounded border border-slate-200/80">vs</span>
              <span className="w-[42%] text-left truncate">{jogo.time2}</span>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2.5 mt-auto">
              <div className="text-xs font-semibold text-slate-600 flex items-start gap-1.5 flex-1 min-w-0 pr-1">
                <span className="flex-shrink-0 mt-0.5">📺</span>
                <span className="line-clamp-2 leading-snug">{jogo.canal}</span>
              </div>

              {/* BOTÕES COM ÍCONES SVG CORRETOS E VISÍVEIS */}
              <div className="flex items-center gap-1.5 flex-shrink-0 self-center">
                <a
                  href={gerarLinkGoogleAgenda(jogo)}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Adicionar ao Google Agenda"
                  className="inline-flex items-center gap-1.5 text-xs font-bold bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 px-2.5 py-1.5 rounded-lg transition-all shadow-2xs hover:scale-105"
                >
                  <svg className="w-3.5 h-3.5 fill-current text-blue-600 flex-shrink-0" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.75 2a.75.75 0 01.75.75V4h7V2.75a.75.75 0 011.5 0V4h.25A2.75 2.75 0 0118 6.75v8.5A2.75 2.75 0 0115.25 18H4.75A2.75 2.75 0 012 15.25v-8.5A2.75 2.75 0 014.75 4H5V2.75A.75.75 0 015.75 2zm-1 5.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h10.5c.69 0 1.25-.56 1.25-1.25v-6.5c0-.69-.56-1.25-1.25-1.25H4.75z" clipRule="evenodd" />
                  </svg>
                  <span className="hidden sm:inline">Agenda</span>
                </a>

                <a
                  href={gerarLinkWhatsAppCard(jogo)}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Compartilhar no WhatsApp"
                  className="inline-flex items-center gap-1.5 text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-white px-2.5 py-1.5 rounded-lg transition-all shadow-2xs hover:scale-105"
                >
                  <svg className="w-3.5 h-3.5 fill-current flex-shrink-0" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                  </svg>
                  <span className="hidden sm:inline">Zap</span>
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}