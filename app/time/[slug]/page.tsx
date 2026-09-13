// app/time/[slug]/page.tsx
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { timesConfig } from '@/lib/times';
import { getTabelaFutebol, getJogosFutebolDoTime } from '@/lib/services/futebol-service';
import { getTabelaCompletaNFL, getJogosNFLDoTime } from '@/lib/services/nfl-service';
import { getTabelaNBA } from '@/lib/services/nba-service';
import { getEquipesF1 } from '@/lib/services/f1-service';
import { getJogosTransmissaoDoTime } from '@/lib/services/tv-service';
import TimeHeader from '@/app/components/time/TimeHeader';
import TimeTransmissoes from '@/app/components/time/TimeTransmissoes';
import TimeTabela from '@/app/components/time/TimeTabela';
import TimeJogos from '@/app/components/time/TimeJogos';
import TimeF1Info from '@/app/components/time/TimeF1Info';

export const revalidate = 3600;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const time = timesConfig[slug];
  if (!time) return { title: 'Página não encontrada | Agenda FC' };

  return {
    title: `${time.nome} | Transmissões, Tabela e Resultados | Agenda FC`,
    description: `Confira onde assistir aos jogos do ${time.nome} ao vivo na TV e streaming, classificação oficial e calendário completo.`,
  };
}

export default async function TimePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const time = timesConfig[slug];

  if (!time) notFound();

  // 1. DADOS DE FÓRMULA 1
  if (time.esporte === 'f1') {
    const equipesF1 = await getEquipesF1();
    const jogosTV = await getJogosTransmissaoDoTime(time);

    return (
      <div className="space-y-8 max-w-6xl mx-auto px-4 py-6">
        <TimeHeader time={time} />
        <TimeTransmissoes jogosTV={jogosTV} time={time} />
        <TimeF1Info time={time} equipesF1={equipesF1} />
      </div>
    );
  }

  // 2. DADOS DE BASQUETE (NBA)
  if (time.esporte === 'nba') {
    const [tabelaNBA, jogosTV] = await Promise.all([
      getTabelaNBA(),
      getJogosTransmissaoDoTime(time)
    ]);

    const confAlvo = time.conferenciaNBA === 'Western Conference' ? 'Oeste' : 'Leste';
    const tabelaFiltrada = tabelaNBA
      .filter((t) => t.conference === confAlvo)
      .map((t, idx) => ({
        position: idx + 1,
        team: { name: t.teamName, shortName: t.shortName, crest: t.teamLogo },
        won: t.wins,
        lost: t.losses,
        pct: t.pct,
      }));

    return (
      <div className="space-y-8 max-w-6xl mx-auto px-4 py-6">
        <TimeHeader time={time} />
        <TimeTransmissoes jogosTV={jogosTV} time={time} />
        <TimeTabela tabela={tabelaFiltrada} time={time} nomeDivisao={`Conferência ${confAlvo}`} />
      </div>
    );
  }

  // 3. DADOS DE FUTEBOL AMERICANO (NFL)
  if (time.esporte === 'nfl') {
    const [tabelaNFL, dadosJogos, jogosTV] = await Promise.all([
      getTabelaCompletaNFL(),
      getJogosNFLDoTime(time),
      getJogosTransmissaoDoTime(time),
    ]);

    const divisaoAlvo = time.divisaoNFL || '';
    const tabelaFiltrada = (tabelaNFL || [])
      .filter((t) => t.division.toLowerCase().includes(divisaoAlvo.toLowerCase()))
      .map((t, idx) => ({
        position: idx + 1,
        team: { name: t.teamName, shortName: t.teamName, crest: t.teamLogo },
        won: t.intWin,
        lost: t.intLoss,
        draw: t.intTie,
        pct: t.strPercentage,
      }));

    return (
      <div className="space-y-8 max-w-6xl mx-auto px-4 py-6">
        <TimeHeader time={time} />
        <TimeTransmissoes jogosTV={jogosTV} time={time} />
        <TimeTabela tabela={tabelaFiltrada} time={time} nomeDivisao={divisaoAlvo || 'NFL'} />
        <TimeJogos finalizados={dadosJogos.finalizados} proximos={dadosJogos.proximos} time={time} />
      </div>
    );
  }

  // 4. DADOS DE FUTEBOL (SÉRIE A & EUROPA)
  const [tabelaFut, jogosFut, jogosTV] = await Promise.all([
    getTabelaFutebol({
      id: 0,
      nome: time.competicaoNome,
      pais: 'Brasil',
      tipo: 'Nacional',
      descricao: '',
      prioridade: 1,
      ativo: true,
      bandeiraEmoji: '⚽',
      codigoAPI: time.competicaoCodigo,
      arquivoStandings: time.arquivoStandings,
      arquivoMatches: time.arquivoMatches,
    }),
    getJogosFutebolDoTime(time),
    getJogosTransmissaoDoTime(time),
  ]);

  const tabelaMapeada = (tabelaFut || []).map((t) => ({
    position: t.position,
    team: t.team,
    playedGames: t.playedGames,
    won: t.won,
    draw: t.draw,
    lost: t.lost,
    points: t.points,
    goalDifference: t.goalDifference,
  }));

  return (
    <div className="space-y-8 max-w-6xl mx-auto px-4 py-6">
      <TimeHeader time={time} />
      <TimeTransmissoes jogosTV={jogosTV} time={time} />
      <TimeTabela tabela={tabelaMapeada} time={time} nomeDivisao={time.competicaoNome} />
      {/* ⚽ BLOCO 3 RESTAURADO COM SUCESSO! */}
      <TimeJogos finalizados={jogosFut.finalizados} proximos={jogosFut.proximos} time={time} />
    </div>
  );
}