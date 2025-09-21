import React from 'react';
import fs from 'fs/promises';
import path from 'path';
import SemanaListClient from '../components/SemanaListClient';
export const revalidate = 3600;

// Tipos
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

// Função de carregamento de dados (roda no servidor)
async function carregarDadosDaSemana() {
  try {
    const competicoesPath = path.join(process.cwd(), "public", "competicoes-unificadas.json");
    const jogosPath = path.join(process.cwd(), "public", "jogos.json");

    const [competicoesFile, jogosFile] = await Promise.all([
      fs.readFile(competicoesPath, "utf-8"),
      fs.readFile(jogosPath, "utf-8"),
    ]);

    const competicoesData = JSON.parse(competicoesFile);
    const jogosData = JSON.parse(jogosFile);

    const competicoesAtivas: Record<string, CompeticaoInfo> = 
      competicoesData.competicoes.reduce((acc: Record<string, CompeticaoInfo>, comp: CompeticaoInfo) => {
        if (comp.ativo) acc[comp.nome] = comp;
        return acc;
      }, {});

    const agora = new Date();
    const hojeDate = new Date(agora.toLocaleString("en-US", {timeZone: "America/Sao_Paulo"}));
    const hojeStr = hojeDate.toISOString().split('T')[0];

    const todosOsJogos: JogoSemana[] = jogosData.jogosSemana || [];

    const jogosDaSemanaFiltrados = todosOsJogos
      .map(jogo => ({...jogo, data: jogo.data.includes('/') ? `${hojeDate.getFullYear()}-${jogo.data.split('/')[1]}-${jogo.data.split('/')[0]}` : jogo.data }))
      .filter(jogo => jogo.data >= hojeStr);

    const campeonatosDisponiveis = [...new Set(jogosDaSemanaFiltrados.map(j => j.campeonato))].sort();

    const jogosPorData = jogosDaSemanaFiltrados.reduce((acc, jogo) => {
      const data = jogo.data;
      if (!acc[data]) acc[data] = {};
      const chave = jogo.divisao ? `${jogo.campeonato}_${jogo.divisao}` : jogo.campeonato;
      if (!acc[data][chave]) acc[data][chave] = [];
      acc[data][chave].push(jogo);
      return acc;
    }, {} as Record<string, Record<string, JogoSemana[]>>);

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

// A página da semana agora é um Server Component
export default async function Semana() {
  const { jogosPorData, campeonatosDisponiveis, competicoesAtivas } = await carregarDadosDaSemana();

  return (
    <div className="space-y-8">
      {/* Hero Section Otimizada para SEO */}
      <div className="text-center py-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Agenda da Semana: Programação de Jogos na TV
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Confira todos os jogos de futebol e da NFL programados para os próximos dias, com horários e canais de transmissão para você não perder nada.
        </p>
      </div>

      {/* O componente de cliente renderiza a parte interativa */}
      <SemanaListClient
        jogosPorDataIniciais={jogosPorData}
        campeonatosDisponiveis={campeonatosDisponiveis}
        competicoesAtivas={competicoesAtivas}
      />
      {/* ===== Bloco de Mensagem Final ===== */}
      <div className="text-center p-8 mt-8 bg-blue-50 border border-blue-200 rounded-xl">
        <h3 className="text-2xl font-bold text-blue-900 mb-2">
          🗓️ Novas Transmissões em Breve
        </h3>
        <p className="text-blue-700 max-w-xl mx-auto">
          Nossa agenda é atualizada constantemente. Estamos sempre aguardando a confirmação dos próximos dias de transmissão para trazer a informação mais precisa para você. Volte em breve!
        </p>
      </div>
      
    </div>
  );
}