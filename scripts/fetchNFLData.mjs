import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';

// Carrega as variáveis de ambiente do arquivo .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const API_KEY = process.env.BALLDONTLIE_API_KEY;
const JOGOS_NFL_PATH = path.join(process.cwd(), 'public/importacoes-manuais/nfl/jogos-nfl.json');

/**
 * FUNÇÃO IMPORTANTE: Buscar Jogos Recentes
 * ----------------------------------------
 * Esta função é o coração da busca de dados.
 * 1. Ela calcula as datas de "hoje", "ontem" e "anteontem".
 * 2. Cria uma URL para a API Balldontlie pedindo todos os jogos da NFL que aconteceram nessa janela de 72 horas.
 * Isso garante que não perderemos nenhum jogo por causa de diferenças de fuso horário.
 * 3. Faz a chamada à API usando a sua chave de segurança.
 * 4. Retorna a lista de jogos encontrados.
 */
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
    console.log("🔍 Dados brutos recebidos da API:", JSON.stringify(data, null, 2));
    console.log(`Encontrados ${data.data.length} jogos nas últimas 72 horas.`);
    return data.data;
  } catch (error) {
    console.error("Erro ao buscar dados da API Balldontlie:", error.message);
    return null;
  }
}

/**
 * FUNÇÃO IMPORTANTE: Principal (main)
 * -----------------------------------
 * Esta é a função que orquestra todo o processo de atualização.
 * 1. Ela chama `fetchRecentNFLGames` para obter os resultados mais recentes.
 * 2. Lê o seu arquivo `jogos-nfl.json` existente.
 * 3. Para cada jogo retornado pela API, ela procura uma correspondência no seu arquivo.
 * 4. A correspondência é flexível: ela procura o primeiro jogo entre os dois times que ainda não foi finalizado,
 * não importando quem é o mandante ou visitante. Isso previne erros de cadastro.
 * 5. Se encontra uma correspondência, atualiza os campos de placar e status.
 * 6. Se algum jogo foi atualizado, ela salva o arquivo `jogos-nfl.json` com os novos dados.
 */
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
      if (gameResult.status !== 'Final') return;

      const apiHomeTeam = gameResult.home_team.full_name;
      const apiAwayTeam = gameResult.visitor_team.full_name;
      
      // AJUSTE FINAL: Lógica de correspondência flexível e correta
      const gameIndex = jogosJson.events.findIndex(localGame => {
        const localTeams = new Set([localGame.strHomeTeam, localGame.strAwayTeam]);
        const apiTeams = new Set([apiHomeTeam, apiAwayTeam]);

        // Retorna verdadeiro se os times são os mesmos E o jogo ainda não foi finalizado
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