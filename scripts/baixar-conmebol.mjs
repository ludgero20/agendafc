// scripts/baixar-conmebol.mjs
import fs from 'fs/promises';
import path from 'path';

const ESPN_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  Accept: 'application/json',
  Referer: 'https://www.espn.com/',
};

async function baixarTorneio(slug, arquivoDestino) {
  console.log(`🔄 Baixando confrontos de ${slug}...`);
  try {
    const res = await fetch(
      `https://site.api.espn.com/apis/site/v2/sports/soccer/${slug}/scoreboard?dates=2026&limit=250`,
      { headers: ESPN_HEADERS }
    );
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    const eventos = data.events || [];

    const outputDir = path.join(process.cwd(), 'public', 'api-cache');
    await fs.mkdir(outputDir, { recursive: true });

    const outputPath = path.join(outputDir, arquivoDestino);
    await fs.writeFile(outputPath, JSON.stringify({ events: eventos }, null, 2));

    console.log(`✅ ${eventos.length} jogos salvos em public/api-cache/${arquivoDestino}`);
  } catch (e) {
    console.error(`❌ Erro ao baixar ${slug}:`, e.message);
  }
}

async function rodar() {
  await baixarTorneio('conmebol.libertadores', 'libertadores.json');
  await baixarTorneio('conmebol.sudamericana', 'sul-americana.json');
}

rodar();