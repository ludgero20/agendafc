// scripts/testar-copas-sulamericanas.mjs

const ESPN_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  Accept: 'application/json',
  Referer: 'https://www.espn.com/',
};

async function testarCopa(nome, slug) {
  console.log(`\n====================================================`);
  console.log(`🧪 TESTANDO ${nome.toUpperCase()} (${slug})`);
  console.log(`====================================================`);

  // 1. TESTE DE CLASSIFICAÇÃO / TABELA
  console.log('📡 1. Buscando Standings/Tabela...');
  try {
    const resTabela = await fetch(
      `https://site.api.espn.com/apis/v2/sports/soccer/${slug}/standings`,
      { headers: ESPN_HEADERS }
    );

    if (!resTabela.ok) {
      console.log(`ℹ️ Resposta da Tabela: Status ${resTabela.status} (Esperado para torneios 100% mata-mata como Copa do Brasil)`);
    } else {
      const dataTabela = await resTabela.json();
      console.log(`✅ Sucesso na Tabela! Nome: ${dataTabela.name || nome}`);

      let gruposEncontrados = 0;
      const extrair = (item) => {
        if (item.name && item.standings?.entries) {
          gruposEncontrados++;
          console.log(`   🏆 ${item.name} com ${item.standings.entries.length} clubes (Ex: ${item.standings.entries[0]?.team?.displayName || 'Time'})`);
        }
        if (item.children && Array.isArray(item.children)) {
          item.children.forEach(extrair);
        }
      };

      if (dataTabela.children && dataTabela.children.length > 0) {
        dataTabela.children.forEach(extrair);
      } else if (dataTabela.standings?.entries) {
        console.log(`   📊 Tabela única com ${dataTabela.standings.entries.length} clubes.`);
      }

      console.log(`   Total de grupos mapeados: ${gruposEncontrados}`);
    }
  } catch (error) {
    console.log(`❌ Erro tabela: ${error.message}`);
  }

  // 2. TESTE DE JOGOS / FASES / SCOREBOARD
  console.log('\n📡 2. Buscando Jogos e Fases (Scoreboard)...');
  try {
    const resJogos = await fetch(
      `https://site.api.espn.com/apis/site/v2/sports/soccer/${slug}/scoreboard`,
      { headers: ESPN_HEADERS }
    );

    if (!resJogos.ok) {
      console.log(`❌ Erro ao buscar jogos: Status ${resJogos.status}`);
    } else {
      const dataJogos = await resJogos.json();
      const eventos = dataJogos.events || [];
      const calendar = dataJogos.leagues?.[0]?.calendar || [];

      console.log(`✅ Partidas retornadas no endpoint atual: ${eventos.length}`);
      console.log(`📅 Datas no calendário da competição: ${calendar.length}`);

      if (eventos.length > 0) {
        console.log('\n   Partidas encontradas:');
        eventos.slice(0, 6).forEach((ev) => {
          const comp = ev.competitions?.[0];
          const home = comp?.competitors?.find((c) => c.homeAway === 'home') || comp?.competitors?.[0];
          const away = comp?.competitors?.find((c) => c.homeAway === 'away') || comp?.competitors?.[1];
          const dataBR = new Date(ev.date).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
          const horaBR = new Date(ev.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' });
          const faseNota = comp?.notes?.[0]?.headline || ev.status?.type?.shortDetail || 'Agendado';

          const placar = ev.status?.type?.state !== 'pre' 
            ? `(${home?.score ?? 0} x ${away?.score ?? 0})` 
            : 'vs';

          console.log(`   ⚽ [${dataBR} ${horaBR}] ${home?.team?.displayName} ${placar} ${away?.team?.displayName} | Fase: ${faseNota}`);
        });
      } else {
        console.log('   ℹ️ Sem jogos hoje no scoreboard padrão.');
      }
    }
  } catch (error) {
    console.log(`❌ Erro jogos: ${error.message}`);
  }
}

async function executarTestes() {
  await testarCopa('Copa Libertadores', 'conmebol.libertadores');
  await testarCopa('Copa Sul-Americana', 'conmebol.sudamericana');
  await testarCopa('Copa do Brasil', 'bra.copa_do_brasil');
  console.log(`\n====================================================\n`);
}

executarTestes();