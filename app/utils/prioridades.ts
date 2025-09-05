interface GrupoPrioridade {
  nome: string;
  cor: string;
  campeonatos: string[];
}

interface PrioridadeData {
  grupos: Record<string, GrupoPrioridade>;
}

let prioridadeCache: PrioridadeData | null = null;

export async function carregarPrioridades(): Promise<PrioridadeData> {
  if (prioridadeCache) {
    return prioridadeCache;
  }
  
  try {
    const response = await fetch('/prioridades-campeonatos.json');
    const data = await response.json();
    prioridadeCache = data;
    return data;
  } catch (error) {
    console.error('Erro ao carregar prioridades:', error);
    // Fallback para prioridade mínima se houver erro
    return {
      grupos: {
        "5": {
          nome: "Prioridade Mínima - Outros",
          cor: "bg-gray-100 text-gray-800",
          campeonatos: []
        }
      }
    };
  }
}

export function getPrioridadeCampeonato(campeonato: string, prioridades: PrioridadeData, time1?: string, time2?: string): number {
  // Regra especial: Seleção Brasileira sempre no Grupo 1
  if (time1 || time2) {
    const times = [time1, time2].filter(Boolean).map(t => t?.toLowerCase());
    const temSelecaoBrasileira = times.some(time => 
      time?.includes('brasil') || 
      time?.includes('brazil') || 
      time === 'seleção brasileira' ||
      time === 'selecao brasileira'
    );
    
    if (temSelecaoBrasileira) {
      return 1; // Seleção brasileira sempre no grupo 1
    }
  }

  for (const [grupo, dados] of Object.entries(prioridades.grupos)) {
    if (dados.campeonatos.includes(campeonato)) {
      return parseInt(grupo);
    }
  }
  
  // Se não encontrar, retorna prioridade 6 (nova) e log para identificação
  console.warn(`⚠️ CAMPEONATO NÃO CADASTRADO: "${campeonato}" - Necessário definir prioridade!`);
  return 6; // Prioridade especial para campeonatos não cadastrados
}

export function getCampeonatosSemPrioridade(jogos: any[], prioridades: PrioridadeData): string[] {
  const campeonatosUnicos = [...new Set(jogos.map(jogo => jogo.campeonato))];
  const campeonatosSemPrioridade: string[] = [];
  
  for (const campeonato of campeonatosUnicos) {
    if (getPrioridadeCampeonato(campeonato, prioridades, '', '') === 6) {
      campeonatosSemPrioridade.push(campeonato);
    }
  }
  
  return campeonatosSemPrioridade;
}

export function getBandeiraPorCompeticao(comp: string): string {
  switch (comp) {
    case 'Brasileirão Série A':
    case 'Brasileirão Série B':
    case 'Brasileirão Série C':
    case 'Brasileirão Série D (quartas)':
    case 'Brasileirão Feminino (final)':
    case 'Copa do Brasil':
    case 'Copa do Nordeste (final)':
      return '🇧🇷';
    case 'Libertadores da América':
    case 'Copa Sul-Americana':
    case 'Copa Libertadores da América':
    case 'Eliminatórias Sul-Americanas':
      return '🌎';
    case 'Premier League':
    case 'Campeonato Inglês Feminino':
    case 'Campeonato Inglês (Quarta Divisão)':
    case 'Copa da Inglaterra':
      return '🏴󠁧󠁢󠁥󠁮󠁧󠁿';
    case 'La Liga':
    case 'Campeonato Espanhol (Segunda Divisão)':
    case 'Copa da Espanha':
      return '🇪🇸';
    case 'Serie A':
    case 'Copa da Itália':
      return '🇮🇹';
    case 'Ligue 1':
    case 'Copa da França':
      return '🇫🇷';
    case 'Bundesliga':
    case 'Copa da Alemanha':
      return '🇩🇪';
    case 'Saudi Pro League':
      return '🇸🇦';
    case 'Champions League':
    case 'Europa League':
    case 'Eliminatórias Europeias':
      return '🇪🇺';
    case 'Eliminatórias Africanas':
      return '🌍';
    case 'Eliminatórias da Concacaf':
    case 'Liga Feminina dos EUA':
    case 'MLS':
      return '🇺🇸';
    case 'Amistoso Internacional':
      return '🌐';
    case 'Campeonato Uruguaio':
      return '🇺🇾';
    case 'Copa da Argentina':
    case 'Supercopa da Argentina':
      return '🇦🇷';
    case 'Campeonato Holandês (Segunda Divisão)':
      return '🇳🇱';
    case 'Campeonato Português':
    case 'Copa de Portugal':
      return '🇵🇹';
    case 'Copa da Liga Japonesa (quartas)':
      return '🇯🇵';
    case 'NFL':
      return '🏈';
    default:
      return '⚽';
  }
}