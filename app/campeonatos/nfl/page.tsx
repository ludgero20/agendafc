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

// 🏈 MAPA OFICIAL DAS 8 DIVISÕES DA NFL (32 FRANQUIAS)
const divisoesOficiaisNFL: Record<string, { conference: string; division: string }> = {
  "Buffalo Bills": { conference: "American Football Conference", division: "AFC East" },
  "Miami Dolphins": { conference: "American Football Conference", division: "AFC East" },
  "New England Patriots": { conference: "American Football Conference", division: "AFC East" },
  "New York Jets": { conference: "American Football Conference", division: "AFC East" },
  "Baltimore Ravens": { conference: "American Football Conference", division: "AFC North" },
  "Cincinnati Bengals": { conference: "American Football Conference", division: "AFC North" },
  "Cleveland Browns": { conference: "American Football Conference", division: "AFC North" },
  "Pittsburgh Steelers": { conference: "American Football Conference", division: "AFC North" },
  "Houston Texans": { conference: "American Football Conference", division: "AFC South" },
  "Indianapolis Colts": { conference: "American Football Conference", division: "AFC South" },
  "Jacksonville Jaguars": { conference: "American Football Conference", division: "AFC South" },
  "Tennessee Titans": { conference: "American Football Conference", division: "AFC South" },
  "Denver Broncos": { conference: "American Football Conference", division: "AFC West" },
  "Kansas City Chiefs": { conference: "American Football Conference", division: "AFC West" },
  "Las Vegas Raiders": { conference: "American Football Conference", division: "AFC West" },
  "Los Angeles Chargers": { conference: "American Football Conference", division: "AFC West" },
  "Dallas Cowboys": { conference: "National Football Conference", division: "NFC East" },
  "New York Giants": { conference: "National Football Conference", division: "NFC East" },
  "Philadelphia Eagles": { conference: "National Football Conference", division: "NFC East" },
  "Washington Commanders": { conference: "National Football Conference", division: "NFC East" },
  "Chicago Bears": { conference: "National Football Conference", division: "NFC North" },
  "Detroit Lions": { conference: "National Football Conference", division: "NFC North" },
  "Green Bay Packers": { conference: "National Football Conference", division: "NFC North" },
  "Minnesota Vikings": { conference: "National Football Conference", division: "NFC North" },
  "Atlanta Falcons": { conference: "National Football Conference", division: "NFC South" },
  "Carolina Panthers": { conference: "National Football Conference", division: "NFC South" },
  "New Orleans Saints": { conference: "National Football Conference", division: "NFC South" },
  "Tampa Bay Buccaneers": { conference: "National Football Conference", division: "NFC South" },
  "Arizona Cardinals": { conference: "National Football Conference", division: "NFC West" },
  "Los Angeles Rams": { conference: "National Football Conference", division: "NFC West" },
  "San Francisco 49ers": { conference: "National Football Conference", division: "NFC West" },
  "Seattle Seahawks": { conference: "National Football Conference", division: "NFC West" }
};

function identificarDivisao(nomeTime: string) {
  for (const [timeNome, info] of Object.entries(divisoesOficiaisNFL)) {
    if (nomeTime.toLowerCase().includes(timeNome.toLowerCase()) || timeNome.toLowerCase().includes(nomeTime.toLowerCase())) {
      return info;
    }
  }
  return { conference: "American Football Conference", division: "AFC East" };
}

