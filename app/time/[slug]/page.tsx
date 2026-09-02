import type { Metadata } from 'next';
import fs from 'fs/promises';
import path from 'path';
import { notFound } from 'next/navigation';
import { timesConfig, TimeConfig } from '@/lib/times';
import { formatarNomeTime } from '@/lib/campeonatos';

export const revalidate = 3600;

// Tipos
type JogoTransmissao = {
  id: number;
  data: string;
  hora: string;
  campeonato: string;
  time1: string | null;
  time2: string | null;
  canal: string;
  divisao?: string;
  fase?: string;
};

type TimeTabela = {
  position: string | number;
  team: { id?: number; name: string; shortName: string; crest: string; };
  playedGames?: number;
  won: number | string;
  draw?: number | string;
  lost: number | string;
  points?: number;
  pct?: string;
  goalDifference?: number;
};

type JogoTemporada = {
  id: string | number;
  dateStr: string;
  status: string;
  roundLabel: string;
  homeTeam: { name: string; shortName: string; crest: string; };
  awayTeam: { name: string; shortName: string; crest: string; };
  homeScore: string | number | null;
  awayScore: string | number | null;
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const time = timesConfig[slug];
  if (!time) return { title: "Time não encontrado | Agenda FC" };

  return {
    title: `Onde assistir aos jogos do ${time.nome} ao vivo | Tabela e Transmissão`,
    description: `Confira onde vai passar o próximo jogo do ${time.nome} na TV e streaming, horário, canais de transmissão, classificação no ${time.competicaoNome} e calendário completo.`,
  };
}

// 1. TRANSMISSÕES DE TV (Futebol e NFL)
async function getJogosTransmissao(time: TimeConfig): Promise<JogoTransmissao[]> {
  try {
    const jogosPath = path.join(process.cwd(), "public/jogos.json");
    const manuaisPath = path.join(process.cwd(), "public/jogos_manuais.json");

    const [jogosFile, manuaisFile] = await Promise.all([
      fs.readFile(jogosPath, "utf-8").catch(() => '{"jogosSemana": []}'),
      fs.readFile(manuaisPath, "utf-8").catch(() => '{"jogosSemana": []}')
    ]);

    const jogosIA = JSON.parse(jogosFile).jogosSemana || [];
    const jogosManuais = JSON.parse(manuaisFile).jogosSemana || [];

    const todos = [...jogosIA, ...jogosManuais];

    return todos.filter((jogo: JogoTransmissao) => {
      const time1 = (jogo.time1 || '').toLowerCase();
      const time2 = (jogo.time2 || '').toLowerCase();
      return time.variacoesNome.some(v => time1.includes(v.toLowerCase()) || time2.includes(v.toLowerCase()));
    });
  } catch {
    return [];
  }
}

