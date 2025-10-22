import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';

// Carrega as variáveis de ambiente do arquivo .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const API_KEY = process.env.BALLDONTLIE_API_KEY;
const JOGOS_NFL_PATH = path.join(process.cwd(), 'public/importacoes-manuais/nfl/jogos-nfl.json');
const TABELA_NFL_PATH = path.join(process.cwd(), 'public/importacoes-manuais/nfl/tabela.json');

//** FUNÇÃO DE BUSCA: Buscar Jogos Recentes (72h)
async function fetchRecentNFLGames() {
  if (!API_KEY) {
    console.error("ERRO: Chave da API Balldontlie (BALLDONTLIE_API_KEY) não encontrada.");
    return null;
  }

  // Calcula uma janela de 72 horas para a busca
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const dayBefore = new Date(today);
  dayBefore.setDate(today.getDate() - 2);

  const formatter = new Intl.DateTimeFormat('en-CA');
  const todayStr = formatter.format(today);
  const yesterdayStr = formatter.format(yesterday);
  const dayBeforeStr = formatter.format(dayBefore);

  console.log(`Buscando jogos da NFL para as datas: ${todayStr}, ${yesterdayStr} e ${dayBeforeStr}`);
  
  const url = `https://api.balldontlie.io/nfl/v1/games?dates[]=${todayStr}&dates[]=${yesterdayStr}&dates[]=${dayBeforeStr}`;

  try {
    const response = await fetch(url, { headers: { 'Authorization': API_KEY } });
    if (!response.ok) {
      throw new Error(`Falha na requisição de jogos da NFL: ${response.status}`);
    }
    const data = await response.json();
    console.log(`Encontrados ${data.data.length} jogos da NFL nas últimas 72 horas.`);
    return data.data;
  } catch (error) {
    console.error("Erro ao buscar dados da API Balldontlie:", error.message);
    return null;
  }
}

/**
 * NOVA FUNÇÃO DE CÁLCULO: Gera a classificação da NFL
 */

function calculateNFLStandings(allGames, baseTable) {
  console.log("Calculando a tabela de classificação da NFL...");
  const teamStats = {};
  
  // 1. Inicializa estatísticas a partir da tabela base
  let teamsList;
  if (baseTable.standings) {
      teamsList = baseTable.standings; // Formato novo (que o script salvará)
  } else if (baseTable.table) {
      teamsList = baseTable.table; // Formato antigo (o seu arquivo atual)
  } else if (Array.isArray(baseTable)) {
      teamsList = baseTable; // Backup caso seja uma lista simples
  }

  if (!teamsList || teamsList.length === 0) {
    console.error("ERRO: O arquivo 'tabela.json' base não tem a estrutura esperada ou está vazio.");
    return baseTable; // Retorna a tabela base sem modificar
  }

  teamsList.forEach(team => {
const teamName = team.teamName || team.strTeam; // Usa teamName se existir, senão usa strTeam

    if (teamName) {
      teamStats[teamName] = {
        // Garante que o objeto base tenha as propriedades no formato NOVO
        teamName: teamName,
        teamLogo: team.teamLogo || team.strTeamBadge, // Mapeia strTeamBadge
        conference: team.conference || team.strConference, // Mapeia strConference
        division: team.division || team.strDivision, // Mapeia strDivision
        
        // Zera as estatísticas para recalcular
        intWin: 0,
        intLoss: 0,
        intTie: 0, // NFL tem empates
        strPercentage: ".000",
        strStreak: "-",
        games: [] // Para calcular a sequência
      };
    } else {
      console.warn("Aviso: Time no tabela.json encontrado sem 'teamName' ou 'strTeam'.", team);
    }
  });

  // 2. Processa os jogos finalizados para calcular V/D/E
  allGames.filter(game => game.strStatus === "Match Finished").forEach(game => {
    const homeTeam = game.strHomeTeam;
    const awayTeam = game.strAwayTeam;

    // Verifica se os times do jogo existem na nossa tabela (teamStats)
    if (teamStats[homeTeam] && teamStats[awayTeam]) {
      const homeScore = parseInt(game.intHomeScore || '0');
      const awayScore = parseInt(game.intAwayScore || '0');

      let homeResult = 'L', awayResult = 'W';
      if (homeScore > awayScore) {
        teamStats[homeTeam].intWin++;
        teamStats[awayTeam].intLoss++;
        homeResult = 'W';
        awayResult = 'L';
      } else if (homeScore < awayScore) {
        teamStats[homeTeam].intLoss++;
        teamStats[awayTeam].intWin++;
        homeResult = 'L';
        awayResult = 'W';
      } else { // Empate
        teamStats[homeTeam].intTie++;
        teamStats[awayTeam].intTie++;
        homeResult = 'T';
        awayResult = 'T';
      }
      
      // Garante que a data é válida antes de comparar
      if (game.dateEvent) {
          teamStats[homeTeam].games.push({ date: game.dateEvent, result: homeResult });
          teamStats[awayTeam].games.push({ date: game.dateEvent, result: awayResult });
      }
    }
  });

  // 3. Calcula % e sequência para cada time
  Object.values(teamStats).forEach((stats) => {
    const totalGames = stats.intWin + stats.intLoss + stats.intTie;
    
    // Calcula a porcentagem (NFL: Vitórias + 0.5 * Empates) / Total
    if (totalGames === 0) {
      stats.strPercentage = ".000";
    } else {
      const percentage = (stats.intWin + (0.5 * stats.intTie)) / totalGames;
      if (percentage === 1) {
        stats.strPercentage = "1.000";
      } else {
        stats.strPercentage = percentage.toFixed(3).substring(1); // Formato .XXX
      }
    }
    
    // Calcula a sequência (streak)
    stats.games.sort((a, b) => new Date(b.date) - new Date(a.date)); // Ordena jogos do mais recente
    let streakCount = 0;
    let streakType = '';
    if (stats.games.length > 0) {
        streakType = stats.games[0].result; // W, L, ou T
        for (const game of stats.games) {
            if (game.result === streakType) {
                streakCount++;
            } else { break; }
        }
    }
    stats.strStreak = streakCount > 0 ? `${streakType}${streakCount}` : '-';
  });

  const standings = Object.values(teamStats);

  // 4. Ordena por conferência, divisão e porcentagem
  standings.sort((a, b) => {
    if (a.conference !== b.conference) return (a.conference || '').localeCompare(b.conference || '');
    if (a.division !== b.division) return (a.division || '').localeCompare(b.division || '');
    
    const percentB = parseFloat(b.strPercentage.replace(".", "0."));
    const percentA = parseFloat(a.strPercentage.replace(".", "0."));
    if (percentB !== percentA) return percentB - percentA;
    
    return (a.teamName || '').localeCompare(b.teamName || ''); 
  });

  // 5. Atribui o rank DENTRO da divisão
  let currentDivision = '';
  let rank = 1;
  standings.forEach(team => {
    if (team.division !== currentDivision) {
        rank = 1; // Reseta o rank para a nova divisão
        currentDivision = team.division;
    }
    team.rank = rank.toString();
    rank++;
    delete team.games; // Limpa os dados auxiliares
  });

  console.log("Cálculo da tabela da NFL concluído.");
  // Retorna no NOVO formato padronizado
  return { standings };
}


