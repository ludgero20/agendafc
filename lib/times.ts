// lib/times.ts

export type TimeConfig = {
  slug: string;
  nome: string;
  nomeOficialAPI: string;
  idAPI: number;
  variacoesNome: string[];
  competicaoCodigo: string;
  competicaoNome: string;
  arquivoStandings: string;
  arquivoMatches: string;
  escudo: string;
  corPrimaria: string;
};

export const timesConfig: Record<string, TimeConfig> = {
  // --- BRASILEIRÃO SÉRIE A ---
  "flamengo": {
    slug: "flamengo",
    nome: "Flamengo",
    nomeOficialAPI: "CR Flamengo",
    idAPI: 1783,
    variacoesNome: ["Flamengo", "CR Flamengo", "Flamengo-RJ"],
    competicaoCodigo: "BSA",
    competicaoNome: "Brasileirão Série A",
    arquivoStandings: "brasileirao-standings.json",
    arquivoMatches: "brasileirao-matches.json",
    escudo: "https://crests.football-data.org/1783.png",
    corPrimaria: "border-red-600 bg-red-50"
  },
  "palmeiras": {
    slug: "palmeiras",
    nome: "Palmeiras",
    nomeOficialAPI: "SE Palmeiras",
    idAPI: 1769,
    variacoesNome: ["Palmeiras", "SE Palmeiras"],
    competicaoCodigo: "BSA",
    competicaoNome: "Brasileirão Série A",
    arquivoStandings: "brasileirao-standings.json",
    arquivoMatches: "brasileirao-matches.json",
    escudo: "https://crests.football-data.org/1769.png",
    corPrimaria: "border-emerald-600 bg-emerald-50"
  },
  "corinthians": {
    slug: "corinthians",
    nome: "Corinthians",
    nomeOficialAPI: "SC Corinthians Paulista",
    idAPI: 1779,
    variacoesNome: ["Corinthians", "SC Corinthians Paulista"],
    competicaoCodigo: "BSA",
    competicaoNome: "Brasileirão Série A",
    arquivoStandings: "brasileirao-standings.json",
    arquivoMatches: "brasileirao-matches.json",
    escudo: "https://crests.football-data.org/1779.png",
    corPrimaria: "border-gray-900 bg-gray-100"
  },
  "sao-paulo": {
    slug: "sao-paulo",
    nome: "São Paulo",
    nomeOficialAPI: "São Paulo FC",
    idAPI: 1776,
    variacoesNome: ["São Paulo", "Sao Paulo", "São Paulo FC"],
    competicaoCodigo: "BSA",
    competicaoNome: "Brasileirão Série A",
    arquivoStandings: "brasileirao-standings.json",
    arquivoMatches: "brasileirao-matches.json",
    escudo: "https://crests.football-data.org/1776.png",
    corPrimaria: "border-red-700 bg-red-50"
  },
  "santos": {
    slug: "santos",
    nome: "Santos",
    nomeOficialAPI: "Santos FC",
    idAPI: 6685,
    variacoesNome: ["Santos", "Santos FC"],
    competicaoCodigo: "BSA",
    competicaoNome: "Brasileirão Série A",
    arquivoStandings: "brasileirao-standings.json",
    arquivoMatches: "brasileirao-matches.json",
    escudo: "https://crests.football-data.org/6685.png",
    corPrimaria: "border-gray-800 bg-gray-50"
  },
  "vasco": {
    slug: "vasco",
    nome: "Vasco da Gama",
    nomeOficialAPI: "CR Vasco da Gama",
    idAPI: 1780,
    variacoesNome: ["Vasco", "Vasco da Gama", "CR Vasco da Gama"],
    competicaoCodigo: "BSA",
    competicaoNome: "Brasileirão Série A",
    arquivoStandings: "brasileirao-standings.json",
    arquivoMatches: "brasileirao-matches.json",
    escudo: "https://crests.football-data.org/1780.png",
    corPrimaria: "border-gray-900 bg-gray-100"
  },
  "botafogo": {
    slug: "botafogo",
    nome: "Botafogo",
    nomeOficialAPI: "Botafogo FR",
    idAPI: 1770,
    variacoesNome: ["Botafogo", "Botafogo FR", "Botafogo-RJ"],
    competicaoCodigo: "BSA",
    competicaoNome: "Brasileirão Série A",
    arquivoStandings: "brasileirao-standings.json",
    arquivoMatches: "brasileirao-matches.json",
    escudo: "https://crests.football-data.org/1770.png",
    corPrimaria: "border-gray-900 bg-gray-100"
  },
  "fluminense": {
    slug: "fluminense",
    nome: "Fluminense",
    nomeOficialAPI: "Fluminense FC",
    idAPI: 1765,
    variacoesNome: ["Fluminense", "Fluminense FC"],
    competicaoCodigo: "BSA",
    competicaoNome: "Brasileirão Série A",
    arquivoStandings: "brasileirao-standings.json",
    arquivoMatches: "brasileirao-matches.json",
    escudo: "https://crests.football-data.org/1765.png",
    corPrimaria: "border-red-800 bg-green-50"
  },
  "gremio": {
    slug: "gremio",
    nome: "Grêmio",
    nomeOficialAPI: "Grêmio FBPA",
    idAPI: 1767,
    variacoesNome: ["Grêmio", "Gremio", "Grêmio FBPA"],
    competicaoCodigo: "BSA",
    competicaoNome: "Brasileirão Série A",
    arquivoStandings: "brasileirao-standings.json",
    arquivoMatches: "brasileirao-matches.json",
    escudo: "https://crests.football-data.org/1767.png",
    corPrimaria: "border-sky-600 bg-sky-50"
  },
  "internacional": {
    slug: "internacional",
    nome: "Internacional",
    nomeOficialAPI: "SC Internacional",
    idAPI: 6684,
    variacoesNome: ["Internacional", "Inter", "SC Internacional"],
    competicaoCodigo: "BSA",
    competicaoNome: "Brasileirão Série A",
    arquivoStandings: "brasileirao-standings.json",
    arquivoMatches: "brasileirao-matches.json",
    escudo: "https://crests.football-data.org/6684.png",
    corPrimaria: "border-red-600 bg-red-50"
  },
  "cruzeiro": {
    slug: "cruzeiro",
    nome: "Cruzeiro",
    nomeOficialAPI: "Cruzeiro EC",
    idAPI: 1771,
    variacoesNome: ["Cruzeiro", "Cruzeiro EC"],
    competicaoCodigo: "BSA",
    competicaoNome: "Brasileirão Série A",
    arquivoStandings: "brasileirao-standings.json",
    arquivoMatches: "brasileirao-matches.json",
    escudo: "https://crests.football-data.org/1771.png",
    corPrimaria: "border-blue-600 bg-blue-50"
  },
  "atletico-mineiro": {
    slug: "atletico-mineiro",
    nome: "Atlético-MG",
    nomeOficialAPI: "CA Mineiro",
    idAPI: 1766,
    variacoesNome: ["Atlético-MG", "Atletico-MG", "Atlético Mineiro", "CA Mineiro"],
    competicaoCodigo: "BSA",
    competicaoNome: "Brasileirão Série A",
    arquivoStandings: "brasileirao-standings.json",
    arquivoMatches: "brasileirao-matches.json",
    escudo: "https://crests.football-data.org/1766.png",
    corPrimaria: "border-gray-900 bg-gray-50"
  },
  "bahia": {
    slug: "bahia",
    nome: "Bahia",
    nomeOficialAPI: "EC Bahia",
    idAPI: 1777,
    variacoesNome: ["Bahia", "EC Bahia"],
    competicaoCodigo: "BSA",
    competicaoNome: "Brasileirão Série A",
    arquivoStandings: "brasileirao-standings.json",
    arquivoMatches: "brasileirao-matches.json",
    escudo: "https://crests.football-data.org/1777.png",
    corPrimaria: "border-blue-600 bg-red-50"
  },
  "athletico-pr": {
    slug: "athletico-pr",
    nome: "Athletico-PR",
    nomeOficialAPI: "CA Paranaense",
    idAPI: 1768,
    variacoesNome: ["Athletico-PR", "Athletico PR", "CA Paranaense", "Athletico"],
    competicaoCodigo: "BSA",
    competicaoNome: "Brasileirão Série A",
    arquivoStandings: "brasileirao-standings.json",
    arquivoMatches: "brasileirao-matches.json",
    escudo: "https://crests.football-data.org/1768.png",
    corPrimaria: "border-red-600 bg-red-50"
  },
  "red-bull-bragantino": {
    slug: "red-bull-bragantino",
    nome: "RB Bragantino",
    nomeOficialAPI: "RB Bragantino",
    idAPI: 4286,
    variacoesNome: ["RB Bragantino", "Bragantino", "Red Bull Bragantino"],
    competicaoCodigo: "BSA",
    competicaoNome: "Brasileirão Série A",
    arquivoStandings: "brasileirao-standings.json",
    arquivoMatches: "brasileirao-matches.json",
    escudo: "https://crests.football-data.org/4286.png",
    corPrimaria: "border-red-600 bg-gray-50"
  },

  // --- GIGANTES DA EUROPA ---
  "real-madrid": {
    slug: "real-madrid",
    nome: "Real Madrid",
    nomeOficialAPI: "Real Madrid CF",
    idAPI: 86,
    variacoesNome: ["Real Madrid", "Real Madrid CF"],
    competicaoCodigo: "PD",
    competicaoNome: "La Liga",
    arquivoStandings: "la-liga-standings.json",
    arquivoMatches: "la-liga-matches.json",
    escudo: "https://crests.football-data.org/86.png",
    corPrimaria: "border-yellow-500 bg-yellow-50"
  },
  "barcelona": {
    slug: "barcelona",
    nome: "Barcelona",
    nomeOficialAPI: "FC Barcelona",
    idAPI: 81,
    variacoesNome: ["Barcelona", "FC Barcelona"],
    competicaoCodigo: "PD",
    competicaoNome: "La Liga",
    arquivoStandings: "la-liga-standings.json",
    arquivoMatches: "la-liga-matches.json",
    escudo: "https://crests.football-data.org/81.png",
    corPrimaria: "border-blue-700 bg-red-50"
  },
  "manchester-city": {
    slug: "manchester-city",
    nome: "Manchester City",
    nomeOficialAPI: "Manchester City FC",
    idAPI: 65,
    variacoesNome: ["Manchester City", "Man City", "City"],
    competicaoCodigo: "PL",
    competicaoNome: "Premier League",
    arquivoStandings: "premier-league-standings.json",
    arquivoMatches: "premier-league-matches.json",
    escudo: "https://crests.football-data.org/65.png",
    corPrimaria: "border-sky-500 bg-sky-50"
  },
  "liverpool": {
    slug: "liverpool",
    nome: "Liverpool",
    nomeOficialAPI: "Liverpool FC",
    idAPI: 64,
    variacoesNome: ["Liverpool", "Liverpool FC"],
    competicaoCodigo: "PL",
    competicaoNome: "Premier League",
    arquivoStandings: "premier-league-standings.json",
    arquivoMatches: "premier-league-matches.json",
    escudo: "https://crests.football-data.org/64.png",
    corPrimaria: "border-red-600 bg-red-50"
  },
  "arsenal": {
    slug: "arsenal",
    nome: "Arsenal",
    nomeOficialAPI: "Arsenal FC",
    idAPI: 57,
    variacoesNome: ["Arsenal", "Arsenal FC"],
    competicaoCodigo: "PL",
    competicaoNome: "Premier League",
    arquivoStandings: "premier-league-standings.json",
    arquivoMatches: "premier-league-matches.json",
    escudo: "https://crests.football-data.org/57.png",
    corPrimaria: "border-red-600 bg-red-50"
  }
};