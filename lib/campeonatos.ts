// lib/campeonatos.ts
export { formatarNomeTime, nomesTimesBrasil } from '@/lib/times';

export type CompeticaoInfo = {
  id: number;
  nome: string;
  slug?: string;
  subtitulo?: string;
  pais: string;
  tipo: string;
  descricao: string;
  prioridade: number;
  ordem?: number;
  ativo: boolean;
  bandeiraEmoji: string;
  codigoAPI?: string;
  espnSlug?: string;
  origemAPI?: 'football-data' | 'espn';
  arquivoStandings?: string;
  arquivoMatches?: string;
};

// Alias de compatibilidade
export type LigaConfig = CompeticaoInfo;

export const todasCompeticoes: CompeticaoInfo[] = [
  // ==========================================
  // LIGAS COM PÁGINAS DEDICADAS
  // ==========================================
  {
    id: 1,
    nome: "Brasileirão",
    slug: "brasileirao",
    subtitulo: "Campeonato Brasileiro Série A",
    pais: "Brasil",
    tipo: "Nacional",
    descricao: "Classificação completa e calendário de rodadas do Campeonato Brasileiro Série A.",
    prioridade: 1,
    ordem: 1,
    ativo: true,
    bandeiraEmoji: "🇧🇷",
    codigoAPI: "BSA",
    origemAPI: "football-data",
    arquivoStandings: "brasileirao-standings.json",
    arquivoMatches: "brasileirao-matches.json"
  },
  {
    id: 15,
    nome: "Série B",
    slug: "serie-b",
    subtitulo: "Campeonato Brasileiro Série B",
    pais: "Brasil",
    tipo: "Nacional",
    descricao: "Tabela de classificação, rodadas e jogos do Campeonato Brasileiro Série B.",
    prioridade: 2,
    ordem: 2,
    ativo: true,
    bandeiraEmoji: "🇧🇷",
    espnSlug: "bra.2",
    origemAPI: "espn"
  },
  {
    id: 2,
    nome: "Premier League",
    slug: "premier-league",
    subtitulo: "Campeonato Inglês",
    pais: "Inglaterra",
    tipo: "Nacional",
    descricao: "Tabela e jogos da liga de futebol mais disputada do mundo.",
    prioridade: 2,
    ordem: 3,
    ativo: true,
    bandeiraEmoji: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
    codigoAPI: "PL",
    origemAPI: "football-data",
    arquivoStandings: "premier-league-standings.json",
    arquivoMatches: "premier-league-matches.json"
  },
  {
    id: 3,
    nome: "La Liga",
    slug: "la-liga",
    subtitulo: "Campeonato Espanhol",
    pais: "Espanha",
    tipo: "Nacional",
    descricao: "Classificação e rodadas da primeira divisão da Espanha com Real Madrid e Barcelona.",
    prioridade: 3,
    ordem: 4,
    ativo: true,
    bandeiraEmoji: "🇪🇸",
    codigoAPI: "PD",
    origemAPI: "football-data",
    arquivoStandings: "la-liga-standings.json",
    arquivoMatches: "la-liga-matches.json"
  },
  {
    id: 4,
    nome: "Champions League",
    slug: "champions-league",
    subtitulo: "Liga dos Campeões da UEFA",
    pais: "Europa",
    tipo: "Continental",
    descricao: "Tabela da maior competição de clubes do futebol mundial.",
    prioridade: 1,
    ordem: 5,
    ativo: true,
    bandeiraEmoji: "🏆",
    codigoAPI: "CL",
    origemAPI: "football-data",
    arquivoStandings: "champions-league-standings.json",
    arquivoMatches: "champions-league-matches.json"
  },
  {
    id: 5,
    nome: "Fórmula 1",
    slug: "f1",
    subtitulo: "Temporada Oficial de F1",
    pais: "Mundial",
    tipo: "Automobilismo",
    descricao: "Calendário oficial com horários de treinos e corridas, classificação de pilotos e equipes.",
    prioridade: 1,
    ordem: 6,
    ativo: true,
    bandeiraEmoji: "🏎️"
  },
  {
    id: 6,
    nome: "NFL",
    slug: "nfl",
    subtitulo: "National Football League",
    pais: "Estados Unidos",
    tipo: "Futebol Americano",
    descricao: "Classificação das 8 divisões da NFL, placares ao vivo e calendário de todas as 18 semanas.",
    prioridade: 2,
    ordem: 7,
    ativo: true,
    bandeiraEmoji: "🏈"
  },
  {
    id: 7,
    nome: "Bundesliga",
    slug: "bundesliga",
    subtitulo: "Campeonato Alemão",
    pais: "Alemanha",
    tipo: "Nacional",
    descricao: "Classificação e calendário do futebol alemão.",
    prioridade: 4,
    ordem: 8,
    ativo: true,
    bandeiraEmoji: "🇩🇪",
    codigoAPI: "BL1",
    origemAPI: "football-data",
    arquivoStandings: "bundesliga-standings.json",
    arquivoMatches: "bundesliga-matches.json"
  },
  {
    id: 8,
    nome: "Serie A",
    slug: "serie-a",
    subtitulo: "Campeonato Italiano",
    pais: "Itália",
    tipo: "Nacional",
    descricao: "Tabela de classificação e jogos da primeira divisão italiana.",
    prioridade: 4,
    ordem: 9,
    ativo: true,
    bandeiraEmoji: "🇮🇹",
    codigoAPI: "SA",
    origemAPI: "football-data",
    arquivoStandings: "serie-a-standings.json",
    arquivoMatches: "serie-a-matches.json"
  },
  {
    id: 9,
    nome: "Ligue 1",
    slug: "ligue-1",
    subtitulo: "Campeonato Francês",
    pais: "França",
    tipo: "Nacional",
    descricao: "Tabela e jogos do campeonato francês.",
    prioridade: 4,
    ordem: 10,
    ativo: true,
    bandeiraEmoji: "🇫🇷",
    codigoAPI: "FL1",
    origemAPI: "football-data",
    arquivoStandings: "ligue-1-standings.json",
    arquivoMatches: "ligue-1-matches.json"
  },
  {
    id: 10,
    nome: "Primeira Liga",
    slug: "primeira-liga",
    subtitulo: "Campeonato Português",
    pais: "Portugal",
    tipo: "Nacional",
    descricao: "Tabela de classificação e rodadas da liga portuguesa com Benfica, Porto e Sporting.",
    prioridade: 4,
    ordem: 11,
    ativo: true,
    bandeiraEmoji: "🇵🇹",
    codigoAPI: "PPL",
    origemAPI: "football-data",
    arquivoStandings: "primeira-liga-standings.json",
    arquivoMatches: "primeira-liga-matches.json"
  },

  // ==========================================
  // COPAS E DEMAIS CAMPEONATOS
  // ==========================================
  {
    id: 11,
    nome: "Copa Libertadores da América",
    slug: "",
    subtitulo: "CONMEBOL Libertadores",
    pais: "América do Sul",
    tipo: "Continental",
    descricao: "A maior glória eterna do futebol sul-americano.",
    prioridade: 1,
    ativo: true,
    bandeiraEmoji: "🏆"
  },
  {
    id: 12,
    nome: "Copa Sul-Americana",
    slug: "",
    subtitulo: "CONMEBOL Sudamericana",
    pais: "América do Sul",
    tipo: "Continental",
    descricao: "A grande conquista continental sul-americana.",
    prioridade: 2,
    ativo: true,
    bandeiraEmoji: "🏆"
  },
  {
    id: 13,
    nome: "Copa do Brasil",
    slug: "",
    subtitulo: "Copa do Brasil",
    pais: "Brasil",
    tipo: "Copa Nacional",
    descricao: "O torneio mais democrático e emocionante do futebol brasileiro.",
    prioridade: 1,
    ativo: true,
    bandeiraEmoji: "🇧🇷"
  },
  {
    id: 16,
    nome: "Copa da Liga Inglesa",
    slug: "",
    subtitulo: "Carabao Cup",
    pais: "Inglaterra",
    tipo: "Copa Nacional",
    descricao: "Copa da Liga Inglesa (Carabao Cup / EFL Cup).",
    prioridade: 3,
    ativo: true,
    bandeiraEmoji: "🏴󠁧󠁢󠁥󠁮󠁧󠁿"
  },
  {
    id: 17,
    nome: "MLS",
    slug: "",
    pais: "Estados Unidos",
    tipo: "Nacional",
    descricao: "Major League Soccer dos Estados Unidos e Canadá.",
    prioridade: 4,
    ativo: true,
    bandeiraEmoji: "🇺🇸"
  },
  {
    id: 18,
    nome: "Saudi Pro League",
    slug: "",
    pais: "Arábia Saudita",
    tipo: "Nacional",
    descricao: "Campeonato Saudita com as superestrelas do futebol mundial.",
    prioridade: 3,
    ativo: true,
    bandeiraEmoji: "🇸🇦"
  },
  {
    id: 19,
    nome: "Campeonato Argentino",
    slug: "",
    pais: "Argentina",
    tipo: "Nacional",
    descricao: "Liga Profissional de Futebol da Argentina com Boca e River.",
    prioridade: 4,
    ativo: true,
    bandeiraEmoji: "🇦🇷"
  },
  {
    id: 20,
    nome: "Campeonato Holandês",
    slug: "",
    pais: "Holanda",
    tipo: "Nacional",
    descricao: "Eredivisie com Ajax, PSV e Feyenoord.",
    prioridade: 4,
    ativo: true,
    bandeiraEmoji: "🇳🇱"
  },
  {
    id: 21,
    nome: "Campeonato Turco",
    slug: "",
    pais: "Turquia",
    tipo: "Nacional",
    descricao: "Süper Lig da Turquia com Galatasaray, Fenerbahçe e Beşiktaş.",
    prioridade: 4,
    ativo: true,
    bandeiraEmoji: "🇹🇷"
  },
  {
    id: 22,
    nome: "Campeonato Mexicano",
    slug: "",
    pais: "México",
    tipo: "Nacional",
    descricao: "Liga MX do México com América, Chivas e Cruz Azul.",
    prioridade: 4,
    ativo: true,
    bandeiraEmoji: "🇲🇽"
  },
  {
    id: 23,
    nome: "Copa da Inglaterra",
    slug: "",
    subtitulo: "FA Cup",
    pais: "Inglaterra",
    tipo: "Copa Nacional",
    descricao: "A mais antiga copa de futebol do planeta.",
    prioridade: 2,
    ativo: true,
    bandeiraEmoji: "🏴󠁧󠁢󠁥󠁮󠁧󠁿"
  },
  {
    id: 24,
    nome: "Copa do Rei",
    slug: "",
    subtitulo: "Copa del Rey",
    pais: "Espanha",
    tipo: "Copa Nacional",
    descricao: "A copa nacional da Espanha.",
    prioridade: 3,
    ativo: true,
    bandeiraEmoji: "🇪🇸"
  },
  {
    id: 27,
    nome: "Europa League",
    slug: "",
    subtitulo: "UEFA Europa League",
    pais: "Europa",
    tipo: "Continental",
    descricao: "A tradicional taça continental da UEFA.",
    prioridade: 2,
    ativo: true,
    bandeiraEmoji: "🏆"
  },
  {
    id: 14,
    nome: "NBA",
    slug: "nba",
    subtitulo: "National Basketball Association",
    pais: "Estados Unidos",
    tipo: "Basquete",
    descricao: "A maior liga de basquete do planeta.",
    prioridade: 5,
    ativo: false,
    bandeiraEmoji: "🏀"
  }
];

