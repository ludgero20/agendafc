import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';

// Carrega as variáveis de ambiente do arquivo .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const API_KEY = process.env.BALLDONTLIE_API_KEY;
const JOGOS_NBA_PATH = path.join(process.cwd(), 'public/importacoes-manuais/nba/jogos-nba.json');

// Função para buscar os jogos do dia anterior na API
async function fetchYesterdayGames() {
  if (!API_KEY) {
    console.error("ERRO: Chave da API Balldontlie (BALLDONTLIE_API_KEY) não encontrada.");
    return null;
  }

  // Calcula a data de ontem no formato YYYY-MM-DD
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const dateStr = new Intl.DateTimeFormat('en-CA').format(yesterday);

  console.log(`Buscando jogos da NBA para a data: ${dateStr}`);
  const url = `https://api.balldontlie.io/v1/games?dates[]=${dateStr}`;

  try {
    const response = await fetch(url, {
      headers: { 'Authorization': API_KEY }
    });

    if (!response.ok) {
      throw new Error(`Falha na requisição da API: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log(`Encontrados ${data.data.length} jogos.`);
    return data.data; // A API retorna os jogos dentro de um array 'data'

  } catch (error) {
    console.error("Erro ao buscar dados da API Balldontlie:", error.message);
    return null;
  }
}

// Função principal que lê, atualiza e salva o arquivo JSON
async function main() {
  const yesterdayGames = await fetchYesterdayGames();

  if (!yesterdayGames || yesterdayGames.length === 0) {
    console.log("Nenhum jogo encontrado para ontem ou falha na API. Encerrando.");
    return;
  }

  try {
    // Lê o arquivo de jogos existente
    const currentData = await fs.readFile(JOGOS_NBA_PATH, 'utf-8');
    const jogosJson = JSON.parse(currentData);

    let updatedCount = 0;

    // Para cada resultado obtido, atualiza o jogo correspondente no nosso arquivo
    yesterdayGames.forEach(gameResult => {
      const homeTeamName = gameResult.home_team.full_name;
      const awayTeamName = gameResult.visitor_team.full_name;

      const gameIndex = jogosJson.events.findIndex(
        localGame => localGame.strHomeTeam === homeTeamName && localGame.strAwayTeam === awayTeamName
      );

      if (gameIndex > -1) {
        console.log(`Atualizando placar para: ${awayTeamName} @ ${homeTeamName}`);
        jogosJson.events[gameIndex].intHomeScore = gameResult.home_team_score.toString();
        jogosJson.events[gameIndex].intAwayScore = gameResult.visitor_team_score.toString();
        jogosJson.events[gameIndex].strStatus = "Match Finished";
        updatedCount++;
      }
    });

    if (updatedCount > 0) {
      // Salva o arquivo JSON atualizado
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