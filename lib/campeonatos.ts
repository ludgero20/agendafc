// lib/campeonatos.ts

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

// 🇧🇷 Dicionário de Nomes Amigáveis para Clubes Brasileiros
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