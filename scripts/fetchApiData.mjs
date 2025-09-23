import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';


dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Agora o process.env será populado corretamente
const API_KEY = process.env.API_FOOTBALLDATA_KEY;

// Lista de todas as ligas que queremos buscar
const leagues = [
  { name: 'brasileirao', code: 'BSA' },
  { name: 'champions-league', code: 'CL' },
  { name: 'premier-league', code: 'PL' },
  { name: 'la-liga', code: 'PD' },
  { name: 'serie-a', code: 'SA' },
  { name: 'ligue-1', code: 'FL1' },
  { name: 'bundesliga', code: 'BL1' },
  { name: 'primeira-liga', code: 'PPL' },
];

const headers = { 'X-Auth-Token': API_KEY };

const wait = (ms) => new Promise(res => setTimeout(res, ms));

async function fetchData(url, filePath) {
  if (!API_KEY) {
    console.error("ERRO: A chave de API (API_FOOTBALLDATA_KEY) não foi encontrada. Verifique seu arquivo .env.local e a configuração do dotenv.");
    return;
  }

  try {
    console.log(`Buscando dados de: ${url}`);
    const response = await fetch(url, { headers });
    if (!response.ok) {
      throw new Error(`Falha na requisição: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    console.log(`Salvo com sucesso em: ${filePath}`);
  } catch (error) {
    console.error(`Erro ao buscar ou salvar ${url}:`, error.message);
  }
}

async function main() {
  const cacheDir = path.join(process.cwd(), 'public', 'api-cache');
  await fs.mkdir(cacheDir, { recursive: true });

  for (const league of leagues) {
    const standingsUrl = `https://api.football-data.org/v4/competitions/${league.code}/standings`;
    const standingsPath = path.join(cacheDir, `${league.name}-standings.json`);
    await fetchData(standingsUrl, standingsPath);
    await wait(7000); 

    const matchesUrl = `https://api.football-data.org/v4/competitions/${league.code}/matches?status=SCHEDULED`;
    const matchesPath = path.join(cacheDir, `${league.name}-matches.json`);
    await fetchData(matchesUrl, matchesPath);
    await wait(7000); 
  }

  console.log('Busca de dados da API concluída!');
}

main();