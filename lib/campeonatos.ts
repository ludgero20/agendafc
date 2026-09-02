// lib/campeonatos.ts

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
  // Propriedades para ligas com API da football-data
  codigoAPI?: string;
  arquivoStandings?: string;
  arquivoMatches?: string;
};

// 🏆 TODAS AS COMPETIÇÕES DO SITE (Futebol, F1, NFL e Basquete)
export const todasCompeticoes: CompeticaoInfo[] = [
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
    arquivoStandings: "brasileirao-standings.json",
    arquivoMatches: "brasileirao-matches.json"
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
    ordem: 2,
    ativo: true,
    bandeiraEmoji: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
    codigoAPI: "PL",
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
    ordem: 3,
    ativo: true,
    bandeiraEmoji: "🇪🇸",
    codigoAPI: "PD",
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
    ordem: 4,
    ativo: true,
    bandeiraEmoji: "🏆",
    codigoAPI: "CL",
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
    ordem: 5,
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
    ordem: 6,
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
    ordem: 7,
    ativo: true,
    bandeiraEmoji: "🇩🇪",
    codigoAPI: "BL1",
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
    ordem: 8,
    ativo: true,
    bandeiraEmoji: "🇮🇹",
    codigoAPI: "SA",
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
    ordem: 9,
    ativo: true,
    bandeiraEmoji: "🇫🇷",
    codigoAPI: "FL1",
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
    ordem: 10,
    ativo: true,
    bandeiraEmoji: "🇵🇹",
    codigoAPI: "PPL",
    arquivoStandings: "primeira-liga-standings.json",
    arquivoMatches: "primeira-liga-matches.json"
  },
  {
    id: 11,
    nome: "Copa Libertadores da América",
    slug: "",
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
    pais: "Brasil",
    tipo: "Copa Nacional",
    descricao: "O torneio mais democrático e emocionante do futebol brasileiro.",
    prioridade: 1,
    ativo: true,
    bandeiraEmoji: "🇧🇷"
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
    ativo: false, // Pausada
    bandeiraEmoji: "🏀"
  }
];

// Mapa rápido por nome (para a Home e Semana filtrarem em memória)
export const competicoesAtivasMap: Record<string, CompeticaoInfo> = todasCompeticoes.reduce((acc, comp) => {
  if (comp.ativo) acc[comp.nome] = comp;
  return acc;
}, {} as Record<string, CompeticaoInfo>);

// Mapa por Slug das Ligas de Futebol (para a rota /campeonatos/[slug])
export const ligasFutebolConfig = todasCompeticoes.reduce((acc, comp) => {
  if (comp.slug && comp.codigoAPI) acc[comp.slug] = comp;
  return acc;
}, {} as Record<string, CompeticaoInfo>);

// 🤖 DICIONÁRIO PARA O ROBÔ DA IA (Gemini)
export const dicionarioCampeonatos: Record<string, string> = {
  "campeonato italiano": "Serie A",
  "campeonato espanhol": "La Liga",
  "campeonato saudita": "Saudi Pro League",
  "campeonato alemão": "Bundesliga",
  "campeonato francês": "Ligue 1",
  "campeonato frances": "Ligue 1",
  "campeonato inglês": "Premier League",
  "campeonato ingles": "Premier League",
  "campeonato português": "Primeira Liga",
  "campeonato portugues": "Primeira Liga",
  "liga europa": "Europa League",
  "afc champions league elite": "Champions League Asiática",
  "uefa champions league": "Champions League",
  "copinha": "Copa São Paulo de Futebol Júnior",
  "libertadores": "Copa Libertadores da América",
  "copa libertadores": "Copa Libertadores da América"
};