// app/api/admin/jogos-estudio/route.ts
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { obterEscudoDoTime } from '@/lib/escudos-helper';

export const dynamic = 'force-dynamic';

export type JogoEstudio = {
  id: string | number;
  data: string;
  hora: string;
  campeonato: string;
  canal: string;
  time1?: string | null;
  time2?: string | null;
  escudo1?: string | null;
  escudo2?: string | null;
  divisao?: string;
  fase?: string;
  evento_nome?: string | null;
  evento_descricao?: string | null;
};

// Leitor do Google Sheets TSV
async function getJogosDoGoogleSheets(): Promise<any[]> {
  try {
    const sheetUrl =
      'https://docs.google.com/spreadsheets/d/e/2PACX-1vTwHo7TJfy9fGtuczQ5P-g6ukgbtpnXNXZuqnJsbriIG4Wox6f-uow2avY2GYM7b5zxxl0Al_SMI4PE/pub?gid=0&single=true&output=tsv';
    const res = await fetch(sheetUrl, { next: { revalidate: 60 } });
    if (!res.ok) return [];

    const tsvText = await res.text();
    const linhas = tsvText.split('\n').map((l) => l.trim()).filter(Boolean);
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
        id: `sheet-${70000 + index}`,
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
  } catch {
    return [];
  }
}

export async function GET() {
  try {
    const jogosPath = path.join(process.cwd(), 'public', 'jogos.json');
    const jogosManuaisPath = path.join(process.cwd(), 'public', 'jogos_manuais.json');
    const f1Path = path.join(process.cwd(), 'public', 'importacoes-manuais', 'f1', 'calendario.json');

    const [jogosFile, jogosManuaisFile, f1File, jogosDoSheets] = await Promise.all([
      fs.readFile(jogosPath, 'utf-8').catch(() => '{"jogosSemana": []}'),
      fs.readFile(jogosManuaisPath, 'utf-8').catch(() => '{"jogosSemana": []}'),
      fs.readFile(f1Path, 'utf-8').catch(() => '[]'),
      getJogosDoGoogleSheets(),
    ]);

    const jogosData = JSON.parse(jogosFile);
    const jogosManuaisData = JSON.parse(jogosManuaisFile);
    const f1Data = JSON.parse(f1File);

    const sessoesF1ComoJogos: any[] = (Array.isArray(f1Data) ? f1Data : []).flatMap((gp: any, gpIndex: number) =>
      (gp.sessoes || []).map((sessao: any, sessaoIndex: number) => ({
        id: `f1-${90000 + gpIndex * 10 + sessaoIndex}`,
        data: (sessao.data || '').trim(),
        hora: (sessao.hora || '').replace(':', 'h').trim(),
        campeonato: 'Fórmula 1',
        canal: Array.isArray(sessao.transmissao) ? sessao.transmissao.join(', ') : sessao.transmissao || '',
        time1: null,
        time2: null,
        divisao: undefined,
        fase: undefined,
        evento_nome: sessao.nome,
        evento_descricao: gp.raceName,
      }))
    );

    const agora = new Date();
    const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' });
    const hojeStr = formatter.format(agora).trim();

    const todosOsJogosBrutos = [
      ...(jogosData.jogosSemana || (Array.isArray(jogosData) ? jogosData : [])),
      ...(jogosManuaisData.jogosSemana || (Array.isArray(jogosManuaisData) ? jogosManuaisData : [])),
      ...jogosDoSheets,
      ...sessoesF1ComoJogos,
    ];

    const jogosProcessados: JogoEstudio[] = todosOsJogosBrutos
      .map((j: any) => {
        let d = (j.data || '').trim();
        if (d.includes('/')) {
          const partes = d.split('/');
          if (partes.length === 3) {
            d = `${partes[2]}-${partes[1].padStart(2, '0')}-${partes[0].padStart(2, '0')}`;
          }
        }

        const time1 = j.time1 ? String(j.time1).trim() : null;
        const time2 = j.time2 ? String(j.time2).trim() : null;

        return {
          id: j.id || `${d}-${time1}-${time2}-${j.hora}`,
          data: d,
          hora: (j.hora || '').trim(),
          campeonato: (j.campeonato || '').trim() || 'Futebol',
          canal: (j.canal || '').trim(),
          time1,
          time2,
          escudo1: time1 ? obterEscudoDoTime(time1) : null,
          escudo2: time2 ? obterEscudoDoTime(time2) : null,
          divisao: j.divisao || undefined,
          fase: j.fase || undefined,
          evento_nome: j.evento_nome || null,
          evento_descricao: j.evento_descricao || null,
        };
      })
      .filter((j) => Boolean(j.data) && j.data >= hojeStr)
      // Remove duplicados de data + times
      .filter((j, idx, arr) => {
        if (j.time1 && j.time2) {
          const key = `${j.data}-${j.time1}-${j.time2}`;
          return idx === arr.findIndex((x) => `${x.data}-${x.time1}-${x.time2}` === key);
        }
        if (j.evento_nome) {
          const key = `${j.data}-${j.campeonato}-${j.evento_nome}-${j.hora}`;
          return idx === arr.findIndex((x) => `${x.data}-${x.campeonato}-${x.evento_nome}-${x.hora}` === key);
        }
        return true;
      })
      .sort((a, b) => a.data.localeCompare(b.data) || a.hora.localeCompare(b.hora));

    const campeonatosSet = new Set<string>();
    jogosProcessados.forEach((j) => {
      if (j.campeonato) campeonatosSet.add(j.campeonato);
    });

    const campeonatos = Array.from(campeonatosSet).sort((a, b) => {
      // Prioridade visual para ligas populares
      const prioridades: Record<string, number> = {
        Brasileirão: 1,
        'Copa do Brasil': 2,
        Libertadores: 3,
        'Premier League': 4,
        'Champions League': 5,
        'La Liga': 6,
        NFL: 7,
        'Fórmula 1': 8,
        'Série B': 9,
        NBA: 10,
      };
      const prioA = prioridades[a] || 50;
      const prioB = prioridades[b] || 50;
      if (prioA !== prioB) return prioA - prioB;
      return a.localeCompare(b);
    });

    return NextResponse.json({
      success: true,
      jogos: jogosProcessados,
      campeonatos,
      total: jogosProcessados.length,
      hoje: hojeStr,
    });
  } catch (error: any) {
    console.error('Erro em jogos-estudio:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

