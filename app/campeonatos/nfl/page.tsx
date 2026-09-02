import type { Metadata } from 'next';
import fs from 'fs/promises';
import path from 'path';
import RodadaNFLClient, { JogoNFL } from '@/app/components/RodadaNFLClient';

export const metadata: Metadata = {
  title: "Tabela e Jogos da NFL | Classificação e Rodadas | Agenda FC",
  description: "Tabela de classificação completa e calendário de todas as 18 semanas com placares e jogos da NFL.",
};

export const revalidate = 3600;

type TimeTabelaNFL = {
  teamName: string;      
  teamLogo: string;      
  rank: string;          
  conference: string;    
  division: string;      
  intWin: string;
  intLoss: string;
  intTie: string;
  strPercentage: string;
};

// 1. TABELA DA NFL (ESPN)
async function getTabelaNFL(): Promise<TimeTabelaNFL[] | null> {
  try {
    const res = await fetch("https://site.api.espn.com/apis/v2/sports/football/nfl/standings", {
      next: { revalidate: 3600 }
    });
    
    if (!res.ok) throw new Error("Falha ao buscar tabela na ESPN");
    const data = await res.json();
    const timesFormatados: TimeTabelaNFL[] = [];

    const conferencias = data?.children || [];
    conferencias.forEach((conf: any) => {
      const nomeConferencia = conf.name || (conf.abbreviation === 'AFC' ? 'American Football Conference' : 'National Football Conference');
      const divisoes = conf.children || [];

      divisoes.forEach((div: any) => {
        const nomeDivisao = div.name || div.shortName || '';
        const times = div?.standings?.entries || [];

        times.forEach((entry: any, index: number) => {
          const stats = entry.stats || [];
          const getStat = (name: string) => stats.find((s: any) => s.name === name)?.value ?? 0;
          const getStatDisplay = (name: string) => stats.find((s: any) => s.name === name)?.displayValue ?? '0.000';

          const vitorias = getStat('wins');
          const derrotas = getStat('losses');
          const empates = getStat('ties');
          const pct = getStatDisplay('winPercent');

          timesFormatados.push({
            teamName: entry.team?.displayName || entry.team?.name || 'Time',
            teamLogo: entry.team?.logos?.[0]?.href || `https://a.espncdn.com/i/teamlogos/nfl/500/${entry.team?.abbreviation?.toLowerCase() || 'nfl'}.png`,
            rank: String(index + 1),
            conference: nomeConferencia,
            division: nomeDivisao,
            intWin: String(vitorias),
            intLoss: String(derrotas),
            intTie: String(empates),
            strPercentage: String(pct).startsWith('0') ? String(pct).substring(1) : String(pct)
          });
        });
      });
    });

    if (timesFormatados.length > 0) return timesFormatados;
    throw new Error("Lista vazia da ESPN");

  } catch (error) {
    try {
      const filePath = path.join(process.cwd(), "public/importacoes-manuais/nfl/tabela.json");
      const jsonData = await fs.readFile(filePath, "utf-8");
      return JSON.parse(jsonData).standings || [];
    } catch {
      return null;
    }
  }
}

// 2. BUSCA TODAS AS 18 SEMANAS DA TEMPORADA REGULAR EM PARALELO
async function getTodosJogosNFL(): Promise<JogoNFL[] | null> {
  try {
    const semanas = Array.from({ length: 18 }, (_, i) => i + 1);
    
    // Busca as 18 semanas simultaneamente na ESPN
    const responses = await Promise.all(
      semanas.map(semana =>
        fetch(`https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?seasontype=2&week=${semana}`, {
          next: { revalidate: 3600 }
        })
          .then(res => res.ok ? res.json() : null)
          .catch(() => null)
      )
    );

    const dateFormatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' });
    const todosJogos: JogoNFL[] = [];

    responses.forEach((data, index) => {
      const semanaNum = String(index + 1);
      const eventos = data?.events || [];

      eventos.forEach((ev: any) => {
        const comp = ev.competitions?.[0];
        const home = comp?.competitors?.find((c: any) => c.homeAway === 'home');
        const away = comp?.competitors?.find((c: any) => c.homeAway === 'away');

        const dataObj = ev.date ? new Date(ev.date) : new Date();
        const dateEvent = dateFormatter.format(dataObj);
        const strTime = dataObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' });

        const finalizado = ev.status?.type?.completed;
        const emAndamento = ev.status?.type?.state === 'in';

        // 🎯 LOGO CORRETO DA ESPN: Leitura de team.logo direta
        const logoHome = home?.team?.logo || home?.team?.logos?.[0]?.href || `https://a.espncdn.com/i/teamlogos/nfl/500/${home?.team?.abbreviation?.toLowerCase() || 'nfl'}.png`;
        const logoAway = away?.team?.logo || away?.team?.logos?.[0]?.href || `https://a.espncdn.com/i/teamlogos/nfl/500/${away?.team?.abbreviation?.toLowerCase() || 'nfl'}.png`;

        todosJogos.push({
          idEvent: String(ev.id),
          intRound: String(ev.week?.number || semanaNum),
          dateEvent: dateEvent,
          strTime: strTime,
          strHomeTeam: home?.team?.displayName || 'Casa',
          strAwayTeam: away?.team?.displayName || 'Visitante',
          strHomeLogo: logoHome,
          strAwayLogo: logoAway,
          intHomeScore: finalizado || emAndamento ? String(home?.score || '0') : null,
          intAwayScore: finalizado || emAndamento ? String(away?.score || '0') : null,
          strStatus: finalizado ? 'Match Finished' : (emAndamento ? 'In Progress' : 'Not Started')
        });
      });
    });

    if (todosJogos.length > 0) return todosJogos;
    throw new Error("Nenhum evento na ESPN");

  } catch (error) {
    try {
      const filePath = path.join(process.cwd(), "public/importacoes-manuais/nfl/jogos-nfl.json");
      const jsonData = await fs.readFile(filePath, "utf-8");
      return JSON.parse(jsonData).events || [];
    } catch {
      return null;
    }
  }
}

