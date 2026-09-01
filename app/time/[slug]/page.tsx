import type { Metadata } from 'next';
import fs from 'fs/promises';
import path from 'path';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { timesConfig, TimeConfig } from '@/lib/times';

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
  position: number;
  team: { id: number; name: string; shortName: string; crest: string; };
  playedGames: number;
  won: number;
  draw: number;
  lost: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
};

type JogoCampeonato = {
  id: number;
  utcDate: string;
  status: string;
  matchday: number;
  homeTeam: { id: number; name: string; shortName: string; crest: string; };
  awayTeam: { id: number; name: string; shortName: string; crest: string; };
  score: {
    fullTime: { home: number | null; away: number | null; };
  };
};

// 1. GERA METADADOS AUTOMÁTICOS PARA O GOOGLE (SEO)
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const time = timesConfig[slug];
  if (!time) return { title: "Time não encontrado | Agenda FC" };

  return {
    title: `Onde assistir aos jogos do ${time.nome} ao vivo | Tabela e Transmissão`,
    description: `Confira onde vai passar o próximo jogo do ${time.nome} na TV e streaming, horário, canais de transmissão, classificação no ${time.competicaoNome} e calendário completo.`,
  };
}

// 2. BUSCA JOGOS COM TRANSMISSÃO CONFIRMADA (Robô IA + Sheets)
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

    // Filtra jogos onde o time participa
    return todos.filter((jogo: JogoTransmissao) => {
      const time1 = (jogo.time1 || '').toLowerCase();
      const time2 = (jogo.time2 || '').toLowerCase();
      return time.variacoesNome.some(v => time1.includes(v.toLowerCase()) || time2.includes(v.toLowerCase()));
    });
  } catch {
    return [];
  }
}

