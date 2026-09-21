// lib/escudos-helper.ts
import { timesConfig, nomesTimesBrasil } from './times';

// Normaliza strings para busca sem acentos e minúsculas
export function normalizar(texto: string): string {
  return (texto || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

// Gera iniciais limpas (até 3 caracteres) para o fallback
export function extrairIniciais(nome: string): string {
  if (!nome) return 'TIM';
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 1) {
    return partes[0].slice(0, 3).toUpperCase();
  }
  if (partes.length === 2) {
    return (partes[0][0] + partes[1].slice(0, 2)).toUpperCase();
  }
  return (partes[0][0] + partes[1][0] + partes[2][0]).toUpperCase();
}

export type EscudoInfo = {
  url: string;
  isFallback: boolean;
  nomeExibicao: string;
  iniciais: string;
};

// 🌎 Dicionário de Escudos Internacionais e Sul-Americanos Populares (URLs estáveis da ESPN e Football-Data)
const escudosInternacionais: Record<string, string> = {
  // Inglaterra (Premier League)
  "tottenham": "https://crests.football-data.org/73.png",
  "tottenham hotspur": "https://crests.football-data.org/73.png",
  "manchester city": "https://crests.football-data.org/65.png",
  "man city": "https://crests.football-data.org/65.png",
  "manchester united": "https://crests.football-data.org/66.png",
  "man united": "https://crests.football-data.org/66.png",
  "chelsea": "https://crests.football-data.org/61.png",
  "newcastle": "https://crests.football-data.org/67.png",
  "aston villa": "https://crests.football-data.org/58.png",

  // Espanha (La Liga)
  "real madrid": "https://crests.football-data.org/86.png",
  "barcelona": "https://crests.football-data.org/81.png",
  "atletico de madrid": "https://crests.football-data.org/78.png",
  "atletico madrid": "https://crests.football-data.org/78.png",
  "sevilla": "https://crests.football-data.org/559.png",

  // Alemanha (Bundesliga)
  "bayern de munique": "https://crests.football-data.org/5.png",
  "bayern": "https://crests.football-data.org/5.png",
  "borussia dortmund": "https://crests.football-data.org/4.png",
  "dortmund": "https://crests.football-data.org/4.png",
  "bayer leverkusen": "https://crests.football-data.org/3.png",
  "leverkusen": "https://crests.football-data.org/3.png",

  // Itália (Serie A)
  "juventus": "https://crests.football-data.org/109.png",
  "inter de milao": "https://crests.football-data.org/108.png",
  "internazionale": "https://crests.football-data.org/108.png",
  "milan": "https://crests.football-data.org/98.png",
  "ac milan": "https://crests.football-data.org/98.png",
  "roma": "https://crests.football-data.org/100.png",
  "napoli": "https://crests.football-data.org/113.png",

  // França
  "psg": "https://crests.football-data.org/524.png",
  "paris saint-germain": "https://crests.football-data.org/524.png",

  // Argentina (Libertadores e Sul-Americana)
  "boca juniors": "https://a.espncdn.com/i/teamlogos/soccer/500/5.png",
  "boca": "https://a.espncdn.com/i/teamlogos/soccer/500/5.png",
  "river plate": "https://a.espncdn.com/i/teamlogos/soccer/500/16.png",
  "river": "https://a.espncdn.com/i/teamlogos/soccer/500/16.png",
  "racing": "https://a.espncdn.com/i/teamlogos/soccer/500/15.png",
  "racing club": "https://a.espncdn.com/i/teamlogos/soccer/500/15.png",
  "independiente": "https://a.espncdn.com/i/teamlogos/soccer/500/9.png",
  "san lorenzo": "https://a.espncdn.com/i/teamlogos/soccer/500/17.png",
  "velez sarsfield": "https://a.espncdn.com/i/teamlogos/soccer/500/20.png",
  "estudiantes": "https://a.espncdn.com/i/teamlogos/soccer/500/7.png",
  "talleres": "https://a.espncdn.com/i/teamlogos/soccer/500/18.png",
  "lanus": "https://a.espncdn.com/i/teamlogos/soccer/500/10.png",
  "platense": "https://a.espncdn.com/i/teamlogos/soccer/500/13.png",
  "defensa y justicia": "https://a.espncdn.com/i/teamlogos/soccer/500/6.png",
  "newells old boys": "https://a.espncdn.com/i/teamlogos/soccer/500/12.png",
  "rosario central": "https://a.espncdn.com/i/teamlogos/soccer/500/14.png",

  // Uruguai
  "penarol": "https://a.espncdn.com/i/teamlogos/soccer/500/6090.png",
  "nacional": "https://a.espncdn.com/i/teamlogos/soccer/500/6089.png",

  // Colômbia
  "santa fe": "https://a.espncdn.com/i/teamlogos/soccer/500/5488.png",
  "independiente santa fe": "https://a.espncdn.com/i/teamlogos/soccer/500/5488.png",
  "atletico nacional": "https://a.espncdn.com/i/teamlogos/soccer/500/3851.png",
  "millonarios": "https://a.espncdn.com/i/teamlogos/soccer/500/3857.png",
  "junior": "https://a.espncdn.com/i/teamlogos/soccer/500/3855.png",
  "junior barranquilla": "https://a.espncdn.com/i/teamlogos/soccer/500/3855.png",
  "america de cali": "https://a.espncdn.com/i/teamlogos/soccer/500/3849.png",

  // Paraguai
  "olimpia": "https://a.espncdn.com/i/teamlogos/soccer/500/4915.png",
  "cerro porteno": "https://a.espncdn.com/i/teamlogos/soccer/500/4914.png",
  "libertad": "https://a.espncdn.com/i/teamlogos/soccer/500/4916.png",

  // Equador
  "ldu": "https://a.espncdn.com/i/teamlogos/soccer/500/4908.png",
  "ldu quito": "https://a.espncdn.com/i/teamlogos/soccer/500/4908.png",
  "independiente del valle": "https://a.espncdn.com/i/teamlogos/soccer/500/4906.png",
  "barcelona sc": "https://a.espncdn.com/i/teamlogos/soccer/500/4907.png",

  // Chile
  "colo-colo": "https://a.espncdn.com/i/teamlogos/soccer/500/3141.png",
  "colo colo": "https://a.espncdn.com/i/teamlogos/soccer/500/3141.png",
  "universidad de chile": "https://a.espncdn.com/i/teamlogos/soccer/500/3144.png",
  "universidad catolica": "https://a.espncdn.com/i/teamlogos/soccer/500/3143.png",

  // Bolívia
  "bolivar": "https://a.espncdn.com/i/teamlogos/soccer/500/4879.png",
  "the strongest": "https://a.espncdn.com/i/teamlogos/soccer/500/4880.png",

  // Peru
  "alianza lima": "https://a.espncdn.com/i/teamlogos/soccer/500/4924.png",
  "universitario": "https://a.espncdn.com/i/teamlogos/soccer/500/4925.png",
  "sporting cristal": "https://a.espncdn.com/i/teamlogos/soccer/500/4926.png",
};

// Mapeamento pré-calculado para busca O(1)
const indiceTimesPorNome = new Map<string, string>();

// 1. Popula times nacionais e cadastrados no sistema
for (const [slug, time] of Object.entries(timesConfig)) {
  if (time.escudo) {
    indiceTimesPorNome.set(normalizar(time.nome), time.escudo);
    indiceTimesPorNome.set(normalizar(time.nomeOficialAPI), time.escudo);
    indiceTimesPorNome.set(normalizar(slug), time.escudo);
    for (const variacao of time.variacoesNome || []) {
      indiceTimesPorNome.set(normalizar(variacao), time.escudo);
    }
  }
}

// 2. Popula times internacionais adicionais
for (const [nome, url] of Object.entries(escudosInternacionais)) {
  indiceTimesPorNome.set(normalizar(nome), url);
}

// Resolve o escudo do time a partir do nome
export function resolverEscudoTime(nomeBruto: string): EscudoInfo {
  if (!nomeBruto) {
    return {
      url: '',
      isFallback: true,
      nomeExibicao: 'Time',
      iniciais: 'TIM'
    };
  }

  const nomeLimpo = nomeBruto.trim();
  const nomeAmigavel = nomesTimesBrasil[nomeLimpo] || nomeLimpo;
  const normalizado = normalizar(nomeAmigavel);

  // 1. Busca exata no índice
  if (indiceTimesPorNome.has(normalizado)) {
    return {
      url: indiceTimesPorNome.get(normalizado)!,
      isFallback: false,
      nomeExibicao: nomeAmigavel,
      iniciais: extrairIniciais(nomeAmigavel)
    };
  }

  // 2. Busca parcial (ex: "Tottenham Hotspur FC" contém "Tottenham")
  for (const [termo, url] of indiceTimesPorNome.entries()) {
    if ((normalizado.includes(termo) || termo.includes(normalizado)) && termo.length >= 4) {
      return {
        url,
        isFallback: false,
        nomeExibicao: nomeAmigavel,
        iniciais: extrairIniciais(nomeAmigavel)
      };
    }
  }

  // 3. Fallback: sinaliza para a UI renderizar as iniciais em JSX nativo
  return {
    url: '',
    isFallback: true,
    nomeExibicao: nomeAmigavel,
    iniciais: extrairIniciais(nomeAmigavel)
  };
}

/**
 * Encontra a URL do escudo cadastrado para o nome do time/franquia.
 */
export function obterEscudoDoTime(nomeTime: string): string | null {
  const info = resolverEscudoTime(nomeTime);
  return info.url || null;
}

/**
 * Gera um SVG elegante em Data URI com as iniciais do time caso o escudo externo falhe.
 */
export function gerarEscudoFallbackSvg(nomeTime: string): string {
  const limpo = (nomeTime || 'TIME').trim();
  const iniciais = extrairIniciais(limpo);

  // Cores dinâmicas agradáveis baseadas no hash do nome
  const cores = [
    { bg: '#1e293b', border: '#3b82f6', text: '#ffffff' },
    { bg: '#1e1b4b', border: '#6366f1', text: '#ffffff' },
    { bg: '#064e3b', border: '#10b981', text: '#ffffff' },
    { bg: '#701a75', border: '#ec4899', text: '#ffffff' },
    { bg: '#7c2d12', border: '#f97316', text: '#ffffff' },
    { bg: '#172554', border: '#0284c7', text: '#ffffff' },
  ];
  let hash = 0;
  for (let i = 0; i < limpo.length; i++) {
    hash = (hash + limpo.charCodeAt(i) * (i + 1)) % cores.length;
  }
  const tema = cores[hash];

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">
    <circle cx="48" cy="48" r="44" fill="${tema.bg}" stroke="${tema.border}" stroke-width="3"/>
    <text x="48" y="55" dominant-baseline="middle" text-anchor="middle" fill="${tema.text}" font-family="Arial, Helvetica, sans-serif" font-size="28" font-weight="900" letter-spacing="1">${iniciais}</text>
  </svg>`;

  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

/**
 * Retorna o escudo em Base64 pronto para o next/og (Satori).
 * Se a URL externa falhar, responder 403/404 ou demorar mais de 1.8s, cai graciosamente no SVG.
 */
export async function resolverEscudoSeguro(nomeTime: string, urlInformada?: string | null): Promise<string> {
  const url = urlInformada || obterEscudoDoTime(nomeTime);

  if (!url || !url.startsWith('http')) {
    return gerarEscudoFallbackSvg(nomeTime);
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1800);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
      },
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      return gerarEscudoFallbackSvg(nomeTime);
    }

    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const contentType = res.headers.get('content-type') || 'image/png';

    // Se a imagem for SVG vinda de URL externa
    if (contentType.includes('svg')) {
      return `data:image/svg+xml;base64,${buffer.toString('base64')}`;
    }

    return `data:${contentType};base64,${buffer.toString('base64')}`;
  } catch {
    return gerarEscudoFallbackSvg(nomeTime);
  }
}
