// scripts/testar-nations-league.mjs

const ESPN_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  Accept: 'application/json',
  Referer: 'https://www.espn.com/',
};

async function testarNationsLeague() {
  console.log('====================================================');
  console.log('🧪 TESTANDO UEFA NATIONS LEAGUE NA ESPN (uefa.nations)');
  console.log('====================================================\n');

  // 1. TESTE DE CLASSIFICAÇÃO / TABELAS / GRUPOS
  console.log('📡 1. Buscando Classificação e Grupos...');
  try {
    const resTabela = await fetch(
      'https://site.api.espn.com/apis/v2/sports/soccer/uefa.nations/standings',
      { headers: ESPN_HEADERS }
    );

    if (!resTabela.ok) {
      console.log(`❌ Erro ao buscar tabela: Status ${resTabela.status}`);
    } else {
      const dataTabela = await resTabela.json();
      console.log(`✅ Sucesso! Nome da Liga: ${dataTabela.name || 'UEFA Nations League'}`);

      // Percorre os grupos da Nations League
      const extrairGrupos = (item, nivel = 0) => {
        const espacos = '  '.repeat(nivel);
        if (item.name && item.standings?.entries) {
          console.log(`\n${espacos}🏆 ${item.name} (${item.standings.entries.length} seleções):`);
          item.standings.entries.forEach((e, idx) => {
            const time = e.team?.displayName || e.team?.name;
            const pts = e.stats?.find((s) => s.name === 'points')?.value ?? 0;
            const j = e.stats?.find((s) => s.name === 'gamesPlayed')?.value ?? 0;
            console.log(`${espacos}   ${idx + 1}º ${time} - ${pts} pts (${j} jogos)`);
          });
        }

        if (item.children && Array.isArray(item.children)) {
          item.children.forEach((c) => extrairGrupos(c, nivel + 1));
        }
      };

      if (dataTabela.children && dataTabela.children.length > 0) {
        dataTabela.children.forEach((c) => extrairGrupos(c, 0));
      } else {
        console.log('⚠️ Formato diferente ou em recesso.');
      }
    }
  } catch (error) {
    console.error('❌ Exceção na tabela:', error.message);
  }

  // 2. TESTE DE JOGOS E CALENDÁRIO
  console.log('\n----------------------------------------------------');
  console.log('📡 2. Buscando Jogos e Calendário...');
  try {
    const resJogos = await fetch(
      'https://site.api.espn.com/apis/site/v2/sports/soccer/uefa.nations/scoreboard',
      { headers: ESPN_HEADERS }
    );

    if (!resJogos.ok) {
      console.log(`❌ Erro ao buscar jogos: Status ${resJogos.status}`);
    } else {
      const dataJogos = await resJogos.json();
      const eventos = dataJogos.events || [];
      const calendar = dataJogos.leagues?.[0]?.calendar || [];

      console.log(`✅ Total de ${eventos.length} jogos na rodada atual do endpoint.`);
      console.log(`📅 Datas registradas no calendário da ESPN: ${calendar.length}`);

      if (eventos.length > 0) {
        console.log('\nPróximos confrontos encontrados:');
        eventos.slice(0, 8).forEach((ev) => {
          const comp = ev.competitions?.[0];
          const home = comp?.competitors?.find((c) => c.homeAway === 'home') || comp?.competitors?.[0];
          const away = comp?.competitors?.find((c) => c.homeAway === 'away') || comp?.competitors?.[1];
          const dataBR = new Date(ev.date).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
          const horaBR = new Date(ev.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' });

          console.log(`⚽ [${dataBR} ${horaBR}] ${home?.team?.displayName} x ${away?.team?.displayName} (${ev.status?.type?.shortDetail || 'Agendado'})`);
        });
      }
    }
  } catch (error) {
    console.error('❌ Exceção nos jogos:', error.message);
  }

  console.log('\n====================================================');
}

testarNationsLeague();