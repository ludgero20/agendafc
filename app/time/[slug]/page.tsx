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

// 1. METADADOS AUTOMÁTICOS PARA O GOOGLE (SEO)
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

    const jogosDoTime = todosJogos.filter(m => m.homeTeam?.id === time.idAPI || m.awayTeam?.id === time.idAPI);

    // 3 jogos mais recentes finalizados (ordenados do mais novo para o mais antigo)
    const finalizados = jogosDoTime
      .filter(m => m.status === 'FINISHED')
      .sort((a, b) => new Date(b.utcDate).getTime() - new Date(a.utcDate).getTime())
      .slice(0, 3);

    // Próximas 5 rodadas agendadas
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

  // 📲 LINK PARA COMPARTILHAR A PÁGINA DO CLUBE NO WHATSAPP
  const textoCompartilharPagina = `⚽ *Guia de Jogos do ${time.nome} | Agenda FC*\nAcompanhe onde vão passar os jogos na TV, a tabela do ${time.competicaoNome} e os próximos confrontos!\n\n👉 Confira a agenda completa em: https://agendafc.com.br/time/${time.slug}`;
  const linkShareWhatsApp = `https://api.whatsapp.com/send?text=${encodeURIComponent(textoCompartilharPagina)}`;

  return (
    <div className="space-y-12 max-w-6xl mx-auto px-4 py-6">
      
      {/* CABEÇALHO DO CLUBE COM O BOTÃO DE COMPARTILHAR A PÁGINA */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="w-24 h-24 flex-shrink-0 flex items-center justify-center">
            <img src={time.escudo} alt={time.nome} className="w-24 h-24 object-contain" />
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900">Onde assistir aos jogos do {time.nome}</h1>
            <p className="text-gray-600 mt-1">Guia de transmissões na TV, tabela do ${time.competicaoNome} e calendário completo de partidas.</p>
          </div>
        </div>

        {/* 📲 BOTÃO DESTACADO DE COMPARTILHAR PÁGINA */}
        <a
          href={linkShareWhatsApp}
          target="_blank"
          rel="noopener noreferrer"
          title={`Compartilhar página do ${time.nome} no WhatsApp`}
          className="flex-shrink-0 inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-sm px-5 py-3 rounded-xl transition-all shadow-sm hover:shadow-md hover:scale-105"
        >
          <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
          </svg>
          <span>Compartilhar página</span>
        </a>
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
                        <span>{formatarNomeTime(t.team.shortName, t.team.name)}</span>
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
        <div>
          <h3 className="text-xl font-bold text-gray-800 mb-3">⏮️ Últimos Resultados no Campeonato</h3>
          {finalizados.length > 0 ? (
            <div className="space-y-3">
              {finalizados.map((jogo) => (
                <div key={jogo.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between text-sm">
                  <span className="w-2/5 text-right font-medium truncate">
                    {formatarNomeTime(jogo.homeTeam.shortName, jogo.homeTeam.name)}
                  </span>
                  <span className="px-3 py-1 bg-gray-100 font-extrabold rounded-md mx-2">
                    {jogo.score?.fullTime?.home ?? 0} x {jogo.score?.fullTime?.away ?? 0}
                  </span>
                  <span className="w-2/5 text-left font-medium truncate">
                    {formatarNomeTime(jogo.awayTeam.shortName, jogo.awayTeam.name)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 bg-gray-50 p-4 rounded-xl border">Sem resultados anteriores registrados.</p>
          )}
        </div>

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
                    <span className="w-2/5 text-right truncate">
                      {formatarNomeTime(jogo.homeTeam.shortName, jogo.homeTeam.name)}
                    </span>
                    <span className="text-gray-400 font-normal mx-2">vs</span>
                    <span className="w-2/5 text-left truncate">
                      {formatarNomeTime(jogo.awayTeam.shortName, jogo.awayTeam.name)}
                    </span>
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