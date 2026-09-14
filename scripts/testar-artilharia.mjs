// scripts/testar-artilharia.mjs
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const API_KEY = process.env.API_FOOTBALLDATA_KEY;

async function testarArtilharia(compCode, nome) {
  console.log(`\n📡 Buscando Top 10 Artilheiros: ${nome} (${compCode})...`);

  try {
    const res = await fetch(`https://api.football-data.org/v4/competitions/${compCode}/scorers?limit=10`, {
      headers: { 'X-Auth-Token': API_KEY || '' }
    });

    if (!res.ok) {
      console.log(`❌ Erro: Status ${res.status}`);
      return;
    }

    const data = await res.json();
    const scorers = data.scorers || [];

    console.log(`✅ Sucesso! ${scorers.length} artilheiros encontrados:`);
    scorers.forEach((s, idx) => {
      const jogador = s.player?.name || 'Jogador';
      const time = s.team?.shortName || s.team?.name || 'Time';
      const gols = s.goals ?? 0;
      console.log(`   ${idx + 1}º ${jogador} (${time}) - ${gols} gols`);
    });
  } catch (e) {
    console.error(`❌ Falha:`, e.message);
  }
}

async function rodar() {
  await testarArtilharia('PL', 'Premier League');
  await testarArtilharia('BSA', 'Brasileirão Série A');
  console.log('\n====================================================\n');
}

rodar();