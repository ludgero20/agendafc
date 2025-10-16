import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';

// Carrega as variáveis de ambiente do arquivo .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const API_KEY = process.env.BALLDONTLIE_API_KEY;
const JOGOS_NBA_PATH = path.join(process.cwd(), 'public/importacoes-manuais/nba/jogos-nba.json');

async function fetchAllSeasonGames() {
  if (!API_KEY) {
    console.error("ERRO: Chave da API Balldontlie (BALLDONTLIE_API_KEY) não encontrada.");
    return null;
  }

  const season = new Date().getFullYear();
  let allGames = [];
  let cursor = 0; // A API Balldontlie usa 'cursor' para paginação
  let hasMore = true;

  console.log(`Iniciando busca de todos os jogos da temporada ${season} da NBA...`);

  while (hasMore) {
    const url = `https://api.balldontlie.io/v1/games?seasons[]=${season}&per_page=100&cursor=${cursor}`;
    
    try {
      console.log(`Buscando página com cursor: ${cursor}`);
      const response = await fetch(url, { headers: { 'Authorization': API_KEY } });
      if (!response.ok) {
        throw new Error(`Falha na requisição da API: ${response.status}`);
      }
      
      const data = await response.json();
      allGames.push(...data.data);

      // Verifica se há uma próxima página
      if (data.meta.next_cursor) {
        cursor = data.meta.next_cursor;
      } else {
        hasMore = false;
      }
    } catch (error) {
      console.error("Erro durante a busca na API:", error.message);
      hasMore = false; // Interrompe o loop em caso de erro
    }
  }

  console.log(`Busca concluída. Total de ${allGames.length} jogos encontrados.`);
  return allGames;
}

function transformApiData(apiGames) {
  return apiGames.map(game => {
    // Converte a data UTC da API para o horário de Brasília
    const gameDateUTC = new Date(game.date);
    
    // Formata a data e a hora já no fuso correto
    const dateEvent = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(gameDateUTC);
    const strTime = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: 'America/Sao_Paulo' }).format(gameDateUTC) + ':00';

    return {
      idEvent: game.id.toString(),
      dateEvent: dateEvent,
      strTime: strTime,
      strHomeTeam: game.home_team.full_name,
      strAwayTeam: game.visitor_team.full_name,
      intHomeScore: game.home_team_score > 0 ? game.home_team_score.toString() : null,
      intAwayScore: game.visitor_team_score > 0 ? game.visitor_team_score.toString() : null,
      strStatus: game.status === 'Final' ? "Match Finished" : "Not Started"
    };
  });
}

async function main() {
  const allApiGames = await fetchAllSeasonGames();

  if (!allApiGames) {
    console.log("Não foi possível buscar os jogos da temporada.");
    return;
  }

  const transformedGames = transformApiData(allApiGames);
  const finalJson = {
    events: transformedGames
  };

  try {
    await fs.writeFile(JOGOS_NBA_PATH, JSON.stringify(finalJson, null, 2));
    console.log(`✅ Sucesso! O arquivo jogos-nba.json foi atualizado com ${transformedGames.length} jogos da temporada.`);
  } catch (error) {
    console.error("Erro ao salvar o arquivo JSON:", error);
  }
}

main();