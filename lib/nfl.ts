// lib/nfl.ts

export type TimeTabelaNFL = {
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

export type JogoNFL = {
  idEvent: string; 
  intRound: string; 
  dateEvent: string; 
  strTime: string; 
  strHomeTeam: string;
  strAwayTeam: string; 
  strHomeLogo?: string;
  strAwayLogo?: string;
  intHomeScore: string | null; 
  intAwayScore: string | null; 
  strStatus: string;
};

export const divisoesOficiaisNFL: Record<string, { conference: string; division: string }> = {
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

export function identificarDivisaoNFL(nomeTime: string) {
  for (const [timeNome, info] of Object.entries(divisoesOficiaisNFL)) {
    if (nomeTime.toLowerCase().includes(timeNome.toLowerCase()) || timeNome.toLowerCase().includes(nomeTime.toLowerCase())) {
      return info;
    }
  }
  return { conference: "American Football Conference", division: "AFC East" };
}

// 1. BUSCA CLASSIFICAÇÃO DA ESPN COM CABEÇALHOS OFICIAIS
export async function getTabelaNFL(): Promise<TimeTabelaNFL[]> {
  const url = "https://site.api.espn.com/apis/v2/sports/football/nfl/standings";

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Referer': 'https://www.espn.com/'
      },
      next: { revalidate: 3600 }
    });

    if (!res.ok) throw new Error(`ESPN Standings retornou ${res.status}`);
    const data = await res.json();
    const todosTimesMapeados: TimeTabelaNFL[] = [];

    function extrairTimes(obj: any) {
      if (obj.standings?.entries && Array.isArray(obj.standings.entries)) {
        obj.standings.entries.forEach((entry: any) => {
          const nomeTime = entry.team?.displayName || entry.team?.name || 'Time';
          const infoDiv = identificarDivisaoNFL(nomeTime);

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
      const divisoesNomes = Array.from(new Set(Object.keys(divisoesOficiaisNFL).map(k => divisoesOficiaisNFL[k].division)));
      const timesFinal: TimeTabelaNFL[] = [];

      divisoesUnicas(divisoesNomes, todosTimesMapeados, timesFinal);
      return timesFinal;
    }
    throw new Error("Menos de 30 times");
  } catch (error) {
    console.error("Erro ao buscar tabela da ESPN:", error);
    return [];
  }
}

function divisoesUnicas(divisoesNomes: string[], todosTimesMapeados: TimeTabelaNFL[], timesFinal: TimeTabelaNFL[]) {
  divisoesNomes.forEach(divNome => {
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
}

// 2. BUSCA TODAS AS 18 SEMANAS COM CABEÇALHOS OFICIAIS
export async function getTodosJogosNFL(): Promise<JogoNFL[]> {
  try {
    const semanas = Array.from({ length: 18 }, (_, i) => i + 1);
    const responses = await Promise.all(
      semanas.map(semana =>
        fetch(`https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?seasontype=2&week=${semana}`, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            'Accept': 'application/json',
            'Referer': 'https://www.espn.com/'
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

    return todosJogos;
  } catch (error) {
    console.error("Erro ao carregar jogos da NFL:", error);
    return [];
  }
}