import React from "react";
import fs from "fs/promises";
import path from "path";
import JogoListClient from "./components/JogoListClient";

// ... Seus tipos (JogoSemana, CompeticaoInfo) continuam aqui ...
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
type CompeticaoInfo = { nome: string; prioridade: number; bandeiraEmoji: string; ativo: boolean; };

// A função de carregamento de dados continua a mesma
async function carregarDadosDosJogos() {
  try {
    // Carrega os dois JSONs em paralelo
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

    // Lógica de datas (no servidor)
    const agora = new Date();
    const hojeDate = new Date(agora.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
    const amanhaDate = new Date(hojeDate);
    amanhaDate.setDate(hojeDate.getDate() + 1);

    const hojeStr = hojeDate.toISOString().split('T')[0];
    const amanhaStr = amanhaDate.toISOString().split('T')[0];

    const todosOsJogos: JogoSemana[] = jogosData.jogosSemana || [];

    const jogosDeHoje = todosOsJogos.filter(jogo => jogo.data === hojeStr);
    const jogosDeAmanha = todosOsJogos.filter(jogo => jogo.data === amanhaStr);

    const agruparJogos = (jogos: JogoSemana[]) => {
      return jogos.reduce((acc: Record<string, JogoSemana[]>, jogo: JogoSemana) => {
        const chave = jogo.divisao ? `${jogo.campeonato}_${jogo.divisao}` : jogo.campeonato;
        if (!acc[chave]) acc[chave] = [];
        acc[chave].push(jogo);
        return acc;
      }, {});
    };

    const jogosHojePorCampeonato = agruparJogos(jogosDeHoje);
    const jogosAmanhaPorCampeonato = agruparJogos(jogosDeAmanha);

    Object.values(jogosHojePorCampeonato).forEach(grupo => grupo.sort((a, b) => a.hora.localeCompare(b.hora)));
    Object.values(jogosAmanhaPorCampeonato).forEach(grupo => grupo.sort((a, b) => a.hora.localeCompare(b.hora)));

    const campeonatosDisponiveis = [...new Set([...jogosDeHoje, ...jogosDeAmanha].map(j => j.campeonato))].sort();

    // Este é o retorno em caso de SUCESSO
    return { jogosHojePorCampeonato, jogosAmanhaPorCampeonato, campeonatosDisponiveis, competicoesAtivas, hojeDate, amanhaDate };

  } catch (error) {
    console.error("🚨 ERRO AO CARREGAR DADOS NO SERVIDOR:", error);

    return {
      jogosHojePorCampeonato: {},
      jogosAmanhaPorCampeonato: {},
      campeonatosDisponiveis: [],
      competicoesAtivas: {},
      hojeDate: new Date(),
      amanhaDate: new Date()
    };
  }
}

export default async function Home() {
  const { 
    jogosHojePorCampeonato, 
    jogosAmanhaPorCampeonato, 
    campeonatosDisponiveis, 
    competicoesAtivas,
  } = await carregarDadosDosJogos();

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center py-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Jogos de Hoje na TV: Onde Assistir Futebol e NFL ao Vivo
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-6">
          Confira a agenda completa de jogos para hoje e amanhã. Saiba os horários e canais de transmissão para não perder nenhum lance do seu time.
        </p>
      </div>

      {/* Passamos os dados brutos, incluindo 'competicoesAtivas' */}
      <JogoListClient 
        jogosHoje={jogosHojePorCampeonato}
        jogosAmanha={jogosAmanhaPorCampeonato}
        campeonatosDisponiveis={campeonatosDisponiveis}
        competicoesAtivas={competicoesAtivas} 
      />
    </div>
  );
}