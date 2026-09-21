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
  // LIGAS NACIONAIS
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
    descricao: "Tabela de classificação e pontuação atualizada do Campeonato Brasileiro Série B.",
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
    id: 11,
    nome: "Libertadores",
    slug: "libertadores",
    subtitulo: "CONMEBOL Libertadores",
    pais: "América do Sul",
    tipo: "Continental",
    descricao: "A Glória Eterna: Classificação completa da fase de grupos e mata-mata.",
    prioridade: 1,
    ordem: 6,
    ativo: true,
    bandeiraEmoji: "🏆",
    espnSlug: "conmebol.libertadores",
    origemAPI: "espn"
  },
  {
    id: 12,
    nome: "Sul-Americana",
    slug: "sul-americana",
    subtitulo: "CONMEBOL Sudamericana",
    pais: "América do Sul",
    tipo: "Continental",
    descricao: "A Grande Conquista: Grupos oficiais e confrontos decisivos da América do Sul.",
    prioridade: 2,
    ordem: 7,
    ativo: true,
    bandeiraEmoji: "🏆",
    espnSlug: "conmebol.sudamericana",
    origemAPI: "espn"
  },
  {
    id: 13,
    nome: "Copa do Brasil",
    slug: "copa-do-brasil",
    subtitulo: "Copa do Brasil",
    pais: "Brasil",
    tipo: "Copa Nacional",
    descricao: "O torneio mais democrático e emocionante do futebol brasileiro.",
    prioridade: 1,
    ordem: 8,
    ativo: true,
    bandeiraEmoji: "🇧🇷",
    espnSlug: "bra.copa_do_brazil",
    origemAPI: "espn"
  },
  {
    id: 27,
    nome: "Europa League",
    slug: "europa-league",
    subtitulo: "UEFA Europa League",
    pais: "Europa",
    tipo: "Continental",
    descricao: "Classificação oficial e tabela da Fase de Liga com os 36 clubes europeus.",
    prioridade: 2,
    ordem: 9,
    ativo: true,
    bandeiraEmoji: "🏆",
    espnSlug: "uefa.europa",
    origemAPI: "espn"
  },
  {
    id: 28,
    nome: "Conference League",
    slug: "conference-league",
    subtitulo: "UEFA Conference League",
    pais: "Europa",
    tipo: "Continental",
    descricao: "Classificação oficial e tabela da Fase de Liga da UEFA Conference League.",
    prioridade: 3,
    ordem: 10,
    ativo: true,
    bandeiraEmoji: "🏆",
    espnSlug: "uefa.europa.conf",
    origemAPI: "espn"
  },
  {
    id: 29,
    nome: "Nations League",
    slug: "nations-league",
    subtitulo: "UEFA Nations League",
    pais: "Europa",
    tipo: "Continental",
    descricao: "Classificação completa de todas as Ligas (A, B, C e D) das seleções europeias.",
    prioridade: 2,
    ordem: 11,
    ativo: true,
    bandeiraEmoji: "🇪🇺",
    espnSlug: "uefa.nations",
    origemAPI: "espn"
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
    ordem: 12,
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
    ordem: 13,
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
    ordem: 14,
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
    ordem: 15,
    ativo: true,
    bandeiraEmoji: "🇵🇹",
    codigoAPI: "PPL",
    origemAPI: "football-data",
    arquivoStandings: "primeira-liga-standings.json",
    arquivoMatches: "primeira-liga-matches.json"
  },
  {
    id: 20,
    nome: "Eredivisie",
    slug: "eredivisie",
    subtitulo: "Campeonato Holandês",
    pais: "Holanda",
    tipo: "Nacional",
    descricao: "Tabela de classificação e jogos da primeira divisão holandesa com Ajax, PSV e Feyenoord.",
    prioridade: 4,
    ordem: 16,
    ativo: true,
    bandeiraEmoji: "🇳🇱",
    codigoAPI: "DED",
    origemAPI: "football-data",
    arquivoStandings: "eredivisie-standings.json",
    arquivoMatches: "eredivisie-matches.json"
  },
  {
    id: 31,
    nome: "Championship",
    slug: "championship",
    subtitulo: "2ª Divisão da Inglaterra",
    pais: "Inglaterra",
    tipo: "Nacional",
    descricao: "Classificação completa e 46 rodadas da tradicional EFL Championship inglesa.",
    prioridade: 4,
    ordem: 17,
    ativo: true,
    bandeiraEmoji: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
    codigoAPI: "ELC",
    origemAPI: "football-data",
    arquivoStandings: "championship-standings.json",
    arquivoMatches: "championship-matches.json"
  },

  // ==========================================
  // OUTROS ESPORTES
  // ==========================================
  {
    id: 5,
    nome: "Fórmula 1",
    slug: "f1",
    subtitulo: "Temporada Oficial de F1",
    pais: "Mundial",
    tipo: "Automobilismo",
    descricao: "Calendário oficial com horários de treinos e corridas, classificação de pilotos e equipes.",
    prioridade: 1,
    ordem: 18,
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
    ordem: 19,
    ativo: true,
    bandeiraEmoji: "🏈"
  },
  {
    id: 14,
    nome: "NBA",
    slug: "nba",
    subtitulo: "National Basketball Association",
    pais: "Estados Unidos",
    tipo: "Basquete",
    descricao: "A maior liga de basquete do planeta.",
    prioridade: 2,
    ordem: 20,
    ativo: true,
    bandeiraEmoji: "🏀"
  },

  // ==========================================
  // DEMAIS COMPETIÇÕES (TV / HOME)
  // ==========================================
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
    id: 32,
    nome: "Campeonato Uruguaio",
    slug: "",
    pais: "Uruguai",
    tipo: "Nacional",
    descricao: "Primeira divisão do Campeonato Uruguaio com Peñarol e Nacional.",
    prioridade: 4,
    ativo: true,
    bandeiraEmoji: "🇺🇾"
  },
  {
    id: 33,
    nome: "Campeonato Uruguaio (2ª Divisão)",
    slug: "",
    pais: "Uruguai",
    tipo: "Nacional",
    descricao: "Segunda divisão do futebol uruguaio.",
    prioridade: 5,
    ativo: true,
    bandeiraEmoji: "🇺🇾"
  },
  {
    id: 34,
    nome: "La Liga 2",
    slug: "",
    subtitulo: "Segunda División Española",
    pais: "Espanha",
    tipo: "Nacional",
    descricao: "Segunda divisão do campeonato espanhol.",
    prioridade: 4,
    ativo: true,
    bandeiraEmoji: "🇪🇸"
  },
  {
    id: 35,
    nome: "Serie B Italiana",
    slug: "",
    subtitulo: "Segunda Divisão da Itália",
    pais: "Itália",
    tipo: "Nacional",
    descricao: "Segunda divisão do futebol italiano.",
    prioridade: 4,
    ativo: true,
    bandeiraEmoji: "🇮🇹"
  },
  {
    id: 36,
    nome: "Campeonato Brasileiro Feminino",
    slug: "",
    pais: "Brasil",
    tipo: "Nacional Feminino",
    descricao: "Campeonato Brasileiro de Futebol Feminino.",
    prioridade: 3,
    ativo: true,
    bandeiraEmoji: "🇧🇷"
  },
  {
    id: 37,
    nome: "Champions League Feminina",
    slug: "",
    subtitulo: "UEFA Women's Champions League",
    pais: "Europa",
    tipo: "Continental Feminino",
    descricao: "Liga dos Campeões Feminina da UEFA.",
    prioridade: 2,
    ativo: true,
    bandeiraEmoji: "🏆"
  },
  {
    id: 38,
    nome: "Campeonato Inglês Feminino",
    slug: "",
    subtitulo: "Women's Super League",
    pais: "Inglaterra",
    tipo: "Nacional Feminino",
    descricao: "Primeira divisão do futebol feminino inglês.",
    prioridade: 3,
    ativo: true,
    bandeiraEmoji: "🏴󠁧󠁢󠁥󠁮󠁧󠁿"
  }
];

