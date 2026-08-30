import React from 'react';
import fs from 'fs/promises';
import path from 'path';
import SemanaListClient from '../components/SemanaListClient';

export const revalidate = 3600;

// Tipos 100% compatíveis com o seu SemanaListClient
type JogoSemana = {
  id: number;
  data: string;
  campeonato: string;
  time1: string;
  time2: string;
  hora: string;
  canal: string;
  divisao?: string;
  fase?: string;
};

type CompeticaoInfo = { 
  nome: string; 
  prioridade: number; 
  bandeiraEmoji: string; 
  ativo: boolean; 
};

async function carregarDadosDaSemana() {
  try {
    const competicoesPath = path.join(process.cwd(), "public", "competicoes-unificadas.json");
    const jogosPath = path.join(process.cwd(), "public", "jogos.json");
    const jogosManuaisPath = path.join(process.cwd(), "public", "jogos_manuais.json");
    const f1Path = path.join(process.cwd(), "public", "importacoes-manuais", "f1", "calendario.json");

    // Lê os 4 arquivos em paralelo
    const [competicoesFile, jogosFile, jogosManuaisFile, f1File] = await Promise.all([
      fs.readFile(competicoesPath, "utf-8"),
      fs.readFile(jogosPath, "utf-8"),
      fs.readFile(jogosManuaisPath, "utf-8").catch(() => '{"jogosSemana": []}'),
      fs.readFile(f1Path, "utf-8").catch(() => '[]')
    ]);

    const competicoesData = JSON.parse(competicoesFile);
    const jogosData = JSON.parse(jogosFile);
    const jogosManuaisData = JSON.parse(jogosManuaisFile);
    const f1Data = JSON.parse(f1File);

    // Converte sessões da F1 no formato exato de JogoSemana
    const sessoesF1ComoJogos: JogoSemana[] = (Array.isArray(f1Data) ? f1Data : []).flatMap((gp: any, gpIndex: number) => 
      (gp.sessoes || []).map((sessao: any, sessaoIndex: number) => ({
        id: 90000 + (gpIndex * 10) + sessaoIndex,
        data: sessao.data,
        hora: (sessao.hora || '').replace(':', 'h'),
        campeonato: "Fórmula 1",
        canal: Array.isArray(sessao.transmissao) ? sessao.transmissao.join(', ') : (sessao.transmissao || ''),
        time1: sessao.nome || "",
        time2: gp.raceName || "",
        divisao: undefined,
        fase: undefined
      }))
    );

    const competicoesAtivas: Record<string, CompeticaoInfo> = 
      competicoesData.competicoes.reduce((acc: Record<string, CompeticaoInfo>, comp: CompeticaoInfo) => {
        if (comp.ativo) acc[comp.nome] = comp;
        return acc;
      }, {});

    const agora = new Date();
    const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' });
    const hojeStr = formatter.format(agora);

    // Junta tudo e higieniza os dados para não passar null para o componente
    const todosOsJogos: JogoSemana[] = [
      ...(jogosData.jogosSemana || []),
      ...(jogosManuaisData.jogosSemana || []),
      ...sessoesF1ComoJogos
    ].map((jogo: any) => ({
      id: jogo.id || Math.floor(Math.random() * 10000),
      data: jogo.data,
      hora: jogo.hora,
      campeonato: jogo.campeonato,
      canal: jogo.canal,
      time1: jogo.time1 ?? (jogo.evento_nome || ""),
      time2: jogo.time2 ?? (jogo.evento_descricao || ""),
      divisao: jogo.divisao || undefined,
      fase: jogo.fase || undefined
    }));

    // Filtra jogos de hoje em diante (sem excluir o dia de hoje)
    const jogosDaSemanaFiltrados = todosOsJogos
      .map(jogo => {
        let dataNormalizada = jogo.data;
        if (dataNormalizada && dataNormalizada.includes('/')) {
          const partes = dataNormalizada.split('/');
          dataNormalizada = `${agora.getFullYear()}-${partes[1]}-${partes[0]}`;
        }
        return { ...jogo, data: dataNormalizada };
      })
      .filter(jogo => Boolean(jogo.data) && jogo.data >= hojeStr);

    const campeonatosDisponiveis = [...new Set(jogosDaSemanaFiltrados.map(j => j.campeonato))].sort();

    // Agrupa por data e campeonato
    const jogosPorData = jogosDaSemanaFiltrados.reduce((acc, jogo) => {
      const data = jogo.data;
      if (!acc[data]) acc[data] = {};
      const chave = jogo.divisao ? `${jogo.campeonato}_${jogo.divisao}` : jogo.campeonato;
      if (!acc[data][chave]) acc[data][chave] = [];
      acc[data][chave].push(jogo);
      return acc;
    }, {} as Record<string, Record<string, JogoSemana[]>>);

    // Ordenação por horário
    Object.values(jogosPorData).forEach(campeonatos => {
      Object.values(campeonatos).forEach(jogos => {
        jogos.sort((a, b) => a.hora.localeCompare(b.hora));
      });
    });

    return { jogosPorData, campeonatosDisponiveis, competicoesAtivas };

  } catch (error) {
    console.error("🚨 ERRO AO CARREGAR DADOS DA SEMANA:", error);
    return {
      jogosPorData: {},
      campeonatosDisponiveis: [],
      competicoesAtivas: {}
    };
  }
}

export default async function Semana() {
  const { jogosPorData, campeonatosDisponiveis, competicoesAtivas } = await carregarDadosDaSemana();

  return (
    <div className="space-y-8">
      <div className="text-center py-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Agenda da Semana: Jogos e Corridas na TV
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Acompanhe a programação completa de jogos de futebol e as corridas de Fórmula 1 para os próximos dias. Veja todos os horários e canais de transmissão para não perder nada.
        </p>
      </div>

      <SemanaListClient
        jogosPorDataIniciais={jogosPorData}
        campeonatosDisponiveis={campeonatosDisponiveis}
        competicoesAtivas={competicoesAtivas}
      />

      <div className="text-center p-8 mt-8 bg-blue-50 border border-blue-200 rounded-xl">
        <h3 className="text-2xl font-bold text-blue-900 mb-2">
          🗓️ Novas Transmissões em Breve
        </h3>
        <p className="text-blue-700 max-w-xl mx-auto">
          Nossa agenda é atualizada constantemente. Estamos sempre acompanhando a confirmação dos próximos dias de transmissão para trazer a informação mais precisa para você. Volte em breve!
        </p>
      </div>
    </div>
  );
}