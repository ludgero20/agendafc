// scripts/testar-nba.mjs

const ESPN_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  Accept: 'application/json',
  Referer: 'https://www.espn.com/',
};

async function testarNBA() {
  console.log('====================================================');
  console.log('🧪 TESTANDO MOTOR DA NBA NA ESPN (basketball/nba)');
  console.log('====================================================\n');

  // 1. TESTE DE CLASSIFICAÇÃO (CONFERÊNCIAS LESTE E OESTE)
  console.log('📡 1. Buscando Classificação das Conferências Leste e Oeste...');
  try {
    const resTabela = await fetch(
      'https://site.web.api.espn.com/apis/v2/sports/basketball/nba/standings?region=us&lang=en',
      { headers: ESPN_HEADERS }
    );

    if (!resTabela.ok) {
      console.log(`❌ Erro ao buscar tabela: Status ${resTabela.status}`);
    } else {
      const dataTabela = await resTabela.json();
      console.log(`✅ Sucesso! Nome da Liga: ${dataTabela.name || 'NBA'}`);

      // Percorre as Conferências / Divisões
      const extrairConferencias = (item) => {
        if (item.name && item.standings?.entries) {
          console.log(`\n🏀 [${item.name}] - ${item.standings.entries.length} franquias:`);
          item.standings.entries.slice(0, 8).forEach((e, idx) => {
            const time = e.team?.displayName || e.team?.name;
            const v = e.stats?.find((s) => s.name === 'wins')?.value ?? 0;
            const d = e.stats?.find((s) => s.name === 'losses')?.value ?? 0;
            const pct = e.stats?.find((s) => s.name === 'winPercent')?.displayValue ?? '.000';
            const streak = e.stats?.find((s) => s.name === 'streak')?.displayValue ?? '-';
            console.log(`   ${idx + 1}º ${time} - ${v}V ${d}D (% ${pct}) Streak: ${streak}`);
          });
          if (item.standings.entries.length > 8) {
            console.log(`   ... e mais ${item.standings.entries.length - 8} franquias.`);
          }
        }

        if (item.children && Array.isArray(item.children)) {
          item.children.forEach(extrairConferencias);
        }
      };

      if (dataTabela.children && dataTabela.children.length > 0) {
        dataTabela.children.forEach(extrairConferencias);
      } else if (dataTabela.standings?.entries) {
        extrairConferencias(dataTabela);
      }
    }
  } catch (error) {
    console.error('❌ Exceção na tabela:', error.message);
  }

  // 2. TESTE DE JOGOS E SCOREBOARD
  console.log('\n----------------------------------------------------');
  console.log('📡 2. Buscando Jogos e Calendário da NBA...');
  try {
    const resJogos = await fetch(
      'https://site.web.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard',
      { headers: ESPN_HEADERS }
    );

    if (!resJogos.ok) {
      console.log(`❌ Erro ao buscar jogos: Status ${resJogos.status}`);
    } else {
      const dataJogos = await resJogos.json();
      const eventos = dataJogos.events || [];
      const season = dataJogos.season || {};

      console.log(`✅ Temporada detectada: ${season.year || '2026/27'} (Tipo: ${season.type === 1 ? 'Pré-Temporada' : 'Temporada Regular'})`);
      console.log(`📅 Jogos encontrados no endpoint atual: ${eventos.length}`);

      if (eventos.length > 0) {
        console.log('\nPróximos confrontos da NBA:');
        eventos.slice(0, 6).forEach((ev) => {
          const comp = ev.competitions?.[0];
          const home = comp?.competitors?.find((c) => c.homeAway === 'home') || comp?.competitors?.[0];
          const away = comp?.competitors?.find((c) => c.homeAway === 'away') || comp?.competitors?.[1];
          const dataBR = new Date(ev.date).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
          const horaBR = new Date(ev.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' });

          console.log(`🏀 [${dataBR} ${horaBR}] ${home?.team?.displayName} x ${away?.team?.displayName} (${ev.status?.type?.shortDetail || 'Agendado'})`);
        });
      } else {
        console.log('ℹ️ Sem jogos hoje (período de recesso / aguardando abertura da pré-temporada em outubro).');
      }
    }
  } catch (error) {
    console.error('❌ Exceção nos jogos:', error.message);
  }

  console.log('\n====================================================\n');
}

testarNBA();