// 📚 O DICIONÁRIO COMPLETO DE TRADUÇÃO E SINÔNIMOS
export const dicionarioCampeonatos: Record<string, string> = {
  // Ligas Nacionais
  "campeonato italiano": "Serie A",
  "campeonato espanhol": "La Liga",
  "campeonato alemão": "Bundesliga",
  "campeonato alemáo": "Bundesliga",
  "campeonato francês": "Ligue 1",
  "campeonato frances": "Ligue 1",
  "campeonato inglês": "Premier League",
  "campeonato ingles": "Premier League",
  "campeonato português": "Primeira Liga",
  "campeonato portugues": "Primeira Liga",
  "brasileirão série b": "Série B",
  "brasileirao serie b": "Série B",
  "série b": "Série B",
  "serie b": "Série B",
  "brasileirao": "Brasileirão",
  "brasileirão": "Brasileirão",
  "brasileirão série a": "Brasileirão",

  // Novas Ligas
  "mls": "MLS",
  "major league soccer": "MLS",
  "campeonato saudita": "Saudi Pro League",
  "saudi pro league": "Saudi Pro League",
  "liga saudita": "Saudi Pro League",
  "campeonato argentino": "Campeonato Argentino",
  "liga argentina": "Campeonato Argentino",
  "campeonato holandês": "Campeonato Holandês",
  "campeonato holandes": "Campeonato Holandês",
  "eredivisie": "Campeonato Holandês",
  "campeonato turco": "Campeonato Turco",
  "super lig": "Campeonato Turco",
  "süper lig": "Campeonato Turco",
  "campeonato mexicano": "Campeonato Mexicano",
  "liga mx": "Campeonato Mexicano",

  // Copas Continentais e Internacionais (TODAS AS VARIAÇÕES POSSÍVEIS)
  "libertadores": "Copa Libertadores da América",
  "copa libertadores": "Copa Libertadores da América",
  "copa libertadores da américa": "Copa Libertadores da América",
  "copa libertadores da america": "Copa Libertadores da América",
  "conmebol libertadores": "Copa Libertadores da América",
  "sul-americana": "Copa Sul-Americana",
  "sulamericana": "Copa Sul-Americana",
  "copa sul-americana": "Copa Sul-Americana",
  "copa sulamericana": "Copa Sul-Americana",
  "conmebol sudamericana": "Copa Sul-Americana",
  "conmebol sul-americana": "Copa Sul-Americana",
  "champions league": "Champions League",
  "uefa champions league": "Champions League",
  "liga dos campeões": "Champions League",
  "europa league": "Europa League",
  "uefa europa league": "Europa League",
  "liga europa": "Europa League",

  // Copas Nacionais
  "copa do brasil": "Copa do Brasil",
  "copa da liga inglesa": "Copa da Liga Inglesa",
  "carabao cup": "Copa da Liga Inglesa",
  "efl cup": "Copa da Liga Inglesa",
  "copa da liga": "Copa da Liga Inglesa",
  "copa da inglaterra": "Copa da Inglaterra",
  "fa cup": "Copa da Inglaterra",
  "the fa cup": "Copa da Inglaterra",
  "copa do rei": "Copa do Rei",
  "copa del rey": "Copa do Rei",
  "copinha": "Copa São Paulo de Futebol Júnior"
};

