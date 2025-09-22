import React from "react";
import fs from "fs/promises";
import path from "path";
import JogoListClient from "./components/JogoListClient";

// Tipos
type JogoSemana = { id: number; data: string; campeonato: string; time1: string; time2: string; hora: string; canal: string; divisao?: string; fase?: string; };
type CompeticaoInfo = { nome: string; prioridade: number; bandeiraEmoji: string; ativo: boolean; };

export const revalidate = 3600; 

async function carregarDadosDosJogos() {
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
    const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' });
    const hojeStr = formatter.format(agora);

    const amanhaDate = new Date();
    amanhaDate.setUTCDate(amanhaDate.getUTCDate() + 1);
    const amanhaStr = formatter.format(amanhaDate);

    const hojeDateObj = new Date(hojeStr + 'T12:00:00Z');
    const amanhaDateObj = new Date(amanhaStr + 'T12:00:00Z');

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

    return { jogosHojePorCampeonato, jogosAmanhaPorCampeonato, campeonatosDisponiveis, competicoesAtivas, hojeDate: hojeDateObj, amanhaDate: amanhaDateObj };

  } catch (error) {
    console.error("🚨 ERRO AO CARREGAR DADOS DOS JOGOS:", error);
    return { jogosHojePorCampeonato: {}, jogosAmanhaPorCampeonato: {}, campeonatosDisponiveis: [], competicoesAtivas: {}, hojeDate: new Date(), amanhaDate: new Date() };
  }
}

export default async function Home() {
  const { 
    jogosHojePorCampeonato, 
    jogosAmanhaPorCampeonato, 
    campeonatosDisponiveis, 
    competicoesAtivas,
    hojeDate,
    amanhaDate
  } = await carregarDadosDosJogos();

  // MUDANÇA: O objeto 'helpers' agora só passa as datas, não a função
  const helpers = {
    hoje: hojeDate,
    amanha: amanhaDate,
  };

  return (
    <div className="space-y-8">
      <div className="text-center py-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Onde Assistir Esportes Ao Vivo
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-6">
          Não perca nenhum lance!
        </p>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-6">
          A melhor agenda dos seus esportes favoritos está aqui!
        </p>
      </div>

      <JogoListClient 
        jogosHoje={jogosHojePorCampeonato}
        jogosAmanha={jogosAmanhaPorCampeonato}
        campeonatosDisponiveis={campeonatosDisponiveis}
        competicoesAtivas={competicoesAtivas}
        helpers={helpers} 
      />
    </div>
  );
}