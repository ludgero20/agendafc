import type { Metadata } from 'next';
import fs from 'fs/promises';
import path from 'path';
import Image from 'next/image';
import RodadaNFLClient from '@/app/components/RodadaNFLClient';

export const metadata: Metadata = {
  title: "Tabela e Jogos da NFL | Classificação e Rodadas | Agenda FC",
  description: "Tabela de classificação e calendário de jogos e resultados da NFL, dividida por conferências e divisões.",
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

type JogoNFL = {
  idEvent: string; 
  intRound: string; 
  dateEvent: string; 
  strTime: string; 
  strHomeTeam: string;
  strAwayTeam: string; 
  intHomeScore: string | null; 
  intAwayScore: string | null; 
  strStatus: string;
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
            teamLogo: entry.team?.logos?.[0]?.href || 'https://a.espncdn.com/i/teamlogos/nfl/500/scoreboard/nfl.png',
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

// 2. JOGOS DA NFL COM FUSO HORÁRIO DE BRASÍLIA CORRIGIDO
async function getTodosJogosNFL(): Promise<JogoNFL[] | null> {
  try {
    const res = await fetch("https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?limit=1000", {
      next: { revalidate: 3600 }
    });

    if (!res.ok) throw new Error("Falha ao buscar jogos na ESPN");
    const data = await res.json();
    const eventos = data?.events || [];

    // Formatador infalível que converte para o dia real no Brasil
    const dateFormatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' });

    const jogosFormatados: JogoNFL[] = eventos.map((ev: any) => {
      const comp = ev.competitions?.[0];
      const home = comp?.competitors?.find((c: any) => c.homeAway === 'home');
      const away = comp?.competitors?.find((c: any) => c.homeAway === 'away');

      const dataObj = ev.date ? new Date(ev.date) : new Date();
      
      // 🎯 CORREÇÃO: Garante YYYY-MM-DD e HH:MM no fuso de Brasília!
      const dateEvent = dateFormatter.format(dataObj); 
      const strTime = dataObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' });

      const finalizado = ev.status?.type?.completed;
      const emAndamento = ev.status?.type?.state === 'in';

      return {
        idEvent: String(ev.id),
        intRound: String(ev.week?.number || '1'),
        dateEvent: dateEvent,
        strTime: strTime,
        strHomeTeam: home?.team?.displayName || 'Casa',
        strAwayTeam: away?.team?.displayName || 'Visitante',
        intHomeScore: finalizado || emAndamento ? String(home?.score || '0') : null,
        intAwayScore: finalizado || emAndamento ? String(away?.score || '0') : null,
        strStatus: finalizado ? 'Match Finished' : (emAndamento ? 'In Progress' : 'Not Started')
      };
    });

    if (jogosFormatados.length > 0) return jogosFormatados;
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
      <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-6 rounded-lg text-center">
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
    <div>
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold">NFL - National Football League</h1>
        <p className="text-xl text-gray-600 mt-2">Temporada Regular</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {Object.entries(tabelasPorConferencia).map(([conferencia, divisoes]) => (
            <div key={conferencia}>
              <h2 className="text-3xl font-bold mb-4">{conferencia}</h2>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {Object.entries(divisoes).map(([divisao, tabela]) => (
                  <div key={divisao}>
                    <h3 className="text-xl font-semibold mb-3">
                      {divisao.replace("AFC ", "").replace("NFC ", "")}
                    </h3>
                    <div className="overflow-x-auto bg-white rounded-lg shadow-md">
                      <table className="min-w-full text-sm">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="px-3 py-2 text-left font-semibold text-gray-600">Time</th>
                            <th className="px-3 py-2 text-center font-semibold text-gray-600">V</th>
                            <th className="px-3 py-2 text-center font-semibold text-gray-600">D</th>
                            <th className="px-3 py-2 text-center font-semibold text-gray-600">E</th>
                            <th className="px-3 py-2 text-center font-semibold text-gray-600">%</th>
                          </tr>
                        </thead>
                        <tbody>
                          {tabela
                            .sort((a, b) => parseInt(a.rank) - parseInt(b.rank))
                            .map((time) => (
                              <tr key={time.teamName} className="border-t hover:bg-gray-50">
                                <td className="px-3 py-2 flex items-center">
                                  <Image 
                                    src={time.teamLogo} 
                                    alt={time.teamName} 
                                    width={20} 
                                    height={20} 
                                    className="w-5 h-5 mr-2 object-contain" 
                                  />
                                  <span className="font-medium">{time.teamName}</span>
                                </td>
                                <td className="px-3 py-2 text-center font-bold">{time.intWin}</td>
                                <td className="px-3 py-2 text-center">{time.intLoss}</td>
                                <td className="px-3 py-2 text-center">{time.intTie}</td>
                                <td className="px-3 py-2 text-center font-bold text-blue-600">{time.strPercentage}</td>
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

        <RodadaNFLClient 
          todosOsJogos={todosOsJogos} 
          rodadaInicial={rodadaInicial}
        />
      </div>
    </div>
  );
}
