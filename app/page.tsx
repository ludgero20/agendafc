import React from "react";
import fs from "fs/promises";
import path from "path";
import JogoListClient from "./components/JogoListClient";

// Tipos
type JogoSemana = { 
  id: number; 
  data: string; 
  campeonato: string; 
  time1: string | null; 
  time2: string | null; 
  hora: string; 
  canal: string; 
  divisao?: string; 
  fase?: string; 
  evento_nome?: string | null; 
  evento_descricao?: string | null; 
};

type CompeticaoInfo = { nome: string; prioridade: number; bandeiraEmoji: string; ativo: boolean; };

export const revalidate = 3600; 

// 📱 LEITOR DA PLANILHA DO GOOGLE SHEETS
async function getJogosDoGoogleSheets(): Promise<JogoSemana[]> {
  try {
    const sheetUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTwHo7TJfy9fGtuczQ5P-g6ukgbtpnXNXZuqnJsbriIG4Wox6f-uow2avY2GYM7b5zxxl0Al_SMI4PE/pub?gid=0&single=true&output=tsv";
    const res = await fetch(sheetUrl, { next: { revalidate: 3600 } });
    if (!res.ok) return [];

    const tsvText = await res.text();
    const linhas = tsvText.split('\n').map(l => l.trim()).filter(Boolean);
    if (linhas.length <= 1) return [];

    return linhas.slice(1).map((linha, index) => {
      const colunas = linha.split('\t');
      const [data, hora, campeonato, time1, time2, canal, divisao, fase, evento_nome, evento_descricao] = colunas;

      let dataNormalizada = (data || '').trim();
      if (dataNormalizada.includes('/')) {
        const partes = dataNormalizada.split('/');
        if (partes.length === 3) {
          dataNormalizada = `${partes[2]}-${partes[1].padStart(2, '0')}-${partes[0].padStart(2, '0')}`;
        }
      }

      return {
        id: 70000 + index,
        data: dataNormalizada,
        hora: (hora || '').replace(':', 'h').trim(),
        campeonato: (campeonato || '').trim(),
        canal: (canal || '').trim(),
        time1: time1?.trim() || null,
        time2: time2?.trim() || null,
        divisao: divisao?.trim() || undefined,
        fase: fase?.trim() || undefined,
        evento_nome: evento_nome?.trim() || null,
        evento_descricao: evento_descricao?.trim() || null,
      };
    });
  } catch (error) {
    console.error("Erro ao ler Google Sheets:", error);
    return [];
  }
}

async function carregarDadosDosJogos() {
  try {
    const competicoesPath = path.join(process.cwd(), "public", "competicoes-unificadas.json");
    const jogosPath = path.join(process.cwd(), "public", "jogos.json");
    const jogosManuaisPath = path.join(process.cwd(), "public", "jogos_manuais.json");
    const f1Path = path.join(process.cwd(), "public", "importacoes-manuais", "f1", "calendario.json");

    const [competicoesFile, jogosFile, jogosManuaisFile, f1File, jogosDoSheets] = await Promise.all([
      fs.readFile(competicoesPath, "utf-8").catch(() => '{"competicoes": []}'),
      fs.readFile(jogosPath, "utf-8").catch(() => '{"jogosSemana": []}'),
      fs.readFile(jogosManuaisPath, "utf-8").catch(() => '{"jogosSemana": []}'),
      fs.readFile(f1Path, "utf-8").catch(() => '[]'),
      getJogosDoGoogleSheets()
    ]);

    const competicoesData = JSON.parse(competicoesFile);
    const jogosData = JSON.parse(jogosFile);
    const jogosManuaisData = JSON.parse(jogosManuaisFile);
    const f1Data = JSON.parse(f1File);

    const sessoesF1ComoJogos: JogoSemana[] = (Array.isArray(f1Data) ? f1Data : []).flatMap((gp: any, gpIndex: number) => 
      (gp.sessoes || []).map((sessao: any, sessaoIndex: number) => ({
        id: 90000 + (gpIndex * 10) + sessaoIndex,
        data: (sessao.data || '').trim(),
        hora: (sessao.hora || '').replace(':', 'h').trim(),
        campeonato: "Fórmula 1",
        canal: Array.isArray(sessao.transmissao) ? sessao.transmissao.join(', ') : (sessao.transmissao || ''),
        time1: null,
        time2: null,
        divisao: undefined,
        fase: undefined,
        evento_nome: sessao.nome,
        evento_descricao: gp.raceName
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

    const amanhaDate = new Date();
    amanhaDate.setUTCDate(amanhaDate.getUTCDate() + 1);
    const amanhaStr = formatter.format(amanhaDate);

    const hojeDateObj = new Date(hojeStr + 'T12:00:00Z');
    const amanhaDateObj = new Date(amanhaStr + 'T12:00:00Z');

    const todosOsJogosBrutos = [
      ...(jogosData.jogosSemana || (Array.isArray(jogosData) ? jogosData : [])),
      ...(jogosManuaisData.jogosSemana || (Array.isArray(jogosManuaisData) ? jogosManuaisData : [])),
      ...jogosDoSheets,
      ...sessoesF1ComoJogos
    ];

    const todosOsJogos: JogoSemana[] = todosOsJogosBrutos.map((jogo: any) => ({
      id: jogo.id || Math.floor(Math.random() * 100000),
      data: (jogo.data || '').trim(),
      hora: (jogo.hora || '').trim(),
      campeonato: (jogo.campeonato || '').trim(),
      canal: (jogo.canal || '').trim(),
      time1: jogo.time1 !== undefined ? jogo.time1 : null,
      time2: jogo.time2 !== undefined ? jogo.time2 : null,
      divisao: jogo.divisao || undefined,
      fase: jogo.fase || undefined,
      evento_nome: jogo.evento_nome || null,
      evento_descricao: jogo.evento_descricao || null,
    }));

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

    return { 
      jogosHojePorCampeonato, 
      jogosAmanhaPorCampeonato, 
      campeonatosDisponiveis, 
      competicoesAtivas, 
      hojeDate: hojeDateObj, 
      amanhaDate: amanhaDateObj 
    };

  } catch (error) {
    console.error("🚨 ERRO AO CARREGAR DADOS DOS JOGOS:", error);
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
    hojeDate,
    amanhaDate
  } = await carregarDadosDosJogos();

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