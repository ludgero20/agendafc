import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';

// Carrega as variáveis de ambiente do arquivo .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const API_KEY = process.env.BALLDONTLIE_API_KEY;
const JOGOS_NBA_PATH = path.join(process.cwd(), 'public/importacoes-manuais/nba/jogos-nba.json');
const TABELA_NBA_PATH = path.join(process.cwd(), 'public/importacoes-manuais/nba/tabela.json');

/**
 * FUNÇÃO DE BUSCA: Busca jogos em uma janela de 48h para garantir que
 * nenhum jogo seja perdido por causa de fuso horário.
 */
async function fetchRecentGames() {
  if (!API_KEY) {
    console.error("ERRO: Chave da API Balldontlie (BALLDONTLIE_API_KEY) não encontrada.");
    return null;
  }

  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const dayBefore = new Date(today);
  dayBefore.setDate(today.getDate() - 2);

  const formatter = new Intl.DateTimeFormat('en-CA');
  const yesterdayStr = formatter.format(yesterday);
  const dayBeforeStr = formatter.format(dayBefore);

  console.log(`Buscando jogos da NBA para as datas: ${yesterdayStr} e ${dayBeforeStr}`);
  
  const url = `https://api.balldontlie.io/v1/games?dates[]=${yesterdayStr}&dates[]=${dayBeforeStr}`;

  try {
    const response = await fetch(url, { headers: { 'Authorization': API_KEY } });
    if (!response.ok) {
      throw new Error(`Falha na requisição da API: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    console.log(`Encontrados ${data.data.length} jogos nas últimas 48 horas.`);
    return data.data;
  } catch (error) {
    console.error("Erro ao buscar dados da API Balldontlie:", error.message);
    return null;
  }
}

/**
 * FUNÇÃO DE CÁLCULO: Lê a lista completa de jogos e o arquivo base da tabela
 * para gerar a classificação atualizada.
 */
function calculateStandings(allGames, baseTable) {
  console.log("Calculando a tabela de classificação...");
  
  // 1. Cria um mapa de estatísticas zeradas a partir da sua tabela base
  const teamStats = {};
  baseTable.standings.forEach(team => {
    teamStats[team.teamName] = {
      ...team, // Preserva dados (logo, ID, nome, conferência)
      intWin: 0,
      intLoss: 0,
      strPercentage: ".000",
      strStreak: "-",
      games: [] // Lista temporária para calcular a sequência
    };
  });

  // 2. Processa os jogos finalizados para calcular V/D
  allGames.filter(game => game.strStatus === "Match Finished").forEach(game => {
    const homeTeam = game.strHomeTeam;
    const awayTeam = game.strAwayTeam;
    
    // Verifica se os times do jogo existem na nossa tabela
    if (teamStats[homeTeam] && teamStats[awayTeam]) {
      const homeScore = parseInt(game.intHomeScore || '0');
      const awayScore = parseInt(game.intAwayScore || '0');

      teamStats[homeTeam].games.push({ date: game.dateEvent, won: homeScore > awayScore });
      teamStats[awayTeam].games.push({ date: game.dateEvent, won: awayScore > homeScore });

      if (homeScore > awayScore) {
        teamStats[homeTeam].intWin++;
        teamStats[awayTeam].intLoss++;
      } else {
        teamStats[awayTeam].intWin++;
        teamStats[homeTeam].intLoss++;
      }
    }
  });

  // 3. Calcula % e sequência para cada time
  Object.values(teamStats).forEach((stats) => {
    const totalGames = stats.intWin + stats.intLoss;
    // Calcula a porcentagem
    stats.strPercentage = totalGames > 0 ? (stats.intWin / totalGames).toFixed(3).substring(1) : ".000";
    
    // Calcula a sequência (streak)
    stats.games.sort((a, b) => b.date.localeCompare(a.date)); // Ordena jogos do mais recente
    let streakCount = 0;
    let streakType = '';
    if (stats.games.length > 0) {
        streakType = stats.games[0].won ? 'W' : 'L';
        for (const game of stats.games) {
            if ((game.won && streakType === 'W') || (!game.won && streakType === 'L')) {
                streakCount++;
            } else { break; }
        }
    }
    stats.strStreak = streakCount > 0 ? `${streakType}${streakCount}` : '-';
  });

  // 4. Formata para o JSON final da tabela
  const standings = Object.values(teamStats);

  // 5. Ordena e atribui o rank
  standings.sort((a, b) => {
    if (a.conference !== b.conference) return a.conference.localeCompare(b.conference);
    const percentB = parseFloat(`0${b.strPercentage}`);
    const percentA = parseFloat(`0${a.strPercentage}`);
    if (percentB !== percentA) return percentB - percentA; // Maior % primeiro
    return a.teamName.localeCompare(b.teamName); // Desempate alfabético
  });

  let rankLeste = 1, rankOeste = 1;
  standings.forEach(team => {
    team.rank = (team.conference === 'Leste' ? rankLeste++ : rankOeste++).toString();
    delete team.games; // Remove a lista de jogos interna, não precisamos dela no JSON final
  });

  console.log("Cálculo da tabela concluído.");
  return { standings };
}

/**
 * FUNÇÃO PRINCIPAL: Orquestra o processo de atualização.
 */
async function main() {
  const recentGames = await fetchRecentGames();
  if (!recentGames || recentGames.length === 0) {
    console.log("Nenhum jogo recente encontrado ou falha na API.");
    // NÃO ENCERRA: Mesmo sem jogos novos, precisamos recalcular a tabela
    // caso o arquivo de jogos tenha sido atualizado manualmente.
  }

  try {
    let jogosJson = JSON.parse(await fs.readFile(JOGOS_NBA_PATH, 'utf-8'));
    let baseTabelaJson = JSON.parse(await fs.readFile(TABELA_NBA_PATH, 'utf-8'));
    let gamesUpdated = 0;

    // 1. Atualiza os placares no jogos-nba.json
    if (recentGames && recentGames.length > 0) {
      recentGames.forEach(gameResult => {
        if (gameResult.status !== 'Final') return;
        
        const homeTeamName = gameResult.home_team.full_name;
        const awayTeamName = gameResult.visitor_team.full_name;
        const gameDate = gameResult.date.substring(0, 10);

        const gameIndex = jogosJson.events.findIndex(
          localGame => 
            localGame.strHomeTeam === homeTeamName && 
            localGame.strAwayTeam === awayTeamName &&
            localGame.dateEvent === gameDate &&
            localGame.strStatus !== "Match Finished"
        );

        if (gameIndex > -1) {
          const eventId = jogosJson.events[gameIndex].idEvent;
          console.log(`Atualizando placar para: ${awayTeamName} @ ${homeTeamName} (idEvent: ${eventId})`);
          
          jogosJson.events[gameIndex].intHomeScore = gameResult.home_team_score.toString();
          jogosJson.events[gameIndex].intAwayScore = gameResult.visitor_team_score.toString();
          jogosJson.events[gameIndex].strStatus = "Match Finished";
          gamesUpdated++;
        }
      });
    }

    if (gamesUpdated > 0) {
      await fs.writeFile(JOGOS_NBA_PATH, JSON.stringify(jogosJson, null, 2));
      console.log(`✅ ${gamesUpdated} placares de jogos da NBA foram atualizados.`);
    } else {
      console.log("Nenhum placar de jogo da NBA para atualizar.");
    }

    // 2. Recalcula a tabela de classificação (SEMPRE)
    // Passamos a lista COMPLETA de jogos (jogosJson.events) e a tabela base
    const finalJsonTabela = calculateStandings(jogosJson.events, baseTabelaJson);
    
    await fs.writeFile(TABELA_NBA_PATH, JSON.stringify(finalJsonTabela, null, 2));
    console.log(`✅ Sucesso! O arquivo tabela.json da NBA foi recalculado e atualizado.`);

  } catch (error) {
    console.error("Falha no processo de atualização diária da NBA:", error);
  }
}

main();