// lib/services/tv-service.ts
import fs from 'fs/promises';
import path from 'path';
import { TimeConfig } from '@/lib/times';

export type JogoTransmissao = {
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

// 📱 LEITOR DO GOOGLE SHEETS TSV
export async function getJogosDoGoogleSheets(): Promise<JogoTransmissao[]> {
  try {
    const sheetUrl =
      'https://docs.google.com/spreadsheets/d/e/2PACX-1vTwHo7TJfy9fGtuczQ5P-g6ukgbtpnXNXZuqnJsbriIG4Wox6f-uow2avY2GYM7b5zxxl0Al_SMI4PE/pub?gid=0&single=true&output=tsv';
    const res = await fetch(sheetUrl, { next: { revalidate: 3600 } });
    if (!res.ok) return [];

    const tsvText = await res.text();
    const linhas = tsvText.split('\n').map((l) => l.trim()).filter(Boolean);
    if (linhas.length <= 1) return [];

    return linhas.slice(1).map((linha, index) => {
      const colunas = linha.split('\t');
      const [data, hora, campeonato, time1, time2, canal, divisao, fase] = colunas;

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
      };
    });
  } catch {
    return [];
  }
}

// 📺 BUSCA AS TRANSMISSÕES CONFIRMADAS DE UM TIME / FRANQUIA
export async function getJogosTransmissaoDoTime(time: TimeConfig): Promise<JogoTransmissao[]> {
  try {
    const jogosPath = path.join(process.cwd(), 'public/jogos.json');
    const manuaisPath = path.join(process.cwd(), 'public/jogos_manuais.json');

    const [jogosFile, manuaisFile, jogosDoSheets] = await Promise.all([
      fs.readFile(jogosPath, 'utf-8').catch(() => '{"jogosSemana": []}'),
      fs.readFile(manuaisPath, 'utf-8').catch(() => '{"jogosSemana": []}'),
      getJogosDoGoogleSheets(),
    ]);

    const jogosIA = JSON.parse(jogosFile).jogosSemana || [];
    const jogosManuais = JSON.parse(manuaisFile).jogosSemana || [];
    const todos = [...jogosIA, ...jogosManuais, ...jogosDoSheets];

    const agora = new Date();
    const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' });
    const hojeStr = formatter.format(agora).trim();

    return todos
      .map((jogo: any) => {
        let d = (jogo.data || '').trim();
        if (d.includes('/')) {
          const partes = d.split('/');
          if (partes.length === 3) {
            d = `${partes[2]}-${partes[1].padStart(2, '0')}-${partes[0].padStart(2, '0')}`;
          }
        }
        return { ...jogo, data: d };
      })
      .filter((jogo: JogoTransmissao) => {
        if (!jogo.data || jogo.data < hojeStr) return false;
        const time1 = (jogo.time1 || '').toLowerCase();
        const time2 = (jogo.time2 || '').toLowerCase();
        return time.variacoesNome.some((v) => time1.includes(v.toLowerCase()) || time2.includes(v.toLowerCase()));
      })
      .sort((a, b) => a.data.localeCompare(b.data) || a.hora.localeCompare(b.hora))
      .slice(0, 4);
  } catch {
    return [];
  }
}