/**
 * FUNÇÃO PRINCIPAL (main)
 * Orquestra a atualização de placares e o recálculo da tabela.
 */
async function main() {
  console.log("Iniciando atualização de placares e tabela da NFL...");
  
  const recentGames = await fetchRecentNFLGames();

  if (!recentGames) {
    console.log("Falha na API da NFL. Encerrando.");
    return;
  }

  try {
    // Carrega AMBOS os arquivos
    const jogosJson = JSON.parse(await fs.readFile(JOGOS_NFL_PATH, 'utf-8'));
    const baseTabelaJson = JSON.parse(await fs.readFile(TABELA_NFL_PATH, 'utf-8'));
    let gamesUpdated = 0;

    // ETAPA 1: Atualizar placares no jogos-nfl.json (lógica original)
    if (recentGames.length > 0) {
        recentGames.forEach(gameResult => {
            if (!gameResult.status.startsWith('Final')) return;

            const apiHomeTeam = gameResult.home_team.full_name;
            const apiAwayTeam = gameResult.visitor_team.full_name;
            
            const gameIndex = jogosJson.events.findIndex(localGame => {
                const localTeams = new Set([localGame.strHomeTeam, localGame.strAwayTeam]);
                return localTeams.has(apiHomeTeam) && 
                       localTeams.has(apiAwayTeam) &&
                       localGame.strStatus !== "Match Finished";
            });

            if (gameIndex > -1) {
                const eventId = jogosJson.events[gameIndex].idEvent;
                console.log(`Atualizando placar para: ${apiAwayTeam} @ ${apiHomeTeam} (idEvent: ${eventId})`);
                
                jogosJson.events[gameIndex].intHomeScore = gameResult.home_team_score.toString();
                jogosJson.events[gameIndex].intAwayScore = gameResult.visitor_team_score.toString();
                jogosJson.events[gameIndex].strStatus = "Match Finished"; 
                gamesUpdated++;
            }
        });
    }

    if (gamesUpdated > 0) {
      await fs.writeFile(JOGOS_NFL_PATH, JSON.stringify(jogosJson, null, 2));
      console.log(`✅ ${gamesUpdated} placares de jogos da NFL foram atualizados.`);
    } else {
      console.log("Nenhum placar de jogo da NFL para atualizar.");
    }

    // ETAPA 2: Recalcular a tabela de classificação (SEMPRE)
    // Usamos o 'jogosJson' completo (que pode ter sido atualizado ou não)
    console.log("Iniciando recálculo da tabela da NFL...");
    const finalJsonTabela = calculateNFLStandings(jogosJson.events, baseTabelaJson);
    await fs.writeFile(TABELA_NFL_PATH, JSON.stringify(finalJsonTabela, null, 2));
    console.log(`✅ Sucesso! O arquivo tabela.json da NFL foi recalculado e atualizado.`);

    console.log("Atualização da NFL concluída!");

  } catch (error) {
    console.error("Falha no processo de atualização dos jogos da NFL:", error);
  }
}

main();