// lib/jogos-slug.ts
// Utilitários puros e isomorfos (podem ser usados no cliente e no servidor)

export type JogoItem = {
  id: number;
  data: string;
  campeonato: string;
  hora: string;
  canal: string;
  time1?: string | null;
  time2?: string | null;
  divisao?: string;
  fase?: string;
  pais?: string;
  evento_nome?: string | null;
  evento_descricao?: string | null;
};

// 🔤 Converte texto em formato URL-friendly
export function slugify(texto: string): string {
  if (!texto) return '';
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// 📅 Converte datas (YYYY-MM-DD ou DD/MM/YYYY) para DD-MM-YYYY
export function formatarDataParaSlug(dataStr: string): string {
  if (!dataStr) return '';
  const limpo = dataStr.trim();
  if (limpo.includes('/')) {
    const partes = limpo.split('/');
    if (partes.length === 3) {
      const dia = partes[0].padStart(2, '0');
      const mes = partes[1].padStart(2, '0');
      const ano = partes[2];
      return `${dia}-${mes}-${ano}`;
    }
  }
  if (limpo.includes('-')) {
    const partes = limpo.split('-');
    if (partes.length === 3) {
      if (partes[0].length === 4) {
        // YYYY-MM-DD -> DD-MM-YYYY
        const ano = partes[0];
        const mes = partes[1].padStart(2, '0');
        const dia = partes[2].padStart(2, '0');
        return `${dia}-${mes}-${ano}`;
      }
      return `${partes[0].padStart(2, '0')}-${partes[1].padStart(2, '0')}-${partes[2]}`;
    }
  }
  return slugify(limpo);
}

// 🔗 Gera o slug canônico do confronto: [time1]-x-[time2]-[data]-onde-assistir-ao-vivo
export function gerarSlugJogo(jogo: {
  time1?: string | null;
  time2?: string | null;
  data: string;
}): string {
  if (!jogo.time1 || !jogo.time2 || !jogo.data) return '';
  const t1 = slugify(jogo.time1);
  const t2 = slugify(jogo.time2);
  const data = formatarDataParaSlug(jogo.data);
  return `${t1}-x-${t2}-${data}-onde-assistir-ao-vivo`;
}

