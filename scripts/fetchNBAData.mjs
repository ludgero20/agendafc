import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';

// Carrega as variáveis de ambiente do arquivo .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const API_KEY = process.env.BALLDONTLIE_API_KEY;
const JOGOS_NBA_PATH = path.join(process.cwd(), 'public/importacoes-manuais/nba/jogos-nba.json');

// MUDANÇA: A função agora busca em uma janela de 48h (ontem e anteontem)
async function fetchRecentGames() {
  if (!API_KEY) {
    console.error("ERRO: Chave da API Balldontlie (BALLDONTLIE_API_KEY) não encontrada.");
    return null;
  }

  // Calcula as datas de ontem e anteontem
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const dayBefore = new Date(today);
  dayBefore.setDate(today.getDate() - 2);

  const formatter = new Intl.DateTimeFormat('en-CA');
  const yesterdayStr = formatter.format(yesterday);
  const dayBeforeStr = formatter.format(dayBefore);

  console.log(`Buscando jogos da NBA para as datas: ${yesterdayStr} e ${dayBeforeStr}`);
  
  // A API permite passar múltiplas datas no mesmo parâmetro
  const url = `https://api.balldontlie.io/v1/games?dates[]=${yesterdayStr}&dates[]=${dayBeforeStr}`;

  try {
    const response = await fetch(url, {
      headers: { 'Authorization': API_KEY }
    });

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

async function main() {
  // Chama a nova função de busca
  const recentGames = await fetchRecentGames();

  if (!recentGames || recentGames.length === 0) {
    console.log("Nenhum jogo recente encontrado ou falha na API. Encerrando.");
    return;
  }

  try {
    const currentData = await fs.readFile(JOGOS_NBA_PATH, 'utf-8');
    const jogosJson = JSON.parse(currentData);
    let updatedCount = 0;

    // O resto da lógica continua a mesma, mas agora ela tem mais resultados para comparar
    recentGames.forEach(gameResult => {
      const homeTeamName = gameResult.home_team.full_name;
      const awayTeamName = gameResult.visitor_team.full_name;
      const gameDate = gameResult.date.substring(0, 10);

      const gameIndex = jogosJson.events.findIndex(
        localGame => 
          localGame.strHomeTeam === homeTeamName && 
          localGame.strAwayTeam === awayTeamName &&
          localGame.dateEvent === gameDate
      );

      if (gameIndex > -1 && jogosJson.events[gameIndex].strStatus !== "Match Finished") {
        console.log(`Atualizando placar para: ${awayTeamName} @ ${homeTeamName} em ${gameDate}`);
        jogosJson.events[gameIndex].intHomeScore = gameResult.home_team_score.toString();
        jogosJson.events[gameIndex].intAwayScore = gameResult.visitor_team_score.toString();
        jogosJson.events[gameIndex].strStatus = "Match Finished";
        updatedCount++;
      }
    });

    if (updatedCount > 0) {
      await fs.writeFile(JOGOS_NBA_PATH, JSON.stringify(jogosJson, null, 2));
      console.log(`Atualização concluída. ${updatedCount} jogos foram atualizados.`);
    } else {
      console.log("Nenhuma correspondência de jogo encontrada para atualizar.");
    }

  } catch (error) {
    console.error("Erro ao ler ou salvar o arquivo jogos-nba.json:", error);
  }
}

main();