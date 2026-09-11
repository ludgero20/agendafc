// app/campeonatos/nba/page.tsx
import type { Metadata } from 'next';
import { formatarNomeTime } from '@/lib/times';

export const metadata: Metadata = {
  title: "Tabela e Jogos da NBA | Classificação das Conferências | Agenda FC",
  description: "Tabela de classificação completa das Conferências Leste e Oeste, jogos ao vivo e calendário da NBA.",
};

export const revalidate = 1800; // Atualiza a cada 30 minutos

type TimeNBA = {
  teamName: string;
  shortName: string;
  teamLogo: string;
  rank: string;
  conference: 'Leste' | 'Oeste';
  wins: number;
  losses: number;
  pct: string;
  streak: string;
};

type JogoNBA = {
  id: string;
  dataStr: string; // YYYY-MM-DD
  dataBR: string; // DD/MM
  hora: string;
  status: 'AGENDADO' | 'AO_VIVO' | 'ENCERRADO';
  tempoJogo: string;
  homeTeam: { name: string; shortName: string; logo: string; score: string | null };
  awayTeam: { name: string; shortName: string; logo: string; score: string | null };
};

const ESPN_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  Accept: 'application/json',
  Referer: 'https://www.espn.com/',
};

// 1. CLASSIFICAÇÃO DAS CONFERÊNCIAS LESTE E OESTE
async function getTabelaNBA(): Promise<TimeNBA[]> {
  const urls = [
    'https://site.web.api.espn.com/apis/v2/sports/basketball/nba/standings?region=us&lang=en',
    'https://site.api.espn.com/apis/v2/sports/basketball/nba/standings?region=us&lang=en'
  ];

  for (const url of urls) {
    try {
      const res = await fetch(url, {
        headers: ESPN_HEADERS,
        next: { revalidate: 1800 }
      });

      if (!res.ok) continue;
      const data = await res.json();
      const todosTimes: TimeNBA[] = [];

      const extrair = (item: any) => {
        if (item.name && item.standings?.entries) {
          const ehLeste = item.name.toLowerCase().includes('eastern');
          const conferencia: 'Leste' | 'Oeste' = ehLeste ? 'Leste' : 'Oeste';

          item.standings.entries.forEach((e: any, idx: number) => {
            const nomeTime = e.team?.displayName || e.team?.name || 'Franquia';
            const shortName = e.team?.shortDisplayName || e.team?.abbreviation || nomeTime;
            const logo = e.team?.logos?.[0]?.href || `https://a.espncdn.com/i/teamlogos/nba/500/${e.team?.abbreviation?.toLowerCase() || 'nba'}.png`;

            const v = e.stats?.find((s: any) => s.name === 'wins')?.value ?? 0;
            const d = e.stats?.find((s: any) => s.name === 'losses')?.value ?? 0;
            const pct = e.stats?.find((s: any) => s.name === 'winPercent')?.displayValue ?? '.000';
            const streak = e.stats?.find((s: any) => s.name === 'streak')?.displayValue ?? '-';

            todosTimes.push({
              teamName: nomeTime,
              shortName,
              teamLogo: logo,
              rank: String(idx + 1),
              conference: conferencia,
              wins: v,
              losses: d,
              pct: String(pct).startsWith('0') ? String(pct).substring(1) : String(pct),
              streak
            });
          });
        }

        if (item.children && Array.isArray(item.children)) {
          item.children.forEach(extrair);
        }
      };

      if (data.children && data.children.length > 0) {
        data.children.forEach(extrair);
      }

      if (todosTimes.length >= 30) {
        return todosTimes;
      }
    } catch {
      console.error('Tentando próxima URL de classificação NBA...');
    }
  }

  return [];
}