// 🧠 O MAPA INTELIGENTE QUE CONECTA TODAS AS VARIAÇÕES AOS EMOJIS AUTOMATICAMENTE
export const competicoesAtivasMap: Record<string, CompeticaoInfo> = (() => {
  const mapa: Record<string, CompeticaoInfo> = {};

  // 1. Mapeia por Nome Oficial
  todasCompeticoes.forEach((comp) => {
    if (comp.ativo) {
      mapa[comp.nome] = comp;
      mapa[comp.nome.toLowerCase()] = comp;
      if (comp.subtitulo) {
        mapa[comp.subtitulo] = comp;
        mapa[comp.subtitulo.toLowerCase()] = comp;
      }
    }
  });

  // 2. Mapeia automaticamente todas as variações do Dicionário
  Object.entries(dicionarioCampeonatos).forEach(([variacao, nomeOficial]) => {
    const compEncontrada = todasCompeticoes.find(
      (c) =>
        c.nome.toLowerCase() === nomeOficial.toLowerCase() ||
        c.nome.toLowerCase() === variacao.toLowerCase()
    );

    if (compEncontrada && compEncontrada.ativo) {
      mapa[variacao] = compEncontrada;
      mapa[variacao.toLowerCase()] = compEncontrada;
      
      // Cria a versão com as primeiras letras maiúsculas (ex: "Copa Libertadores", "Copa Sul-Americana")
      const variacaoFormatada = variacao
        .split(' ')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
      mapa[variacaoFormatada] = compEncontrada;
    }
  });

  return mapa;
})();

export const ligasFutebolConfig = todasCompeticoes.reduce((acc, comp) => {
  if (comp.slug && (comp.codigoAPI || comp.espnSlug)) {
    acc[comp.slug] = comp;
  }
  return acc;
}, {} as Record<string, CompeticaoInfo>);