// scripts/descobrir-copa-brasil.mjs

const ESPN_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  Accept: 'application/json',
  Referer: 'https://www.espn.com/',
};

async function testarCopaDoBrasil() {
  const slug = 'bra.copa_do_brazil'; // 🎯 Com "z"!
  console.log(`🔍 Testando na ESPN com o slug: "${slug}"...\n`);

  try {
    const res = await fetch(
      `https://site.api.espn.com/apis/site/v2/sports/soccer/${slug}/scoreboard`,
      { headers: ESPN_HEADERS }
    );

    if (res.ok) {
      const data = await res.json();
      console.log(`🎯 SUCESSO TOTAL! O slug oficial é: "${slug}"`);
      console.log(`   Nome do torneio: ${data.leagues?.[0]?.name || 'Copa do Brasil'}`);
      console.log(`   Eventos retornados: ${(data.events || []).length}`);

      if (data.events && data.events.length > 0) {
        console.log('\nPartidas encontradas:');
        data.events.slice(0, 5).forEach(ev => {
          const comp = ev.competitions?.[0];
          const home = comp?.competitors?.find(c => c.homeAway === 'home') || comp?.competitors?.[0];
          const away = comp?.competitors?.find(c => c.homeAway === 'away') || comp?.competitors?.[1];
          const fase = comp?.notes?.[0]?.headline || ev.status?.type?.shortDetail || 'Agendado';
          console.log(`⚽ ${home?.team?.displayName} x ${away?.team?.displayName} | Fase: ${fase}`);
        });
      }
    } else {
      console.log(`❌ Retornou Status ${res.status}`);
    }
  } catch (e) {
    console.log(`❌ Erro: ${e.message}`);
  }
}

testarCopaDoBrasil();