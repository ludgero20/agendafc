// scripts/baixar-copa-brasil.mjs
import fs from 'fs/promises';
import path from 'path';

const ESPN_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  Accept: 'application/json',
  Referer: 'https://www.espn.com/',
};

async function salvarBackupCopaDoBrasil() {
  console.log('🔄 Baixando confrontos da Copa do Brasil para backup...');
  try {
    const res = await fetch(
      'https://site.api.espn.com/apis/site/v2/sports/soccer/bra.copa_do_brazil/scoreboard?dates=2026&limit=250',
      { headers: ESPN_HEADERS }
    );

    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    const eventos = data.events || [];

    const outputDir = path.join(process.cwd(), 'public', 'api-cache');
    await fs.mkdir(outputDir, { recursive: true });

    const outputPath = path.join(outputDir, 'copa-do-brasil.json');
    await fs.writeFile(outputPath, JSON.stringify({ events: eventos }, null, 2));

    console.log(`✅ Sucesso! ${eventos.length} jogos salvos em public/api-cache/copa-do-brasil.json`);
  } catch (e) {
    console.error('❌ Erro ao baixar:', e.message);
  }
}

salvarBackupCopaDoBrasil();