// 1. TABELA DA NFL (ESPN)
async function getTabelaNFL(): Promise<TimeTabelaNFL[] | null> {
  const url = "https://site.api.espn.com/apis/v2/sports/football/nfl/standings";

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json'
      },
      next: { revalidate: 3600 }
    });

    if (!res.ok) throw new Error(`ESPN Standings retornou status ${res.status}`);
    const data = await res.json();
    const todosTimesMapeados: TimeTabelaNFL[] = [];

    function extrairTimes(obj: any) {
      if (obj.standings?.entries && Array.isArray(obj.standings.entries)) {
        obj.standings.entries.forEach((entry: any) => {
          const nomeTime = entry.team?.displayName || entry.team?.name || 'Time';
          const infoDiv = identificarDivisao(nomeTime);

          const stats = entry.stats || [];
          const getStat = (n: string) => stats.find((x: any) => x.name?.toLowerCase() === n.toLowerCase() || x.type?.toLowerCase() === n.toLowerCase())?.value ?? 0;
          const getStatDisplay = (n: string) => {
            const s = stats.find((x: any) => x.name?.toLowerCase() === n.toLowerCase() || x.type?.toLowerCase() === n.toLowerCase());
            return s?.displayValue ?? String(s?.value ?? "0.000");
          };

          const vitorias = getStat('wins');
          const derrotas = getStat('losses');
          const empates = getStat('ties');
          const pct = getStatDisplay('winpercent') || getStatDisplay('winpercentage');
          const abbrev = entry.team?.abbreviation?.toLowerCase() || '';
          const logoUrl = entry.team?.logos?.[0]?.href || entry.team?.logo || (abbrev ? `https://a.espncdn.com/i/teamlogos/nfl/500/${abbrev}.png` : '');

          if (!todosTimesMapeados.some(t => t.teamName === nomeTime)) {
            todosTimesMapeados.push({
              teamName: nomeTime,
              teamLogo: logoUrl,
              rank: "1",
              conference: infoDiv.conference,
              division: infoDiv.division,
              intWin: String(vitorias),
              intLoss: String(derrotas),
              intTie: String(empates),
              strPercentage: String(pct).startsWith('0') ? String(pct).substring(1) : String(pct)
            });
          }
        });
      }

      if (obj.children && Array.isArray(obj.children)) {
        obj.children.forEach((c: any) => extrairTimes(c));
      }
    }

    extrairTimes(data);

    if (todosTimesMapeados.length >= 30) {
      const divisoesNomes = Object.keys(divisoesOficiaisNFL).map(k => divisoesOficiaisNFL[k].division);
      const divisoesUnicas = Array.from(new Set(divisoesNomes));
      const timesFinal: TimeTabelaNFL[] = [];

      divisoesUnicas.forEach(divNome => {
        const timesDaDivisao = todosTimesMapeados.filter(t => t.division === divNome);
        timesDaDivisao.sort((a, b) => {
          const pctA = parseFloat(a.strPercentage) || 0;
          const pctB = parseFloat(b.strPercentage) || 0;
          if (pctA !== pctB) return pctB - pctA;
          return parseInt(b.intWin) - parseInt(a.intWin);
        });

        timesDaDivisao.forEach((time, index) => {
          time.rank = String(index + 1);
          timesFinal.push(time);
        });
      });

      return timesFinal;
    }
    throw new Error("Menos de 30 times");
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

// 2. BUSCA TODAS AS 18 SEMANAS COM DATES=2026 FORÇADO
async function getTodosJogosNFL(): Promise<JogoNFL[] | null> {
  try {
    const semanas = Array.from({ length: 18 }, (_, i) => i + 1);
    
    const responses = await Promise.all(
      semanas.map(semana =>
        // 🎯 FORÇA DATES=2026 PARA NÃO TRAZER 2025 NA VERCEL:
        fetch(`https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?dates=2026&seasontype=2&week=${semana}`, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          },
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

  const jogosNaoFinalizados = todosOsJogos
    .filter(j => j.strStatus !== 'Match Finished')
    .sort((a, b) => a.dateEvent.localeCompare(b.dateEvent));

  let rodadaInicial = 1;
  if (jogosNaoFinalizados.length > 0) {
    rodadaInicial = parseInt(jogosNaoFinalizados[0].intRound);
  } else if (todosOsJogos.length > 0) {
    rodadaInicial = todosOsJogos.reduce((max, jogo) => Math.max(max, parseInt(jogo.intRound)), 0);
  }

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