export default async function NFLPage() {
  const [tabelaCompleta, todosOsJogos] = await Promise.all([
    getTabelaNFL(),
    getTodosJogosNFL()
  ]);

  if (!tabelaCompleta || !todosOsJogos) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-800 p-6 rounded-lg text-center max-w-xl mx-auto my-12">
        <h2 className="font-bold text-lg mb-2">Dados da NFL Indisponíveis</h2>
        <p>Os dados de classificação ou jogos estão sendo atualizados. Por favor, volte mais tarde.</p>
      </div>
    );
  }

  // Identifica a rodada atual
  const jogosNaoFinalizados = todosOsJogos
    .filter(j => j.strStatus !== 'Match Finished')
    .sort((a, b) => a.dateEvent.localeCompare(b.dateEvent));

  let rodadaInicial = 1;
  if (jogosNaoFinalizados.length > 0) {
    rodadaInicial = parseInt(jogosNaoFinalizados[0].intRound);
  } else if (todosOsJogos.length > 0) {
    rodadaInicial = todosOsJogos.reduce((max, jogo) => Math.max(max, parseInt(jogo.intRound)), 0);
  }

  // Agrupamento por Conferência e Divisão
  const tabelasPorConferencia = tabelaCompleta.reduce((acc, time) => {
    const conferencia = time.conference.includes("American") ? "AFC" : "NFC";
    const divisao = time.division;
    if (!acc[conferencia]) acc[conferencia] = {};
    if (!acc[conferencia][divisao]) acc[conferencia][divisao] = [];
    acc[conferencia][divisao].push(time);
    return acc;
  }, {} as Record<string, Record<string, TimeTabelaNFL[]>>);

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 py-6">
      <div className="text-center">
        <h1 className="text-4xl font-extrabold text-gray-900 flex items-center justify-center gap-3">
          <span>🏈</span> NFL - National Football League
        </h1>
        <p className="text-xl text-gray-600 mt-2">Temporada Regular - Classificação das Divisões e Rodadas</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* TABELAS DAS CONFERÊNCIAS E DIVISÕES */}
        <div className="lg:col-span-2 space-y-8">
          {Object.entries(tabelasPorConferencia).map(([conferencia, divisoes]) => (
            <div key={conferencia} className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2 border-b border-slate-200 pb-2">
                🏆 {conferencia === 'AFC' ? 'American Football Conference (AFC)' : 'National Football Conference (NFC)'}
              </h2>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {Object.entries(divisoes).map(([divisao, tabela]) => (
                  <div key={divisao} className="bg-white rounded-2xl shadow-xs border border-slate-200/90 p-4">
                    <h3 className="text-sm font-bold text-blue-700 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                      <span>🏈</span> {divisao.replace("AFC ", "").replace("NFC ", "")}
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-xs sm:text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                          <tr>
                            <th className="px-3 py-2 text-left font-semibold">Time</th>
                            <th className="px-2 py-2 text-center font-semibold">V</th>
                            <th className="px-2 py-2 text-center font-semibold">D</th>
                            <th className="px-2 py-2 text-center font-semibold">E</th>
                            <th className="px-2 py-2 text-center font-semibold">%</th>
                          </tr>
                        </thead>
                        <tbody>
                          {tabela
                            .sort((a, b) => parseInt(a.rank) - parseInt(b.rank))
                            .map((time) => (
                              <tr key={time.teamName} className="border-t border-slate-100 hover:bg-slate-50/60 transition-colors">
                                <td className="px-3 py-2.5 flex items-center gap-2">
                                  <img 
                                    src={time.teamLogo} 
                                    alt={time.teamName} 
                                    className="w-5 h-5 object-contain flex-shrink-0" 
                                  />
                                  <span className="font-semibold text-slate-900 truncate">{time.teamName}</span>
                                </td>
                                <td className="px-2 py-2.5 text-center font-bold text-slate-900">{time.intWin}</td>
                                <td className="px-2 py-2.5 text-center text-slate-600">{time.intLoss}</td>
                                <td className="px-2 py-2.5 text-center text-slate-600">{time.intTie}</td>
                                <td className="px-2 py-2.5 text-center font-extrabold text-blue-600">{time.strPercentage}</td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* NAVEGADOR DE TODAS AS 18 SEMANAS */}
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            🏈 Jogos da Semana
          </h2>
          <RodadaNFLClient 
            todosOsJogos={todosOsJogos} 
            rodadaInicial={rodadaInicial}
          />
        </div>
      </div>
    </div>
  );
}