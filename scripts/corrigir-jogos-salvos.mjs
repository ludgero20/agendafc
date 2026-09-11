// scripts/corrigir-jogos-salvos.mjs
import fs from 'fs/promises';
import path from 'path';

async function corrigirJogos() {
  const filePath = path.join(process.cwd(), 'public', 'jogos.json');
  const raw = await fs.readFile(filePath, 'utf-8');
  const data = JSON.parse(raw);
  const jogos = data.jogosSemana || [];

  const timesChampionship = ['watford', 'stoke city', 'sheffield united', 'wolverhampton', 'leeds', 'sunderland'];

  const jogosCorrigidos = jogos.map(jogo => {
    const t1 = (jogo.time1 || '').toLowerCase();
    const t2 = (jogo.time2 || '').toLowerCase();
    let camp = jogo.campeonato;
    let div = jogo.divisao;

    // Se for time inglês da 2ª divisão, move para Championship
    if (timesChampionship.some(t => t1.includes(t) || t2.includes(t))) {
      camp = 'Championship';
      div = undefined;
    }
    // Se for Série B do Brasil com divisao "segunda divisão", limpa para "Série B"
    else if (camp.toLowerCase().includes('brasileir') && (div?.toLowerCase().includes('segunda') || camp.toLowerCase().includes('segunda'))) {
      camp = 'Série B';
      div = undefined;
    }

    return {
      ...jogo,
      campeonato: camp,
      divisao: div
    };
  });

  await fs.writeFile(filePath, JSON.stringify({ jogosSemana: jogosCorrigidos }, null, 2));
  console.log('✅ public/jogos.json corrigido com sucesso! Watford x Stoke foi para Championship e os jogos do Brasil para Série B.');
}

corrigirJogos();