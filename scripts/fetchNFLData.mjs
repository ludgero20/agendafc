import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';

// Carrega as variáveis de ambiente do arquivo .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const API_KEY = process.env.BALLDONTLIE_API_KEY;
const JOGOS_NFL_PATH = path.join(process.cwd(), 'public/importacoes-manuais/nfl/jogos-nfl.json');

// Função para buscar os jogos da NFL em uma janela de 48h
async function fetchRecentNFLGames() {
  if (!API_KEY) {
    console.error("ERRO: Chave da API Balldontlie (BALLDONTLIE_API_KEY) não encontrada.");
    return null;
  }

  // Calcula as datas de hoje, ontem e anteontem
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
  
  // URL correta para o endpoint da NFL
  const url = `https://api.balldontlie.io/nfl/v1/games?dates[]=${todayStr}&dates[]=${yesterdayStr}&dates[]=${dayBeforeStr}`;

  try {
    const response = await fetch(url, { headers: { 'Authorization': API_KEY } });
    if (!response.ok) {
      throw new Error(`Falha na requisição de jogos da NFL: ${response.status}`);
    }
    const data = await response.json();
    console.log("🔍 Dados brutos recebidos da API:", JSON.stringify(data, null, 2));
    console.log(`Encontrados ${data.data.length} jogos nas últimas 72 horas.`);
    return data.data;
  } catch (error) {
    console.error("Erro ao buscar dados da API Balldontlie:", error.message);
    return null;
  }
}

// --- FUNÇÃO PRINCIPAL ---
async function main() {
  console.log("Iniciando atualização de placares da NFL...");
  
  const recentGames = await fetchRecentNFLGames();

  if (!recentGames || recentGames.length === 0) {
    console.log("Nenhum jogo recente da NFL encontrado ou falha na API. Encerrando.");
    return;
  }

  try {
    const jogosJson = JSON.parse(await fs.readFile(JOGOS_NFL_PATH, 'utf-8'));
    let gamesUpdated = 0;

    recentGames.forEach(gameResult => {
      // Verifica se o status retornado pela API é "Final"
      if (gameResult.status !== 'Final') return;

      const gameDate = gameResult.date.substring(0, 10);
      const gameIndex = jogosJson.events.findIndex(
        localGame => localGame.strHomeTeam === gameResult.home_team.full_name && 
                     localGame.strAwayTeam === gameResult.visitor_team.full_name &&
                     localGame.strStatus !== "Match Finished" // Pega o primeiro jogo não finalizado entre os times
      );

      if (gameIndex > -1) {
        console.log(`Atualizando placar para: ${gameResult.visitor_team.full_name} @ ${gameResult.home_team.full_name}`);
        
        jogosJson.events[gameIndex].intHomeScore = gameResult.home_team_score.toString();
        jogosJson.events[gameIndex].intAwayScore = gameResult.visitor_team_score.toString();
        jogosJson.events[gameIndex].strStatus = "Match Finished"; 
        gamesUpdated++;
      }
    });

    if (gamesUpdated > 0) {
      await fs.writeFile(JOGOS_NFL_PATH, JSON.stringify(jogosJson, null, 2));
      console.log(`✅ ${gamesUpdated} placares de jogos da NFL foram atualizados.`);
    } else {
      console.log("Nenhum placar de jogo da NFL para atualizar (jogos já estavam atualizados ou não foram encontrados).");
    }

    console.log("Atualização dos placares da NFL concluída!");

  } catch (error) {
    console.error("Falha no processo de atualização dos jogos da NFL:", error);
  }
}

main();