// 2. JOGOS DA NBA NA JANELA DE 5 DIAS (2 DIAS ANTES, HOJE, 2 DIAS DEPOIS)
async function getJogosJanelaNBA(): Promise<Record<string, JogoNBA[]>> {
  const hoje = new Date();
  const offsets = [-2, -1, 0, 1, 2];

  const datasFormatadas = offsets.map((offset) => {
    const d = new Date(hoje);
    d.setDate(hoje.getDate() + offset);
    const ano = d.getFullYear();
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const dia = String(d.getDate()).padStart(2, '0');
    return `${ano}${mes}${dia}`;
  });

  const todosJogos: JogoNBA[] = [];

  const respostas = await Promise.all(
    datasFormatadas.map(async (dataStr) => {
      try {
        const res = await fetch(
          `https://site.web.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard?dates=${dataStr}`,
          { headers: ESPN_HEADERS, cache: 'no-store' }
        );
        if (!res.ok) return [];
        const data = await res.json();
        return data.events || [];
      } catch {
        return [];
      }
    })
  );

  respostas.flat().forEach((ev: any) => {
    const comp = ev.competitions?.[0];
    const competitors = comp?.competitors || [];

    const home = competitors.find((c: any) => c.homeAway === 'home') || competitors[0];
    const away = competitors.find((c: any) => c.homeAway === 'away') || competitors[1];

    const dataIso = ev.date;
    const dataObj = new Date(dataIso);

    const dataFormatadaIso = dataObj.toLocaleDateString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).split('/').reverse().join('-'); // YYYY-MM-DD

    const dataBR = dataObj.toLocaleDateString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      day: '2-digit',
      month: '2-digit',
    });

    const horaFormatada = dataObj.toLocaleTimeString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      hour: '2-digit',
      minute: '2-digit',
    });

    const state = ev.status?.type?.state;
    let statusFormatado: 'AGENDADO' | 'AO_VIVO' | 'ENCERRADO' = 'AGENDADO';
    if (state === 'in') statusFormatado = 'AO_VIVO';
    if (state === 'post' || ev.status?.type?.completed) statusFormatado = 'ENCERRADO';

    const logoHome = home?.team?.logo || home?.team?.logos?.[0]?.href || `https://a.espncdn.com/i/teamlogos/nba/500/${home?.team?.abbreviation?.toLowerCase() || 'nba'}.png`;
    const logoAway = away?.team?.logo || away?.team?.logos?.[0]?.href || `https://a.espncdn.com/i/teamlogos/nba/500/${away?.team?.abbreviation?.toLowerCase() || 'nba'}.png`;

    todosJogos.push({
      id: ev.id,
      dataStr: dataFormatadaIso,
      dataBR,
      hora: horaFormatada,
      status: statusFormatado,
      tempoJogo: ev.status?.type?.shortDetail || '',
      homeTeam: {
        name: home?.team?.displayName || 'Casa',
        shortName: home?.team?.shortDisplayName || 'Casa',
        logo: logoHome,
        score: statusFormatado !== 'AGENDADO' ? String(home?.score || '0') : null,
      },
      awayTeam: {
        name: away?.team?.displayName || 'Visitante',
        shortName: away?.team?.shortDisplayName || 'Visitante',
        logo: logoAway,
        score: statusFormatado !== 'AGENDADO' ? String(away?.score || '0') : null,
      },
    });
  });

  // Agrupa os jogos por data
  const agrupadoPorData: Record<string, JogoNBA[]> = {};
  todosJogos.forEach((jogo) => {
    if (!agrupadoPorData[jogo.dataStr]) {
      agrupadoPorData[jogo.dataStr] = [];
    }
    agrupadoPorData[jogo.dataStr].push(jogo);
  });

  return agrupadoPorData;
}

