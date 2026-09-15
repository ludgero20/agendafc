// app/api/admin/jogos-disponiveis/route.ts
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic';

export type JogoDisponivel = {
  id: number;
  data: string;
  dataLabel: 'hoje' | 'amanha';
  hora: string;
  campeonato: string;
  time1: string;
  time2: string;
  canal: string;
  divisao?: string;
  fase?: string;
};

// Leitor do Google Sheets (mesma lógica da Home)
async function getJogosDoGoogleSheets(): Promise<any[]> {
  try {
    const sheetUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTwHo7TJfy9fGtuczQ5P-g6ukgbtpnXNXZuqnJsbriIG4Wox6f-uow2avY2GYM7b5zxxl0Al_SMI4PE/pub?gid=0&single=true&output=tsv";
    const res = await fetch(sheetUrl, { cache: 'no-store' });
    if (!res.ok) return [];

    const tsvText = await res.text();
    const linhas = tsvText.split('\n').map(l => l.trim()).filter(Boolean);
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
        time1: time1?.trim() || '',
        time2: time2?.trim() || '',
        divisao: divisao?.trim() || undefined,
        fase: fase?.trim() || undefined,
      };
    });
  } catch (error) {
    console.error("Erro ao ler Google Sheets:", error);
    return [];
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const senha = searchParams.get('senha');

    const senhaCorreta = process.env.ADMIN_PASSWORD;
    if (!senhaCorreta || senha !== senhaCorreta) {
      return NextResponse.json({ success: false, error: 'Acesso negado: Senha incorreta.' }, { status: 401 });
    }

    const jogosPath = path.join(process.cwd(), 'public', 'jogos.json');
    const jogosManuaisPath = path.join(process.cwd(), 'public', 'jogos_manuais.json');

    const [jogosFile, jogosManuaisFile, jogosDoSheets] = await Promise.all([
      fs.readFile(jogosPath, 'utf-8').catch(() => '{"jogosSemana": []}'),
      fs.readFile(jogosManuaisPath, 'utf-8').catch(() => '{"jogosSemana": []}'),
      getJogosDoGoogleSheets()
    ]);

    const jogosData = JSON.parse(jogosFile);
    const jogosManuaisData = JSON.parse(jogosManuaisFile);

    const agora = new Date();
    const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' });
    const hojeStr = formatter.format(agora).trim();

    const amanhaDate = new Date(agora);
    amanhaDate.setDate(amanhaDate.getDate() + 1);
    const amanhaStr = formatter.format(amanhaDate).trim();

    const todosOsJogosBrutos = [
      ...(jogosData.jogosSemana || (Array.isArray(jogosData) ? jogosData : [])),
      ...(jogosManuaisData.jogosSemana || (Array.isArray(jogosManuaisData) ? jogosManuaisData : [])),
      ...jogosDoSheets
    ];

    const jogosFiltrados: JogoDisponivel[] = [];

    for (let i = 0; i < todosOsJogosBrutos.length; i++) {
      const jogo = todosOsJogosBrutos[i];
      if (!jogo) continue;

      let d = (jogo.data || '').trim();
      if (d.includes('/')) {
        const partes = d.split('/');
        if (partes.length === 3) {
          d = `${partes[2]}-${partes[1].padStart(2, '0')}-${partes[0].padStart(2, '0')}`;
        }
      }

      let dataLabel: 'hoje' | 'amanha' | null = null;
      if (d === hojeStr) dataLabel = 'hoje';
      else if (d === amanhaStr) dataLabel = 'amanha';

      if (!dataLabel) continue;

      const time1 = (jogo.time1 || '').trim();
      const time2 = (jogo.time2 || '').trim();
      if (!time1 || !time2) continue;

      let hora = (jogo.hora || '').trim().toLowerCase().replace(':', 'h');
      if (/^\d{1,2}h$/.test(hora)) hora = hora.replace('h', 'h00');
      if (/^\d{1}h/.test(hora)) hora = '0' + hora;

      jogosFiltrados.push({
        id: jogo.id || (80000 + i),
        data: d,
        dataLabel,
        hora,
        campeonato: (jogo.campeonato || '').trim(),
        canal: (jogo.canal || '').trim(),
        time1,
        time2,
        divisao: jogo.divisao || undefined,
        fase: jogo.fase || undefined
      });
    }

    // Ordenação por data e horário
    jogosFiltrados.sort((a, b) => a.data.localeCompare(b.data) || a.hora.localeCompare(b.hora));

    // Desduplicação inteligente
    const jogosUnicos = jogosFiltrados.filter((j, index, array) => {
      const chave = `${j.data}-${j.time1.toLowerCase()}-${j.time2.toLowerCase()}`;
      return index === array.findIndex(x => `${x.data}-${x.time1.toLowerCase()}-${x.time2.toLowerCase()}` === chave);
    });

    const hojeJogos = jogosUnicos.filter(j => j.dataLabel === 'hoje');
    const amanhaJogos = jogosUnicos.filter(j => j.dataLabel === 'amanha');

    return NextResponse.json({
      success: true,
      hojeStr,
      amanhaStr,
      total: jogosUnicos.length,
      jogos: {
        hoje: hojeJogos,
        amanha: amanhaJogos
      }
    });

  } catch (error: any) {
    console.error("Erro ao carregar jogos disponíveis:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