export const dicionarioCampeonatos: Record<string, string> = {
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
  "campeonato holandês": "Eredivisie",
  "campeonato holandes": "Eredivisie",
  "eredivisie": "Eredivisie",
  "championship": "Championship",
  "efl championship": "Championship",
  "segunda divisão inglesa": "Championship",
  "brasileirão série b": "Série B",
  "brasileirao serie b": "Série B",
  "série b": "Série B",
  "serie b": "Série B",
  "brasileirao": "Brasileirão",
  "brasileirão": "Brasileirão",
  "brasileirão série a": "Brasileirão",
  "nations league": "Nations League",
  "uefa nations league": "Nations League",
  "liga das nações": "Nations League",
  "liga das nacoes": "Nations League",
  "europa league": "Europa League",
  "uefa europa league": "Europa League",
  "liga europa": "Europa League",
  "conference league": "Conference League",
  "uefa conference league": "Conference League",
  "liga conferencia": "Conference League",
  "libertadores": "Libertadores",
  "copa libertadores": "Libertadores",
  "copa libertadores da américa": "Libertadores",
  "conmebol libertadores": "Libertadores",
  "sul-americana": "Sul-Americana",
  "sulamericana": "Sul-Americana",
  "copa sul-americana": "Sul-Americana",
  "conmebol sudamericana": "Sul-Americana",
  "copa do brasil": "Copa do Brasil",
  "mls": "MLS",
  "major league soccer": "MLS",
  "campeonato saudita": "Saudi Pro League",
  "saudi pro league": "Saudi Pro League",
  "champions league": "Champions League",
  "uefa champions league": "Champions League",
  "copa da liga inglesa": "Copa da Liga Inglesa",
  "carabao cup": "Copa da Liga Inglesa",
  "fa cup": "Copa da Inglaterra",
  "copa do rei": "Copa do Rei",
  "campeonato brasileiro feminino": "Campeonato Brasileiro Feminino",
  "brasileirão feminino": "Campeonato Brasileiro Feminino",
  "brasileirao feminino": "Campeonato Brasileiro Feminino",
  "campeonato uruguaio": "Campeonato Uruguaio",
  "campeonato uruguaio (2ª divisão)": "Campeonato Uruguaio (2ª Divisão)",
  "campeonato uruguaio 2ª divisão": "Campeonato Uruguaio (2ª Divisão)",
  "segunda divisão do uruguai": "Campeonato Uruguaio (2ª Divisão)",
  "segunda divisao do uruguai": "Campeonato Uruguaio (2ª Divisão)",
  "la liga 2": "La Liga 2",
  "laliga 2": "La Liga 2",
  "segunda divisão espanhola": "La Liga 2",
  "segunda divisao espanhola": "La Liga 2",
  "serie b italiana": "Serie B Italiana",
  "segunda divisão italiana": "Serie B Italiana",
  "segunda divisao italiana": "Serie B Italiana",
  "champions league feminina": "Champions League Feminina",
  "uefa champions league feminina": "Champions League Feminina",
  "champions league feminino": "Champions League Feminina",
  "liga dos campeões feminina": "Champions League Feminina",
  "campeonato inglês feminino": "Campeonato Inglês Feminino",
  "campeonato ingles feminino": "Campeonato Inglês Feminino",
  "wsl": "Campeonato Inglês Feminino"
};

