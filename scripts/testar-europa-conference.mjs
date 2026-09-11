// scripts/testar-europa-conference.mjs

const ESPN_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  Accept: 'application/json',
  Referer: 'https://www.espn.com/',
};

async function testarCompeticao(nome, slug) {
  console.log(`\n====================================================`);
  console.log(`🧪 TESTANDO ${nome.toUpperCase()} (${slug})`);
  console.log(`====================================================`);

  try {
    const resTabela = await fetch(
      `https://site.api.espn.com/apis/v2/sports/soccer/${slug}/standings`,
      { headers: ESPN_HEADERS }
    );

    if (!resTabela.ok) {
      console.log(`❌ Erro ao buscar tabela: Status ${resTabela.status}`);
      return;
    }

    const data = await resTabela.json();
    console.log(`✅ Sucesso na Tabela! Torneio: ${data.name || nome}`);

    // Extrai equipes
    let totalTimes = 0;
    const extrair = (item) => {
      if (item.standings?.entries) {
        totalTimes += item.standings.entries.length;
        const grupoNome = item.name ? `[${item.name}] ` : '';
        console.log(`\n🏆 ${grupoNome}${item.standings.entries.length} clubes encontrados:`);
        item.standings.entries.slice(0, 5).forEach((e, idx) => {
          const time = e.team?.displayName || e.team?.name;
          const pts = e.stats?.find((s) => s.name === 'points')?.value ?? 0;
          console.log(`   ${idx + 1}º ${time} - ${pts} pts`);
        });
        if (item.standings.entries.length > 5) {
          console.log(`   ... e mais ${item.standings.entries.length - 5} clubes.`);
        }
      }
      if (item.children && Array.isArray(item.children)) {
        item.children.forEach(extrair);
      }
    };

    if (data.children && data.children.length > 0) {
      data.children.forEach(extrair);
    } else if (data.standings?.entries) {
      extrair(data);
    }

    console.log(`\n📊 Total geral de clubes no torneio: ${totalTimes}`);
  } catch (error) {
    console.error(`❌ Erro em ${nome}:`, error.message);
  }
}

async function executarTestes() {
  await testarCompeticao('UEFA Europa League', 'uefa.europa');
  await testarCompeticao('UEFA Conference League', 'uefa.europa.conf');
  console.log(`\n====================================================\n`);
}

executarTestes();