// 2. BUSCA DADOS DA NFL (ESPN)
async function getDadosNFL(time: TimeConfig) {
  let tabela: TimeTabela[] = [];
  let finalizados: JogoTemporada[] = [];
  let proximos: JogoTemporada[] = [];

  try {
    // A. Busca Standings
    const resStandings = await fetch("https://site.api.espn.com/apis/v2/sports/football/nfl/standings", { next: { revalidate: 3600 } });
    if (resStandings.ok) {
      const dataStandings = await resStandings.json();
      const conferencias = dataStandings?.children || [];
      
      conferencias.forEach((conf: any) => {
        const divisoes = conf.children || [];
        divisoes.forEach((div: any) => {
          const divNome = div.name || div.shortName || '';
          if (time.divisaoNFL && divNome.toLowerCase().includes(time.divisaoNFL.toLowerCase())) {
            const entries = div?.standings?.entries || [];
            tabela = entries.map((entry: any, idx: number) => {
              const stats = entry.stats || [];
              const getStat = (n: string) => stats.find((s: any) => s.name === n)?.value ?? 0;
              const getStatDisplay = (n: string) => stats.find((s: any) => s.name === n)?.displayValue ?? '0.000';
              return {
                position: idx + 1,
                team: {
                  name: entry.team?.displayName || 'Time',
                  shortName: entry.team?.shortName || entry.team?.name || 'Time',
                  crest: entry.team?.logos?.[0]?.href || time.escudo
                },
                won: getStat('wins'),
                lost: getStat('losses'),
                draw: getStat('ties'),
                pct: getStatDisplay('winPercent')
              };
            });
          }
        });
      });
    }

    // B. Busca Jogos e Placares
    const resGames = await fetch("https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?limit=1000", { next: { revalidate: 3600 } });
    if (resGames.ok) {
      const dataGames = await resGames.json();
      const eventos = dataGames?.events || [];
      const dateFormatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' });

      const jogosDoTime = eventos.filter((ev: any) => {
        const comp = ev.competitions?.[0];
        const home = comp?.competitors?.find((c: any) => c.homeAway === 'home')?.team?.displayName || '';
        const away = comp?.competitors?.find((c: any) => c.homeAway === 'away')?.team?.displayName || '';
        return time.variacoesNome.some(v => home.toLowerCase().includes(v.toLowerCase()) || away.toLowerCase().includes(v.toLowerCase()));
      });

      const formatados: JogoTemporada[] = jogosDoTime.map((ev: any) => {
        const comp = ev.competitions?.[0];
        const home = comp?.competitors?.find((c: any) => c.homeAway === 'home');
        const away = comp?.competitors?.find((c: any) => c.homeAway === 'away');
        const dataObj = ev.date ? new Date(ev.date) : new Date();
        const finalizado = ev.status?.type?.completed;

        return {
          id: String(ev.id),
          dateStr: `${dateFormatter.format(dataObj)} às ${dataObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' })}`,
          status: finalizado ? 'FINISHED' : 'SCHEDULED',
          roundLabel: `Semana ${ev.week?.number || '1'}`,
          homeTeam: {
            name: home?.team?.displayName || 'Casa',
            shortName: home?.team?.shortName || home?.team?.name || 'Casa',
            crest: home?.team?.logos?.[0]?.href || 'https://a.espncdn.com/i/teamlogos/nfl/500/nfl.png'
          },
          awayTeam: {
            name: away?.team?.displayName || 'Visitante',
            shortName: away?.team?.shortName || away?.team?.name || 'Visitante',
            crest: away?.team?.logos?.[0]?.href || 'https://a.espncdn.com/i/teamlogos/nfl/500/nfl.png'
          },
          homeScore: finalizado ? String(home?.score || '0') : null,
          awayScore: finalizado ? String(away?.score || '0') : null
        };
      });

      finalizados = formatados.filter(j => j.status === 'FINISHED').slice(-3);
      proximos = formatados.filter(j => j.status !== 'FINISHED').slice(0, 5);
    }
  } catch (error) {
    console.error("Erro ao carregar dados NFL:", error);
  }

  return { tabela, finalizados, proximos };
}

