// lib/campeonatos.ts

export type LigaConfig = {
  slug: string;
  nome: string;
  subtitulo: string;
  codigoAPI: string;
  arquivoStandings: string;
  arquivoMatches: string;
  bandeira: string;
};

export const ligasFutebolConfig: Record<string, LigaConfig> = {
  "brasileirao": {
    slug: "brasileirao",
    nome: "Brasileirão Série A",
    subtitulo: "Campeonato Brasileiro",
    codigoAPI: "BSA",
    arquivoStandings: "brasileirao-standings.json",
    arquivoMatches: "brasileirao-matches.json",
    bandeira: "🇧🇷"
  },
  "premier-league": {
    slug: "premier-league",
    nome: "Premier League",
    subtitulo: "Campeonato Inglês",
    codigoAPI: "PL",
    arquivoStandings: "premier-league-standings.json",
    arquivoMatches: "premier-league-matches.json",
    bandeira: "🏴󠁧󠁢󠁥󠁮󠁧󠁿"
  },
  "la-liga": {
    slug: "la-liga",
    nome: "La Liga",
    subtitulo: "Campeonato Espanhol",
    codigoAPI: "PD",
    arquivoStandings: "la-liga-standings.json",
    arquivoMatches: "la-liga-matches.json",
    bandeira: "🇪🇸"
  },
  "champions-league": {
    slug: "champions-league",
    nome: "Champions League",
    subtitulo: "Liga dos Campeões da UEFA",
    codigoAPI: "CL",
    arquivoStandings: "champions-league-standings.json",
    arquivoMatches: "champions-league-matches.json",
    bandeira: "🏆"
  },
  "bundesliga": {
    slug: "bundesliga",
    nome: "Bundesliga",
    subtitulo: "Campeonato Alemão",
    codigoAPI: "BL1",
    arquivoStandings: "bundesliga-standings.json",
    arquivoMatches: "bundesliga-matches.json",
    bandeira: "🇩🇪"
  },
  "serie-a": {
    slug: "serie-a",
    nome: "Serie A",
    subtitulo: "Campeonato Italiano",
    codigoAPI: "SA",
    arquivoStandings: "serie-a-standings.json",
    arquivoMatches: "serie-a-matches.json",
    bandeira: "🇮🇹"
  },
  "ligue-1": {
    slug: "ligue-1",
    nome: "Ligue 1",
    subtitulo: "Campeonato Francês",
    codigoAPI: "FL1",
    arquivoStandings: "ligue-1-standings.json",
    arquivoMatches: "ligue-1-matches.json",
    bandeira: "🇫🇷"
  },
  "primeira-liga": {
    slug: "primeira-liga",
    nome: "Primeira Liga",
    subtitulo: "Campeonato Português",
    codigoAPI: "PPL",
    arquivoStandings: "primeira-liga-standings.json",
    arquivoMatches: "primeira-liga-matches.json",
    bandeira: "🇵🇹"
  }
};

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

export const nomesTimesBrasil: Record<string, string> = {
  "CA Mineiro": "Atlético-MG",
  "Mineiro": "Atlético-MG",
  "CA Paranaense": "Athletico-PR",
  "Paranaense": "Athletico-PR",
  "CR Flamengo": "Flamengo",
  "SE Palmeiras": "Palmeiras",
  "SC Corinthians Paulista": "Corinthians",
  "São Paulo FC": "São Paulo",
  "Fluminense FC": "Fluminense",
  "Botafogo FR": "Botafogo",
  "CR Vasco da Gama": "Vasco",
  "Grêmio FBPA": "Grêmio",
  "SC Internacional": "Internacional",
  "Cruzeiro EC": "Cruzeiro",
  "EC Bahia": "Bahia",
  "EC Vitória": "Vitória",
  "Santos FC": "Santos",
  "RB Bragantino": "Bragantino",
  "Red Bull Bragantino": "Bragantino",
  "Mirassol FC": "Mirassol",
  "Coritiba FBC": "Coritiba",
  "Clube do Remo": "Remo",
  "Chapecoense AF": "Chapecoense"
};

export function formatarNomeTime(shortName?: string, fullName?: string): string {
  if (shortName && nomesTimesBrasil[shortName]) return nomesTimesBrasil[shortName];
  if (fullName && nomesTimesBrasil[fullName]) return nomesTimesBrasil[fullName];
  return shortName || fullName || 'Time';
}