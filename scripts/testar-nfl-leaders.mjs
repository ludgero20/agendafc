// scripts/testar-nfl-leaders.mjs

const ESPN_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  Accept: 'application/json',
  Referer: 'https://www.espn.com/',
};

async function inspecionarCategorias() {
  const url = `https://site.web.api.espn.com/apis/common/v3/sports/football/nfl/statistics/byathlete?region=us&lang=en&contentorigin=espn&isqualified=true&page=1&limit=3&category=offense:passing&sort=passing.passingYards:desc`;

  try {
    const res = await fetch(url, { headers: ESPN_HEADERS });
    const data = await res.json();

    console.log('📋 CATEGORIAS DISPONÍVEIS NO RETORNO:');
    (data.categories || []).forEach((cat, idx) => {
      console.log(`\n👉 Índice [${idx}] - Nome: "${cat.name}" (${cat.displayName || 'Sem nome'})`);
      console.log(`   Colunas:`, cat.labels || cat.names);
    });

    console.log('\n====================================================');
    console.log('📊 ATLETAS COM OS VALORES POR CATEGORIA:');
    const atleta = data.athletes?.[0];
    console.log(`Nome: ${atleta?.athlete?.displayName} (${atleta?.athlete?.teamShortName} - ${atleta?.athlete?.position?.abbreviation})`);

    (atleta?.categories || []).forEach((cat, idx) => {
      console.log(`   Categoria [${idx}]:`, cat.totals);
    });

  } catch (e) {
    console.error(e.message);
  }
}

inspecionarCategorias();