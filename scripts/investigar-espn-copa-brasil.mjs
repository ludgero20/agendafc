// scripts/investigar-espn-copa-brasil.mjs

const ESPN_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  Accept: 'application/json',
  Referer: 'https://www.espn.com/',
};

async function verificarFasesDosJogos() {
  console.log('🔍 Inspecionando as fases dos 100 jogos retornados pela ESPN...\n');

  try {
    const res = await fetch(
      'https://site.api.espn.com/apis/site/v2/sports/soccer/bra.copa_do_brazil/scoreboard?dates=2026&limit=100',
      { headers: ESPN_HEADERS }
    );

    const data = await res.json();
    const eventos = data.events || [];

    // Mapeia todas as fases encontradas
    const fasesDetectadas = new Set();
    const exemplosPorFase = {};

    eventos.forEach((ev) => {
      const comp = ev.competitions?.[0];
      const home = comp?.competitors?.[0]?.team?.displayName || 'Casa';
      const away = comp?.competitors?.[1]?.team?.displayName || 'Visitante';
      
      // Checa notas e headline
      const nota = comp?.notes?.[0]?.headline || ev.season?.slug || ev.status?.type?.shortDetail || 'Sem Fase';
      fasesDetectadas.add(nota);

      if (!exemplosPorFase[nota]) {
        exemplosPorFase[nota] = `${home} x ${away}`;
      }
    });

    console.log(`✅ Fases distintas identificadas nos jogos: ${fasesDetectadas.size}\n`);
    Array.from(fasesDetectadas).forEach((fase) => {
      console.log(`📌 Rótulo: "${fase}"`);
      console.log(`   Exemplo: ${exemplosPorFase[fase]}\n`);
    });

  } catch (e) {
    console.log('❌ Erro:', e.message);
  }
}

verificarFasesDosJogos();