// 3. BUSCA TABELA E JOGOS DO CAMPEONATO
// 3. BUSCA TABELA E JOGOS DO CAMPEONATO (COM PLACARES RECENTES)
async function getDadosCampeonato(time: TimeConfig) {
  try {
    const standingsPath = path.join(process.cwd(), "public/api-cache", time.arquivoStandings);
    const matchesPath = path.join(process.cwd(), "public/api-cache", time.arquivoMatches);

    const [standingsFile, matchesFile] = await Promise.all([
      fs.readFile(standingsPath, "utf-8").catch(() => null),
      fs.readFile(matchesPath, "utf-8").catch(() => null)
    ]);

    const tabela: TimeTabela[] = standingsFile ? JSON.parse(standingsFile)?.standings?.[0]?.table || [] : [];
    const todosJogos: JogoCampeonato[] = matchesFile ? JSON.parse(matchesFile)?.matches || [] : [];

    // Filtra apenas os jogos do time em questão
    const jogosDoTime = todosJogos.filter(m => m.homeTeam?.id === time.idAPI || m.awayTeam?.id === time.idAPI);

    // Pega os 3 jogos finalizados mais recentes ordenados pela data (do mais novo para o mais velho)
    const finalizados = jogosDoTime
      .filter(m => m.status === 'FINISHED')
      .sort((a, b) => new Date(b.utcDate).getTime() - new Date(a.utcDate).getTime())
      .slice(0, 3);

    // Pega os próximos 5 confrontos agendados ordenados cronologicamente
    const proximos = jogosDoTime
      .filter(m => m.status !== 'FINISHED')
      .sort((a, b) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime())
      .slice(0, 5);

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
    getDadosCampeonato(time)
  ]);

  const formatarDataBR = (dataISO: string) => {
    return new Date(dataISO).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' }).replace(',', ' às');
  };

  return (
    <div className="space-y-12 max-w-6xl mx-auto px-4 py-6">
      {/* HEADER DO CLUBE */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
        <div className="w-24 h-24 flex-shrink-0 flex items-center justify-center">
  <img src={time.escudo} alt={time.nome} className="w-24 h-24 object-contain" />
</div>

        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900">Onde assistir aos jogos do {time.nome}</h1>
          <p className="text-gray-600 mt-1">Guia de transmissões na TV, tabela do {time.competicaoNome} e calendário completo de partidas.</p>
        </div>
      </div>

      {/* BLOCO 1: TRANSMISSÕES CONFIRMADAS NA TV */}
      <section>
        <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          📺 Próximos Jogos com Transmissão na TV
        </h2>
        {jogosTV.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {jogosTV.map((jogo) => (
              <div key={jogo.id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-semibold px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full">{jogo.campeonato}</span>
                  <span className="text-sm font-bold text-emerald-600">🕒 {jogo.hora}</span>
                </div>
                <div className="text-lg font-bold text-gray-900 text-center my-3">
                  {jogo.time1} <span className="text-gray-400 font-normal mx-2">vs</span> {jogo.time2}
                </div>
                <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center">
                  <span className="text-xs font-medium text-gray-600">📺 {jogo.canal}</span>
                  <a
                    href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`⚽ ${jogo.time1} x ${jogo.time2}\n🏆 ${jogo.campeonato}\n🕒 ${jogo.hora}\n📺 ${jogo.canal}\n\nVeja em: https://agendafc.com.br/time/${time.slug}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-lg shadow-sm"
                  >
                    Compartilhar
                  </a>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-gray-50 rounded-xl p-6 text-center border border-gray-200">
            <p className="text-gray-600">Nenhuma transmissão confirmada para os próximos 3 dias. A grade de TV é atualizada diariamente.</p>
          </div>
        )}
      </section>

      {/* BLOCO 2: CLASSIFICAÇÃO COM O TIME EM DESTAQUE */}
      {tabela.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            🏆 {time.competicaoNome} - Classificação
          </h2>
          <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-gray-200">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">#</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Time</th>
                  <th className="px-3 py-3 text-center font-semibold text-gray-600">P</th>
                  <th className="px-3 py-3 text-center font-semibold text-gray-600">J</th>
                  <th className="px-3 py-3 text-center font-semibold text-gray-600">V</th>
                  <th className="px-3 py-3 text-center font-semibold text-gray-600">E</th>
                  <th className="px-3 py-3 text-center font-semibold text-gray-600">D</th>
                  <th className="px-3 py-3 text-center font-semibold text-gray-600">SG</th>
                </tr>
              </thead>
              <tbody>
                {tabela.map((t) => {
                  const ehOTime = t.team.id === time.idAPI;
                  return (
                    <tr key={t.team.id} className={`border-t transition-colors ${ehOTime ? `${time.corPrimaria} font-bold border-l-4` : 'hover:bg-gray-50'}`}>
                      <td className="px-4 py-3">{t.position}</td>
                      <td className="px-4 py-3 flex items-center gap-2">
                        <img src={t.team.crest} alt={t.team.name} className="w-5 h-5 object-contain" />
                        <span>{t.team.shortName || t.team.name}</span>
                      </td>
                      <td className="px-3 py-3 text-center font-extrabold text-blue-600">{t.points}</td>
                      <td className="px-3 py-3 text-center">{t.playedGames}</td>
                      <td className="px-3 py-3 text-center">{t.won}</td>
                      <td className="px-3 py-3 text-center">{t.draw}</td>
                      <td className="px-3 py-3 text-center">{t.lost}</td>
                      <td className="px-3 py-3 text-center">{t.goalDifference}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* BLOCO 3: HISTÓRICO E PRÓXIMOS CONFRONTOS DO CAMPEONATO */}
      <section className="grid md:grid-cols-2 gap-8">
        {/* Últimos Resultados */}
        <div>
          <h3 className="text-xl font-bold text-gray-800 mb-3">⏮️ Últimos Resultados no Campeonato</h3>
          {finalizados.length > 0 ? (
            <div className="space-y-3">
              {finalizados.map((jogo) => (
                <div key={jogo.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between text-sm">
                  <span className="w-2/5 text-right font-medium truncate">{jogo.homeTeam.shortName}</span>
                  <span className="px-3 py-1 bg-gray-100 font-extrabold rounded-md mx-2">
                    {jogo.score.fullTime.home ?? 0} x {jogo.score.fullTime.away ?? 0}
                  </span>
                  <span className="w-2/5 text-left font-medium truncate">{jogo.awayTeam.shortName}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 bg-gray-50 p-4 rounded-xl border">Sem resultados anteriores registrados.</p>
          )}
        </div>

        {/* Próximas Rodadas */}
        <div>
          <h3 className="text-xl font-bold text-gray-800 mb-3">⏭️ Próximas Rodadas Agendadas</h3>
          {proximos.length > 0 ? (
            <div className="space-y-3">
              {proximos.map((jogo) => (
                <div key={jogo.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm text-sm">
                  <div className="text-xs text-gray-500 mb-1 text-center font-medium">
                    Rodada {jogo.matchday} - {formatarDataBR(jogo.utcDate)}
                  </div>
                  <div className="flex items-center justify-between font-semibold text-gray-800">
                    <span className="w-2/5 text-right truncate">{jogo.homeTeam.shortName}</span>
                    <span className="text-gray-400 font-normal mx-2">vs</span>
                    <span className="w-2/5 text-left truncate">{jogo.awayTeam.shortName}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 bg-gray-50 p-4 rounded-xl border">Aguardando definição das próximas rodadas.</p>
          )}
        </div>
      </section>
    </div>
  );
}