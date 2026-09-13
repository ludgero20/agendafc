// scripts/testar-conmebol-matamata.mjs

const ESPN_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  Accept: 'application/json',
  Referer: 'https://www.espn.com/',
};

async function testarMataMata(nome, slug) {
  console.log(`\n====================================================`);
  console.log(`🧪 TESTANDO MATA-MATA: ${nome.toUpperCase()} (${slug})`);
  console.log(`====================================================`);

  try {
    const res = await fetch(
      `https://site.web.api.espn.com/apis/site/v2/sports/soccer/${slug}/scoreboard?dates=2026&limit=250`,
      { headers: ESPN_HEADERS }
    );

    if (!res.ok) {
      console.log(`❌ Erro: Status ${res.status}`);
      return;
    }

    const data = await res.json();
    const eventos = data.events || [];
    console.log(`✅ Total de jogos retornados no ano: ${eventos.length}`);

    // Agrupa por season.slug
    const porFase = {};

    eventos.forEach((ev) => {
      const slugFase = ev.season?.slug || ev.week?.text || 'outros';
      if (!porFase[slugFase]) porFase[slugFase] = [];

      const comp = ev.competitions?.[0];
      const home = comp?.competitors?.[0]?.team?.displayName || 'Casa';
      const away = comp?.competitors?.[1]?.team?.displayName || 'Visitante';
      const nota = comp?.notes?.[0]?.headline || '';

      porFase[slugFase].push({
        jogo: `${home} x ${away}`,
        data: ev.date?.split('T')[0],
        nota,
      });
    });

    console.log('\n📋 FASES DETECTADAS:');
    Object.keys(porFase).forEach((fase) => {
      console.log(`🏆 Fase: "${fase}" (${porFase[fase].length} jogos)`);
      console.log(`   Exemplo: ${porFase[fase][0].jogo} em ${porFase[fase][0].data} | Nota: ${porFase[fase][0].nota || 'Sem nota'}\n`);
    });
  } catch (e) {
    console.error(`❌ Erro:`, e.message);
  }
}

async function rodar() {
  await testarMataMata('Copa Libertadores', 'conmebol.libertadores');
  await testarMataMata('Copa Sul-Americana', 'conmebol.sudamericana');
  console.log('====================================================\n');
}

rodar();