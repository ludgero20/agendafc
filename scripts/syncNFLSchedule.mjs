import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const API_KEY = process.env.BALLDONTLIE_API_KEY;
const JOGOS_NFL_PATH = path.join(process.cwd(), 'public/importacoes-manuais/nfl/jogos-nfl.json');

const wait = (ms) => new Promise(res => setTimeout(res, ms));

async function fetchAllSeasonGames() {
  if (!API_KEY) {
    console.error("ERRO: Chave da API Balldontlie não encontrada.");
    return null;
  }
  const season = new Date().getFullYear();
  let allGames = [];
  let cursor = 0;
  let hasMore = true;
  console.log(`Iniciando busca de todos os jogos da temporada ${season} da NFL...`);

  while (hasMore) {
    const url = `https://api.balldontlie.io/nfl/v1/games?seasons[]=${season}&per_page=100&cursor=${cursor}`;
    try {
      console.log(`Buscando página com cursor: ${cursor}`);
      const response = await fetch(url, { headers: { 'Authorization': API_KEY } });
      if (!response.ok) throw new Error(`Falha na requisição da API: ${response.status}`);
      const data = await response.json();
      allGames.push(...data.data);
      if (data.meta.next_cursor) {
        cursor = data.meta.next_cursor;
        console.log("Pausa de 13 segundos...");
        await wait(13000); 
      } else {
        hasMore = false;
      }
    } catch (error) {
      console.error("Erro durante a busca na API:", error.message);
      hasMore = false;
    }
  }

  const uniqueGames = [...new Map(allGames.map(game => [game.id, game])).values()];
  console.log(`Busca concluída. Total de ${uniqueGames.length} jogos únicos encontrados.`);
  return uniqueGames;
}

function transformApiData(apiGames) {
  return apiGames.map(game => {
    const gameDateUTC = new Date(game.date);
    const dateEvent = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(gameDateUTC);
    const strTime = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: 'America/Sao_Paulo' }).format(gameDateUTC) + ':00';
    const isFinished = game.status.startsWith('Final');
    return {
      idEvent: game.id.toString(),
      intRound: game.week.toString(),
      dateEvent: dateEvent,
      strTime: strTime,
      strHomeTeam: game.home_team.full_name,
      strAwayTeam: game.visitor_team.full_name,
      intHomeScore: isFinished && game.home_team_score != null ? game.home_team_score.toString() : null,
      intAwayScore: isFinished && game.visitor_team_score != null ? game.visitor_team_score.toString() : null,
      strStatus: isFinished ? "Match Finished" : "Not Started"
    };
  });
}

async function main() {
  const allApiGames = await fetchAllSeasonGames();
  if (!allApiGames) return;
  const transformedGames = transformApiData(allApiGames);
  const finalJson = { events: transformedGames };
  try {
    await fs.writeFile(JOGOS_NFL_PATH, JSON.stringify(finalJson, null, 2));
    console.log(`✅ Sucesso! O arquivo jogos-nfl.json foi atualizado com ${transformedGames.length} jogos.`);
  } catch (error) { console.error("Erro ao salvar o arquivo JSON:", error); }
}

main();