export const competicoesAtivasMap: Record<string, CompeticaoInfo> = (() => {
  const mapa: Record<string, CompeticaoInfo> = {};

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

  Object.entries(dicionarioCampeonatos).forEach(([variacao, nomeOficial]) => {
    const compEncontrada = todasCompeticoes.find(
      (c) =>
        c.nome.toLowerCase() === nomeOficial.toLowerCase() ||
        c.nome.toLowerCase() === variacao.toLowerCase()
    );

    if (compEncontrada && compEncontrada.ativo) {
      mapa[variacao] = compEncontrada;
      mapa[variacao.toLowerCase()] = compEncontrada;
      const cap = variacao.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      mapa[cap] = compEncontrada;
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

export const bandeirasPaisesMap: Record<string, string> = {
  "brasil": "🇧🇷",
  "inglaterra": "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
  "espanha": "🇪🇸",
  "itália": "🇮🇹",
  "italia": "🇮🇹",
  "alemanha": "🇩🇪",
  "frança": "🇫🇷",
  "franca": "🇫🇷",
  "portugal": "🇵🇹",
  "holanda": "🇳🇱",
  "países baixos": "🇳🇱",
  "paises baixos": "🇳🇱",
  "uruguai": "🇺🇾",
  "argentina": "🇦🇷",
  "estados unidos": "🇺🇸",
  "eua": "🇺🇸",
  "arábia saudita": "🇸🇦",
  "arabia saudita": "🇸🇦",
  "méxico": "🇲🇽",
  "mexico": "🇲🇽",
  "turquia": "🇹🇷",
  "europa": "🏆",
  "américa do sul": "🏆",
  "america do sul": "🏆",
  "mundial": "🌎",
  "internacional": "🌎",
  "continental": "🏆"
};

export function obterBandeiraCompeticao(campeonato: string, pais?: string): string {
  if (!campeonato && !pais) return '🌎';
  const campLower = (campeonato || '').toLowerCase().trim();

  // 1. Ícones especiais de modalidade ou grandes torneios continentais
  if (campLower.includes('fórmula 1') || campLower.includes('formula 1') || campLower === 'f1') return '🏎️';
  if (campLower === 'nfl') return '🏈';
  if (campLower === 'nba') return '🏀';
  if (
    campLower.includes('champions league') ||
    campLower.includes('libertadores') ||
    campLower.includes('sul-americana') ||
    campLower.includes('sulamericana') ||
    campLower.includes('europa league') ||
    campLower.includes('conference league')
  ) {
    return '🏆';
  }

  // 2. Se pais foi explicitamente informado
  if (pais) {
    const paisLimpo = pais.toLowerCase().trim();
    if (bandeirasPaisesMap[paisLimpo]) {
      return bandeirasPaisesMap[paisLimpo];
    }
  }

  // 3. Verifica se a competição está cadastrada no mapa de competições
  const compInfo = competicoesAtivasMap[campeonato] || competicoesAtivasMap[campLower];
  if (compInfo) {
    if (compInfo.bandeiraEmoji) return compInfo.bandeiraEmoji;
    if (compInfo.pais) {
      const p = compInfo.pais.toLowerCase().trim();
      if (bandeirasPaisesMap[p]) return bandeirasPaisesMap[p];
    }
  }

  // 4. Detecção por termos no nome do campeonato
  if (
    campLower.includes('brasil') ||
    campLower.includes('brasileir') ||
    campLower.includes('copa do brasil') ||
    campLower.includes('copa paulista') ||
    campLower.includes('copa rio') ||
    campLower === 'série b' ||
    campLower === 'serie b' ||
    campLower.includes('série c') ||
    campLower.includes('serie c')
  ) {
    return '🇧🇷';
  }
  if (
    campLower.includes('ingl') ||
    campLower.includes('premier league') ||
    campLower.includes('championship') ||
    campLower.includes('fa cup') ||
    campLower.includes('carabao')
  ) {
    return '🏴󠁧󠁢󠁥󠁮󠁧󠁿';
  }
  if (
    campLower.includes('espanh') ||
    campLower.includes('la liga') ||
    campLower.includes('copa do rei')
  ) {
    return '🇪🇸';
  }
  if (campLower.includes('uruguai')) return '🇺🇾';
  if (campLower.includes('argentin')) return '🇦🇷';
  if (campLower.includes('italian') || campLower === 'serie a') return '🇮🇹';
  if (campLower.includes('alem') || campLower.includes('bundesliga')) return '🇩🇪';
  if (campLower.includes('franc') || campLower.includes('ligue 1') || campLower.includes('ligue 2')) return '🇫🇷';
  if (campLower.includes('portug') || campLower.includes('primeira liga')) return '🇵🇹';
  if (campLower.includes('holand') || campLower.includes('eredivisie')) return '🇳🇱';
  if (campLower.includes('saudita')) return '🇸🇦';
  if (campLower.includes('turco')) return '🇹🇷';
  if (campLower.includes('mexican')) return '🇲🇽';
  if (campLower.includes('mls') || campLower.includes('nwsl')) return '🇺🇸';

  return '🌎';
}