// 3. BUSCA DADOS DE FUTEBOL
async function getDadosFutebol(time: TimeConfig) {
  try {
    const standingsPath = path.join(process.cwd(), "public/api-cache", time.arquivoStandings || '');
    const matchesPath = path.join(process.cwd(), "public/api-cache", time.arquivoMatches || '');

    const [standingsFile, matchesFile] = await Promise.all([
      fs.readFile(standingsPath, "utf-8").catch(() => null),
      fs.readFile(matchesPath, "utf-8").catch(() => null)
    ]);

    const tabelaRaw: any[] = standingsFile ? JSON.parse(standingsFile)?.standings?.[0]?.table || [] : [];
    const todosJogosRaw: any[] = matchesFile ? JSON.parse(matchesFile)?.matches || [] : [];

    const tabela: TimeTabela[] = tabelaRaw.map(t => ({
      position: t.position,
      team: { id: t.team.id, name: t.team.name, shortName: t.team.shortName, crest: t.team.crest },
      playedGames: t.playedGames,
      won: t.won,
      draw: t.draw,
      lost: t.lost,
      points: t.points,
      goalDifference: t.goalDifference
    }));

    const jogosDoTime = todosJogosRaw.filter(m => m.homeTeam?.id === time.idAPI || m.awayTeam?.id === time.idAPI);
    const formatarDataBR = (dataISO: string) => new Date(dataISO).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' }).replace(',', ' às');

    const formatados: JogoTemporada[] = jogosDoTime.map(m => ({
      id: m.id,
      dateStr: formatarDataBR(m.utcDate),
      status: m.status,
      roundLabel: `Rodada ${m.matchday}`,
      homeTeam: { id: m.homeTeam.id, name: m.homeTeam.name, shortName: m.homeTeam.shortName, crest: m.homeTeam.crest },
      awayTeam: { id: m.awayTeam.id, name: m.awayTeam.name, shortName: m.awayTeam.shortName, crest: m.awayTeam.crest },
      homeScore: m.score?.fullTime?.home ?? null,
      awayScore: m.score?.fullTime?.away ?? null
    }));

    const finalizados = formatados.filter(m => m.status === 'FINISHED').sort((a, b) => new Date(b.dateStr).getTime() - new Date(a.dateStr).getTime()).slice(0, 3);
    const proximos = formatados.filter(m => m.status !== 'FINISHED').slice(0, 5);

    return { tabela, finalizados, proximos };
  } catch {
    return { tabela: [], finalizados: [], proximos: [] };
  }
}