export default async function NBAPage() {
  const [tabela, jogosPorData] = await Promise.all([
    getTabelaNBA(),
    getJogosJanelaNBA()
  ]);

  const timesLeste = tabela.filter(t => t.conference === 'Leste').sort((a, b) => parseFloat(b.pct) - parseFloat(a.pct));
  const timesOeste = tabela.filter(t => t.conference === 'Oeste').sort((a, b) => parseFloat(b.pct) - parseFloat(a.pct));

  const hojeStr = new Date().toISOString().split('T')[0];

  const formatarTituloData = (dataStr: string) => {
    const agora = new Date();
    const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' });
    const hoje = formatter.format(agora);

    const dataAmanha = new Date(agora);
    dataAmanha.setDate(dataAmanha.getDate() + 1);
    const amanha = formatter.format(dataAmanha);

    const dataOntem = new Date(agora);
    dataOntem.setDate(dataOntem.getDate() - 1);
    const ontem = formatter.format(dataOntem);

    if (dataStr === hoje) return "Hoje";
    if (dataStr === amanha) return "Amanhã";
    if (dataStr === ontem) return "Ontem";

    const [ano, mes, dia] = dataStr.split('-').map(Number);
    const dataObj = new Date(ano, mes - 1, dia, 12);
    return dataObj.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' });
  };

  const datasOrdenadas = Object.keys(jogosPorData).sort();

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 py-6">
      {/* CABEÇALHO */}
      <div className="text-center">
        <h1 className="text-4xl font-extrabold text-gray-900 flex items-center justify-center gap-3">
          <span>🏀</span> NBA - National Basketball Association
        </h1>
        <p className="text-xl text-gray-600 mt-2">Classificação Oficial das Conferências Leste e Oeste</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* TABELAS DAS CONFERÊNCIAS LESTE E OESTE */}
        <div className="lg:col-span-2 space-y-8">
          {/* CONFERÊNCIA LESTE */}
          <div className="space-y-3">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2 border-b border-slate-200 pb-2">
              <span>🏙️</span> Conferência Leste (Eastern Conference)
            </h2>
            <TabelaConferenciaNBA times={timesLeste} />
          </div>

          {/* CONFERÊNCIA OESTE */}
          <div className="space-y-3">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2 border-b border-slate-200 pb-2">
              <span>🌴</span> Conferência Oeste (Western Conference)
            </h2>
            <TabelaConferenciaNBA times={timesOeste} />
          </div>
        </div>

        {/* JOGOS DA SEMANA (JANELA DE 5 DIAS) */}
        <div className="lg:col-span-1 space-y-6">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            🏀 Jogos Recentes e Próximos
          </h2>

          {datasOrdenadas.length > 0 ? (
            <div className="space-y-6">
              {datasOrdenadas.map((dataStr) => {
                const listaJogos = jogosPorData[dataStr];
                const tituloDia = formatarTituloData(dataStr);
                const ehHoje = dataStr === hojeStr;

                return (
                  <div key={dataStr} className="space-y-2.5">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                      <span className={`text-xs font-bold uppercase tracking-wider ${ehHoje ? 'text-blue-600' : 'text-slate-500'}`}>
                        📅 {tituloDia}
                      </span>
                      <span className="text-[11px] text-slate-400 font-medium">
                        {listaJogos.length} {listaJogos.length === 1 ? 'jogo' : 'jogos'}
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      {listaJogos.map((jogo) => {
                        const finalizado = jogo.status === 'ENCERRADO';
                        const aoVivo = jogo.status === 'AO_VIVO';

                        return (
                          <div key={jogo.id} className="bg-white rounded-2xl shadow-xs border border-slate-200/90 p-3.5 space-y-2">
                            <div className="flex justify-between items-center text-xs text-slate-500 font-semibold border-b border-slate-100 pb-1">
                              <span>🕒 {jogo.hora}</span>
                              {aoVivo && (
                                <span className="text-red-700 bg-red-50 px-2 py-0.5 rounded-md text-[10px] font-extrabold animate-pulse border border-red-200">
                                  {jogo.tempoJogo || 'AO VIVO'}
                                </span>
                              )}
                              {finalizado && (
                                <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md text-[10px] font-bold border border-emerald-200">
                                  Finalizado
                                </span>
                              )}
                              {!aoVivo && !finalizado && (
                                <span className="text-slate-400 text-[11px] font-medium">Agendado</span>
                              )}
                            </div>

                            <div className="flex items-center justify-between py-1">
                              {/* Mandante */}
                              <div className="flex items-center gap-2 w-[40%] justify-end text-right">
                                <span className="text-xs sm:text-sm font-bold text-slate-900 truncate">{jogo.homeTeam.shortName}</span>
                                <img src={jogo.homeTeam.logo} alt={jogo.homeTeam.name} className="w-5 h-5 object-contain flex-shrink-0" />
                              </div>

                              {/* Placar */}
                              <div className="w-[20%] flex justify-center text-center">
                                {finalizado || aoVivo ? (
                                  <div className="inline-flex items-center font-mono font-black text-xs text-slate-900 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-lg">
                                    <span>{jogo.homeTeam.score}</span>
                                    <span className="mx-1 text-slate-300">:</span>
                                    <span>{jogo.awayTeam.score}</span>
                                  </div>
                                ) : (
                                  <span className="text-[10px] font-black uppercase text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">
                                    vs
                                  </span>
                                )}
                              </div>

                              {/* Visitante */}
                              <div className="flex items-center gap-2 w-[40%] justify-start text-left">
                                <img src={jogo.awayTeam.logo} alt={jogo.awayTeam.name} className="w-5 h-5 object-contain flex-shrink-0" />
                                <span className="text-xs sm:text-sm font-bold text-slate-900 truncate">{jogo.awayTeam.shortName}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-8 border border-slate-200/90 text-center text-slate-400 text-sm shadow-xs">
              Aguardando abertura dos jogos oficiais da temporada.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TabelaConferenciaNBA({ times }: { times: TimeNBA[] }) {
  return (
    <div className="overflow-x-auto bg-white rounded-2xl shadow-xs border border-slate-200/90">
      <table className="min-w-full text-xs sm:text-sm">
        <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
          <tr>
            <th className="px-3 py-2.5 text-left font-semibold w-8">#</th>
            <th className="px-3 py-2.5 text-left font-semibold">Franquia</th>
            <th className="px-2 py-2.5 text-center font-semibold w-10">V</th>
            <th className="px-2 py-2.5 text-center font-semibold w-10">D</th>
            <th className="px-2 py-2.5 text-center font-semibold w-12">%</th>
            <th className="px-2 py-2.5 text-center font-semibold w-12">Seq</th>
          </tr>
        </thead>
        <tbody>
          {times.map((time, idx) => (
            <tr key={time.teamName} className="border-t border-slate-100 hover:bg-slate-50/60 transition-colors">
              <td className="px-3 py-2.5 font-bold text-gray-700">{idx + 1}</td>
              <td className="px-3 py-2.5 flex items-center gap-2">
                <img src={time.teamLogo} alt={time.teamName} className="w-5 h-5 object-contain flex-shrink-0" />
                <span className="font-semibold text-slate-900 truncate">{time.teamName}</span>
              </td>
              <td className="px-2 py-2.5 text-center font-bold text-slate-900">{time.wins}</td>
              <td className="px-2 py-2.5 text-center text-slate-600">{time.losses}</td>
              <td className="px-2 py-2.5 text-center font-extrabold text-blue-600">{time.pct}</td>
              <td className="px-2 py-2.5 text-center font-medium text-slate-600">{time.streak}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}