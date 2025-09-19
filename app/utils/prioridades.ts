interface Competicao {
  id: number;
  nome: string;
  pais: string;
  tipo: string;
  descricao: string;
  prioridade: number;
  ativo: boolean;
  bandeiraEmoji: string;
}

interface GrupoPrioridade {
  nome: string;
  cor: string;
  descricao: string;
}

interface CompeticaoData {
  competicoes: Competicao[];
  grupos_prioridade: Record<string, GrupoPrioridade>;
}

let competicaoCache: CompeticaoData | null = null;

export async function carregarCompeticoes(): Promise<CompeticaoData> {
  if (competicaoCache) {
    return competicaoCache;
  }
  
  try {
    const response = await fetch('/competicoes-unificadas.json');
    const data = await response.json();
    competicaoCache = data;
    return data;
  } catch (error) {
    console.error('Erro ao carregar competições:', error);
    // Fallback básico se houver erro
    return {
      competicoes: [],
      grupos_prioridade: {
        "5": {
          nome: "Prioridade Mínima - Outros",
          cor: "bg-gray-100 text-gray-800",
          descricao: "Outros campeonatos"
        }
      }
    };
  }
}

// Manter compatibilidade com código existente
export async function carregarPrioridades(): Promise<any> {
  const data = await carregarCompeticoes();
  return {
    grupos: data.grupos_prioridade,
    competicoes: data.competicoes
  };
}

export function getPrioridadeCampeonato(campeonato: string, prioridades: any, time1?: string, time2?: string): number {
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

  // Buscar primeiro nas competições unificadas (se disponível)
  if (prioridades.competicoes) {
    const competicao = prioridades.competicoes.find((comp: Competicao) => 
      comp.nome === campeonato && comp.ativo
    );
    if (competicao) {
      return competicao.prioridade;
    }
  }

  // Fallback para estrutura antiga (compatibilidade)
  if (prioridades.grupos) {
    for (const [grupo, dados] of Object.entries(prioridades.grupos)) {
      if ((dados as any).campeonatos?.includes(campeonato)) {
        return parseInt(grupo);
      }
    }
  }
  
  // Se não encontrar, retorna prioridade 6 (nova) e log para identificação
  console.warn(`⚠️ CAMPEONATO NÃO CADASTRADO: "${campeonato}" - Necessário definir prioridade!`);
  return 6; // Prioridade especial para campeonatos não cadastrados
}

export function getCampeonatosSemPrioridade(jogos: any[], prioridades: any): string[] {
  const campeonatosUnicos = [...new Set(jogos.map(jogo => jogo.campeonato))];
  const campeonatosSemPrioridade: string[] = [];
  
  for (const campeonato of campeonatosUnicos) {
    if (getPrioridadeCampeonato(campeonato, prioridades, '', '') === 6) {
      campeonatosSemPrioridade.push(campeonato);
    }
  }
  
  return campeonatosSemPrioridade;
}

// Funções auxiliares para trabalhar com a nova estrutura
export function getCompeticaoPorNome(nome: string, competicoes: Competicao[]): Competicao | undefined {
  return competicoes.find(comp => comp.nome === nome && comp.ativo);
}

export function getCompeticoesPorPrioridade(prioridade: number, competicoes: Competicao[]): Competicao[] {
  return competicoes.filter(comp => comp.prioridade === prioridade && comp.ativo);
}

export function getGrupoPrioridade(prioridade: number, grupos: Record<string, GrupoPrioridade>): GrupoPrioridade | undefined {
  return grupos[prioridade.toString()];
}

export function getBandeiraPorCompeticao(comp: string): string {
  switch (comp) {
    // 🇧🇷 Campeonatos Brasileiros
    case 'Brasileirão':
    case 'Brasileirão Feminino':
    case 'Copa do Brasil':
    case 'Copa do Nordeste':
      return '🇧🇷';
    
    // ⚽ Sul-América (Continental)
    case 'Libertadores da América':
    case 'Copa Sul-Americana':
    case 'Copa Libertadores da América':
    case 'Eliminatórias Sul-Americanas':
      return '⚽';
    
    // 🇦🇷 Argentina
    case 'Copa da Argentina':
    case 'Supercopa da Argentina':
      return '🇦🇷';
    
    // 🇺🇾 Uruguai
    case 'Campeonato Uruguaio':
      return '🇺🇾';
    
    // 🏴󠁧󠁢󠁥󠁮󠁧󠁿 Inglaterra
    case 'Premier League':
    case 'Copa da Inglaterra':
    case 'Copa da Liga Inglesa':
      return '🏴󠁧󠁢󠁥󠁮󠁧󠁿';
    
    // 🇪🇸 Espanha
    case 'La Liga':
    case 'Copa da Espanha':
      return '🇪🇸';
    
    // 🇮🇹 Itália
    case 'Serie A':
    case 'Copa da Itália':
      return '🇮🇹';
    
    // 🇫🇷 França
    case 'Ligue 1':
    case 'Copa da França':
      return '🇫🇷';
    
    // 🇩🇪 Alemanha
    case 'Bundesliga':
    case 'Copa da Alemanha':
      return '🇩🇪';
    
    // 🇵🇹 Portugal
    case 'Campeonato Português':
    case 'Copa de Portugal':
      return '🇵🇹';
    
    // 🇸🇦 Arábia Saudita
    case 'Saudi Pro League':
      return '🇸🇦';
    
    // 🇪🇺 Europa/UEFA
    case 'Champions League':
    case 'Europa League':
    case 'Eliminatórias Europeias':
      return '🇪🇺';
    
    // 🇺🇸 América do Norte
    case 'Eliminatórias da Concacaf':
    case 'MLS':
      return '🇺🇸';
    
    // ⚽ África
    case 'Eliminatórias Africanas':
      return '⚽';
    
    // 🌐 Internacional/Amistosos
    case 'Amistoso Internacional':
      return '🌐';
    
    // 🏈 NFL
    case 'NFL':
      return '🏈';
    
    // 🌎 Padrão
    default:
      return '🌎';
  }
}