export default async function TimePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const time = timesConfig[slug];

  if (!time) notFound();

  const [jogosTV, { tabela, finalizados, proximos }] = await Promise.all([
    getJogosTransmissao(time),
    time.esporte === 'nfl' ? getDadosNFL(time) : getDadosFutebol(time)
  ]);

  const formatarDiaParaWhatsApp = (dataStr: string) => {
    const agora = new Date();
    const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' });
    const hoje = formatter.format(agora);

    const dataAmanha = new Date(agora);
    dataAmanha.setDate(dataAmanha.getDate() + 1);
    const amanha = formatter.format(dataAmanha);

    if (dataStr === hoje) return "Hoje";
    if (dataStr === amanha) return "Amanhã";

    const [ano, mes, dia] = dataStr.split('-').map(Number);
    const dataObj = new Date(ano, mes - 1, dia, 12);
    const diaSemana = dataObj.toLocaleDateString('pt-BR', { weekday: 'long' });
    const diaMes = dataObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    const diaSemanaCap = diaSemana.charAt(0).toUpperCase() + diaSemana.slice(1);

    return `${diaSemanaCap} (${diaMes})`;
  };

  const gerarLinkWhatsAppCard = (jogo: JogoTransmissao) => {
    const titulo = `⚽ ${jogo.time1} x ${jogo.time2}`;
    const campeonato = jogo.divisao ? `${jogo.campeonato} ${jogo.divisao}` : jogo.campeonato;
    const diaFormatado = formatarDiaParaWhatsApp(jogo.data);

    const mensagem = `${titulo}
🏆 ${campeonato}
📅 ${diaFormatado} às ${jogo.hora}
📺 ${jogo.canal}

Confira a agenda completa em: https://agendafc.com.br/time/${time.slug}`;

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
    const dataFim = new Date(dataInicio.getTime() + (time.esporte === 'nfl' ? 3 : 2) * 60 * 60 * 1000);

    const formatUTC = (d: Date) => d.toISOString().replace(/-|:|\.\d+/g, '');
    const startIso = formatUTC(dataInicio);
    const endIso = formatUTC(dataFim);

    const detalhes = `🏆 Campeonato: ${campeonato}\n📺 Transmissão: ${jogo.canal}\n\nAgenda completa em: https://agendafc.com.br/time/${time.slug}`;
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(titulo)}&dates=${startIso}/${endIso}&details=${encodeURIComponent(detalhes)}`;
  };

  const textoCompartilharPagina = `🏈 *Guia de Jogos do ${time.nome} | Agenda FC*\nAcompanhe onde vão passar os jogos na TV, a tabela e os próximos confrontos!\n\n👉 Confira em: https://agendafc.com.br/time/${time.slug}`;
  const linkShareWhatsAppHeader = `https://api.whatsapp.com/send?text=${encodeURIComponent(textoCompartilharPagina)}`;

  return (
    <div className="space-y-12 max-w-6xl mx-auto px-4 py-6">
      
      {/* CABEÇALHO DO CLUBE */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-200/90 flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="w-24 h-24 flex-shrink-0 flex items-center justify-center">
            <img src={time.escudo} alt={time.nome} className="w-24 h-24 object-contain" />
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900">Onde assistir aos jogos do {time.nome}</h1>
            <p className="text-slate-600 mt-1">Guia de transmissões na TV, tabela do {time.competicaoNome} e calendário completo de partidas.</p>
          </div>
        </div>

        {/* BOTÃO COMPARTILHAR PÁGINA */}
        <a
          href={linkShareWhatsAppHeader}
          target="_blank"
          rel="noopener noreferrer"
          title={`Compartilhar página do ${time.nome} no WhatsApp`}
          className="flex-shrink-0 inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm px-5 py-3 rounded-xl transition-all shadow-sm hover:shadow-md hover:scale-105"
        >
          <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
          </svg>
          <span>Compartilhar página</span>
        </a>
      </div>

      {/* BLOCO 1: TRANSMISSÕES CONFIRMADAS NA TV */}
      <section>
        <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
          📺 Próximos Jogos com Transmissão na TV
        </h2>
        {jogosTV.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {jogosTV.map((jogo) => (
              <div key={jogo.id} className="bg-white rounded-2xl p-5 shadow-xs hover:shadow-md transition-all border border-slate-200/90 flex flex-col justify-between gap-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg border border-blue-200/60">{jogo.campeonato}</span>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/60">🕒 {jogo.hora}</span>
                </div>
                
                <div className="py-2 flex items-center justify-between text-slate-900 font-bold text-base sm:text-lg">
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
                      <svg className="w-3.5 h-3.5 fill-current text-blue-600" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.75 2a.75.75 0 01.75.75V4h7V2.75a.75.75 0 011.5 0V4h.25A2.75 2.75 0 0118 6.75v8.5A2.75 2.75 0 0115.25 18H4.75A2.75 2.75 0 012 15.25v-8.5A2.75 2.75 0 014.75 4H5V2.75A.75.75 0 015.75 2zm-1 5.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h10.5c.69 0 1.25-.56 1.25-1.25v-6.5c0-.69-.56-1.25-1.25-1.25H4.75z" clipRule="evenodd" />
                      </svg>
                      <span className="hidden sm:inline">Agenda</span>
                    </a>

                    <a
                      href={gerarLinkWhatsAppCard(jogo)}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Compartilhar no WhatsApp"
                      className="inline-flex items-center gap-1 text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-white px-2.5 py-1.5 rounded-lg transition-all shadow-2xs hover:scale-105"
                    >
                      <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                      </svg>
                      <span className="hidden sm:inline">Zap</span>
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-slate-50/70 rounded-2xl p-8 text-center border border-slate-200/80">
            <p className="text-slate-600 font-medium">Nenhuma transmissão confirmada para os próximos 3 dias. A grade de TV é atualizada diariamente.</p>
          </div>
        )}
      </section>

      {/* BLOCO 2: CLASSIFICAÇÃO COM O TIME EM DESTAQUE */}
      {tabela.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
            🏆 {time.esporte === 'nfl' ? `Classificação - ${time.divisaoNFL}` : `${time.competicaoNome} - Classificação`}
          </h2>
          <div className="overflow-x-auto bg-white rounded-2xl shadow-xs border border-slate-200/90">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200/80">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">#</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">Time</th>
                  {time.esporte === 'nfl' ? (
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
                  const ehOTime = time.esporte === 'nfl' 
                    ? t.team.name.toLowerCase().includes(time.nome.toLowerCase()) || time.variacoesNome.some(v => t.team.name.toLowerCase().includes(v.toLowerCase()))
                    : t.team.id === time.idAPI;

                  return (
                    <tr key={String(t.team.name)} className={`border-t transition-colors ${ehOTime ? `${time.corPrimaria} font-bold border-l-4` : 'hover:bg-slate-50/60'}`}>
                      <td className="px-4 py-3 text-slate-700">{t.position}</td>
                      <td className="px-4 py-3 flex items-center gap-2">
                        <img src={t.team.crest} alt={t.team.name} className="w-5 h-5 object-contain" />
                        <span className="text-slate-900">{time.esporte === 'nfl' ? t.team.name : formatarNomeTime(t.team.shortName, t.team.name)}</span>
                      </td>
                      {time.esporte === 'nfl' ? (
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
      )}

      {/* BLOCO 3: HISTÓRICO E PRÓXIMOS CONFRONTOS */}
      <section className="grid md:grid-cols-2 gap-8">
        {/* Últimos Resultados */}
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
                      <span className="text-xs sm:text-sm font-bold truncate">{time.esporte === 'nfl' ? jogo.homeTeam.shortName : formatarNomeTime(jogo.homeTeam.shortName, jogo.homeTeam.name)}</span>
                      <img src={jogo.homeTeam.crest} alt={jogo.homeTeam.name} className="w-5 h-5 sm:w-6 sm:h-6 object-contain flex-shrink-0" />
                    </div>

                    <div className="w-[20%] flex justify-center text-center px-1">
                      <div className="inline-flex items-center justify-center font-mono font-black text-sm text-slate-900 bg-white border border-slate-300/80 px-2.5 py-1 rounded-lg tracking-wider shadow-2xs">
                        <span>{jogo.homeScore ?? 0}</span>
                        <span className="mx-1 text-slate-300 font-normal">:</span>
                        <span>{jogo.awayScore ?? 0}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-[40%] justify-start text-left">
                      <img src={jogo.awayTeam.crest} alt={jogo.awayTeam.name} className="w-5 h-5 sm:w-6 sm:h-6 object-contain flex-shrink-0" />
                      <span className="text-xs sm:text-sm font-bold truncate">{time.esporte === 'nfl' ? jogo.awayTeam.shortName : formatarNomeTime(jogo.awayTeam.shortName, jogo.awayTeam.name)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500 bg-slate-50/70 p-5 rounded-xl border border-slate-200">Sem resultados anteriores registrados.</p>
          )}
        </div>

        {/* Próximas Semanas / Rodadas */}
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            ⏭️ Próximos Jogos Agendados
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
                      <span className="text-xs sm:text-sm font-bold truncate">{time.esporte === 'nfl' ? jogo.homeTeam.shortName : formatarNomeTime(jogo.homeTeam.shortName, jogo.homeTeam.name)}</span>
                      <img src={jogo.homeTeam.crest} alt={jogo.homeTeam.name} className="w-5 h-5 sm:w-6 sm:h-6 object-contain flex-shrink-0" />
                    </div>

                    <div className="w-[20%] flex justify-center text-center px-1">
                      <span className="text-[11px] font-black uppercase text-slate-400 bg-white px-2 py-0.5 rounded border border-slate-200/80 shadow-2xs">
                        vs
                      </span>
                    </div>

                    <div className="flex items-center gap-2 w-[40%] justify-start text-left">
                      <img src={jogo.awayTeam.crest} alt={jogo.awayTeam.name} className="w-5 h-5 sm:w-6 sm:h-6 object-contain flex-shrink-0" />
                      <span className="text-xs sm:text-sm font-bold truncate">{time.esporte === 'nfl' ? jogo.awayTeam.shortName : formatarNomeTime(jogo.awayTeam.shortName, jogo.awayTeam.name)}</span>
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

    </div>
  );
}