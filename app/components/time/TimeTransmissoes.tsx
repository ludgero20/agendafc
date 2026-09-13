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

              <div className="flex items-center gap-1.5 flex-shrink-0 self-center">
                <a
                  href={gerarLinkGoogleAgenda(jogo)}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Adicionar ao Google Agenda"
                  className="inline-flex items-center gap-1 text-xs font-bold bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 px-2.5 py-1.5 rounded-lg transition-all shadow-2xs hover:scale-105"
                >
                  <span className="hidden sm:inline">Agenda</span>
                </a>

                <a
                  href={gerarLinkWhatsAppCard(jogo)}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Compartilhar no WhatsApp"
                  className="inline-flex items-center gap-1 text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-white px-2.5 py-1.5 rounded-lg transition-all shadow-2xs hover:scale-105"
                >
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