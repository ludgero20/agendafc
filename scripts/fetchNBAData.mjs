import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';

// Carrega as variáveis de ambiente do arquivo .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const API_KEY = process.env.BALLDONTLIE_API_KEY;
const JOGOS_NBA_PATH = path.join(process.cwd(), 'public/importacoes-manuais/nba/jogos-nba.json');

// A função agora busca em uma janela de 48h (ontem e anteontem)
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
  
  // MUDANÇA 1: URL correta para o endpoint da NBA
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

async function main() {
  const recentGames = await fetchRecentGames();

  if (!recentGames || recentGames.length === 0) {
    console.log("Nenhum jogo recente encontrado ou falha na API. Encerrando.");
    return;
  }

  try {
    const currentData = await fs.readFile(JOGOS_NBA_PATH, 'utf-8');
    const jogosJson = JSON.parse(currentData);
    let updatedCount = 0;

    recentGames.forEach(gameResult => {
      // MUDANÇA 2: Verificamos se o status retornado pela API é "Final"
      if (gameResult.status !== 'Final') return;
      
      const homeTeamName = gameResult.home_team.full_name;
      const awayTeamName = gameResult.visitor_team.full_name;

      // MUDANÇA 3: A correspondência agora é mais flexível para evitar erros de fuso horário
      // Ela busca o primeiro jogo NÃO FINALIZADO entre os dois times
      const gameIndex = jogosJson.events.findIndex(
        localGame => 
          localGame.strHomeTeam === homeTeamName && 
          localGame.strAwayTeam === awayTeamName &&
          localGame.strStatus !== "Match Finished"
      );

      if (gameIndex > -1) {
        console.log(`Atualizando placar para: ${awayTeamName} @ ${homeTeamName}`);
        
        // MUDANÇA 4: Usamos os campos corretos e atualizamos para "Match Finished"
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
      console.log("Nenhuma correspondência de jogo encontrada para atualizar (jogos já estavam atualizados).");
    }

  } catch (error) {
    console.error("Erro ao ler ou salvar o arquivo jogos-nba.json:", error);
  }
}

main();