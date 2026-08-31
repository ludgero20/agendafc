import React from 'react';
import fs from 'fs/promises';
import path from 'path';
import SemanaListClient from '../components/SemanaListClient';

export const revalidate = 3600;

// ⚙️ CONFIGURE AQUI: Quantos dias para frente a página deve mostrar (ex: 5 dias a partir de hoje)
const DIAS_A_EXIBIR = 5;

// Tipos 100% alinhados com o SemanaListClient
type JogoSemana = {
  id: number;
  data: string;
  campeonato: string;
  hora: string;
  canal: string;
  time1?: string | null;
  time2?: string | null;
  divisao?: string;
  fase?: string;
  evento_nome?: string | null;
  evento_descricao?: string | null;
};

type CompeticaoInfo = { 
  nome: string; 
  prioridade: number; 
  bandeiraEmoji: string; 
  ativo: boolean; 
};

// 📱 LEITOR DA PLANILHA NO GOOGLE SHEETS
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
    console.error("Erro ao ler Google Sheets na semana:", error);
    return [];
  }
}

async function carregarDadosDaSemana() {
  try {
    const competicoesPath = path.join(process.cwd(), "public", "competicoes-unificadas.json");
    const jogosPath = path.join(process.cwd(), "public", "jogos.json");
    const jogosManuaisPath = path.join(process.cwd(), "public", "jogos_manuais.json");
    const f1Path = path.join(process.cwd(), "public", "importacoes-manuais", "f1", "calendario.json");

    // Lê os 4 arquivos e a planilha em paralelo
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

    // Converte sessões da F1
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

    const listaCompeticoes = competicoesData.competicoes || (Array.isArray(competicoesData) ? competicoesData : []);
    const competicoesAtivas: Record<string, CompeticaoInfo> = 
      listaCompeticoes.reduce((acc: Record<string, CompeticaoInfo>, comp: CompeticaoInfo) => {
        if (comp.ativo) acc[comp.nome] = comp;
        return acc;
      }, {});

    // 📅 CÁLCULO DA DATA DE HOJE E DA DATA LIMITE (Fuso de Brasília)
    const agora = new Date();
    const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' });
    const hojeStr = formatter.format(agora).trim(); // ex: "2026-08-31"

    // Calcula a data limite somando DIAS_A_EXIBIR dias
    const dataLimite = new Date(agora);
    dataLimite.setDate(dataLimite.getDate() + DIAS_A_EXIBIR);
    const limiteStr = formatter.format(dataLimite).trim(); // ex: "2026-09-05"

    const listaJogosIA = jogosData.jogosSemana || (Array.isArray(jogosData) ? jogosData : []);
    const listaJogosManuais = jogosManuaisData.jogosSemana || (Array.isArray(jogosManuaisData) ? jogosManuaisData : []);

    const todosOsJogosBrutos = [
      ...listaJogosIA,
      ...listaJogosManuais,
      ...jogosDoSheets,
      ...sessoesF1ComoJogos
    ];

    // 🎯 FILTRAGEM: Apenas jogos entre HOJE e a DATA LIMITE
    const jogosDaSemanaFiltrados: JogoSemana[] = todosOsJogosBrutos
      .map((jogo: any) => {
        let d = (jogo.data || '').trim();
        if (d.includes('/')) {
          const partes = d.split('/');
          if (partes.length === 3) {
            d = `${partes[2]}-${partes[1].padStart(2, '0')}-${partes[0].padStart(2, '0')}`;
          }
        }

        return {
          id: jogo.id || Math.floor(Math.random() * 100000),
          data: d,
          hora: (jogo.hora || '').trim(),
          campeonato: (jogo.campeonato || '').trim(),
          canal: (jogo.canal || '').trim(),
          time1: jogo.time1 !== undefined ? jogo.time1 : null,
          time2: jogo.time2 !== undefined ? jogo.time2 : null,
          divisao: jogo.divisao || undefined,
          fase: jogo.fase || undefined,
          evento_nome: jogo.evento_nome || null,
          evento_descricao: jogo.evento_descricao || null
        };
      })
      // 🌟 O FILTRO PRINCIPAL: Maior ou igual a hoje E Menor ou igual ao limite
      .filter(jogo => Boolean(jogo.data) && jogo.data >= hojeStr && jogo.data <= limiteStr);

    const campeonatosDisponiveis = [...new Set(jogosDaSemanaFiltrados.map(j => j.campeonato))].filter(Boolean).sort();

    // Agrupa por Data e Campeonato
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
          Acompanhe a programação completa de jogos de futebol, NFL e as corridas de Fórmula 1 para os próximos dias. Veja todos os horários e canais de transmissão para não perder nada.
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