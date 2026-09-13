// scripts/mapear-fases-copa-brasil.mjs

const ESPN_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  Accept: 'application/json',
  Referer: 'https://www.espn.com/',
};

async function mapearFasesFinais() {
  console.log('🔍 Mapeando Copa do Brasil da 5ª Fase até a Final (limit=250)...\n');

  try {
    const res = await fetch(
      'https://site.api.espn.com/apis/site/v2/sports/soccer/bra.copa_do_brazil/scoreboard?dates=2026&limit=250',
      { headers: ESPN_HEADERS }
    );

    const data = await res.json();
    const eventos = data.events || [];

    // Fases que queremos descartar (início do ano sem os grandes)
    const fasesDescartar = ['first-round', 'second-round', 'third-round', 'fourth-round'];

    const porFase = {};

    eventos.forEach((ev) => {
      const slugFase = ev.season?.slug || ev.week?.text || 'outros';
      
      // Ignora as fases iniciais
      if (fasesDescartar.includes(slugFase)) return;

      if (!porFase[slugFase]) porFase[slugFase] = [];

      const comp = ev.competitions?.[0];
      const home = comp?.competitors?.[0]?.team?.displayName || 'Casa';
      const away = comp?.competitors?.[1]?.team?.displayName || 'Visitante';
      const nota = comp?.notes?.[0]?.headline || '';

      porFase[slugFase].push({
        jogo: `${home} x ${away}`,
        data: ev.date?.split('T')[0],
        nota
      });
    });

    console.log(`📋 FASES DECISIVAS ENCONTRADAS:\n`);
    Object.keys(porFase).forEach((slug) => {
      console.log(`🏆 Fase: "${slug}" (${porFase[slug].length} jogos)`);
      console.log(`   Exemplo: ${porFase[slug][0].jogo} em ${porFase[slug][0].data} (${porFase[slug][0].nota || 'Sem nota'})\n`);
    });

  } catch (e) {
    console.error('Erro:', e.message);
  }
}

mapearFasesFinais();