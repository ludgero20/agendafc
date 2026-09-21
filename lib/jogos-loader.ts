// lib/jogos-loader.ts
import fs from 'fs/promises';
import path from 'path';
import {
  JogoItem,
  gerarSlugJogo,
  slugify,
  formatarDataParaSlug,
} from './jogos-slug';

export * from './jogos-slug';

// 📱 Leitor do Google Sheets (mesma fonte usada na Home)
async function getJogosDoGoogleSheets(): Promise<JogoItem[]> {
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
      const [data, hora, campeonato, time1, time2, canal, divisao, fase, evento_nome, evento_descricao] =
        colunas;

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
    console.error('Erro ao ler Google Sheets em lib/jogos-loader:', error);
    return [];
  }
}

// 📦 Carrega todos os jogos combinando arquivos locais e Google Sheets
export async function carregarTodosOsJogos(): Promise<JogoItem[]> {
  try {
    const jogosPath = path.join(process.cwd(), 'public', 'jogos.json');
    const jogosManuaisPath = path.join(process.cwd(), 'public', 'jogos_manuais.json');

    const [jogosFile, jogosManuaisFile, jogosDoSheets] = await Promise.all([
      fs.readFile(jogosPath, 'utf-8').catch(() => '{"jogosSemana": []}'),
      fs.readFile(jogosManuaisPath, 'utf-8').catch(() => '{"jogosSemana": []}'),
      getJogosDoGoogleSheets(),
    ]);

    const jogosData = JSON.parse(jogosFile);
    const jogosManuaisData = JSON.parse(jogosManuaisFile);

    const listaJogosIA: any[] =
      jogosData.jogosSemana || (Array.isArray(jogosData) ? jogosData : []);
    const listaJogosManuais: any[] =
      jogosManuaisData.jogosSemana || (Array.isArray(jogosManuaisData) ? jogosManuaisData : []);

    const todosOsJogosBrutos = [...listaJogosIA, ...listaJogosManuais, ...jogosDoSheets];

    const jogosFormatados: JogoItem[] = todosOsJogosBrutos
      .map((jogo: any, index: number) => {
        let d = (jogo.data || '').trim();
        if (d.includes('/')) {
          const partes = d.split('/');
          if (partes.length === 3) {
            d = `${partes[2]}-${partes[1].padStart(2, '0')}-${partes[0].padStart(2, '0')}`;
          }
        }

        return {
          id: jogo.id || 80000 + index,
          data: d,
          hora: (jogo.hora || '').replace(':', 'h').trim(),
          campeonato: (jogo.campeonato || '').trim(),
          canal: (jogo.canal || '').trim(),
          time1: jogo.time1 !== undefined ? jogo.time1 : null,
          time2: jogo.time2 !== undefined ? jogo.time2 : null,
          divisao: jogo.divisao || undefined,
          fase: jogo.fase || undefined,
          pais: jogo.pais || undefined,
          evento_nome: jogo.evento_nome || null,
          evento_descricao: jogo.evento_descricao || null,
        };
      })
      .filter((j) => Boolean(j.data) && Boolean(j.time1) && Boolean(j.time2));

    return jogosFormatados;
  } catch (error) {
    console.error('Erro ao carregar jogos em lib/jogos-loader:', error);
    return [];
  }
}

// 🔍 Localiza um jogo a partir do slug
export async function buscarJogoPorSlug(slug: string): Promise<JogoItem | null> {
  if (!slug) return null;
  const jogos = await carregarTodosOsJogos();

  // 1. Busca exata pelo slug gerado
  for (const jogo of jogos) {
    if (gerarSlugJogo(jogo) === slug) {
      return jogo;
    }
  }

  // 2. Busca flexível (caso o slug venha sem sufixo ou pequenas variações)
  const slugLimpo = slug.replace(/-onde-assistir-ao-vivo$/, '');
  for (const jogo of jogos) {
    const slugBase = gerarSlugJogo(jogo).replace(/-onde-assistir-ao-vivo$/, '');
    if (slugBase === slugLimpo) {
      return jogo;
    }
  }

  return null;
}

// 🚀 Retorna lista de jogos ativos e seus slugs para pre-renderização e sitemap
export async function gerarSlugsJogosAtivos(): Promise<{ slug: string; jogo: JogoItem }[]> {
  const jogos = await carregarTodosOsJogos();
  const mapaSlugs = new Map<string, { slug: string; jogo: JogoItem }>();

  for (const jogo of jogos) {
    const slug = gerarSlugJogo(jogo);
    if (slug && !mapaSlugs.has(slug)) {
      mapaSlugs.set(slug, { slug, jogo });
    }
  }

  return Array.from(mapaSlugs.values());
}

