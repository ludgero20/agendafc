// scripts/corrigir-jogos-salvos.mjs
import fs from 'fs/promises';
import path from 'path';

async function corrigirJogos() {
  const filePath = path.join(process.cwd(), 'public', 'jogos.json');
  const raw = await fs.readFile(filePath, 'utf-8');
  const data = JSON.parse(raw);
  const jogos = data.jogosSemana || [];

  const timesChampionship = ['watford', 'stoke city', 'sheffield united', 'wolverhampton', 'leeds', 'sunderland'];
  const timesUruguai = ['miramar', 'uruguay montevideo', 'plaza colonia', 'paysandú-uru', 'tacuarembó', 'huracán-uru', 'rentistas', 'oriental', 'la luz', 'atenas', 'cerito', 'river plate-uru'];

  const jogosCorrigidos = jogos.map(jogo => {
    const t1 = (jogo.time1 || '').toLowerCase();
    const t2 = (jogo.time2 || '').toLowerCase();
    let camp = jogo.campeonato;
    let div = jogo.divisao;
    let fase = jogo.fase;
    let pais = jogo.pais;

    // Se for time uruguaio da 2ª divisão
    if (timesUruguai.some(t => t1.includes(t) || t2.includes(t))) {
      camp = 'Campeonato Uruguaio (2ª Divisão)';
      pais = 'Uruguai';
      div = undefined;
      if (fase && (fase.includes('divis') || fase.includes('série'))) fase = undefined;
    }
    // Se for time inglês da 2ª divisão, move para Championship
    else if (timesChampionship.some(t => t1.includes(t) || t2.includes(t))) {
      camp = 'Championship';
      pais = 'Inglaterra';
      div = undefined;
    }
    // Se for Série B do Brasil com divisao "segunda divisão", limpa para "Série B"
    else if (camp.toLowerCase().includes('brasileir') && (div?.toLowerCase().includes('segunda') || camp.toLowerCase().includes('segunda'))) {
      camp = 'Série B';
      pais = 'Brasil';
      div = undefined;
    }

    if (!pais) {
      if (camp.includes('Brasil') || camp === 'Série B' || camp === 'Copa Paulista') pais = 'Brasil';
      else if (camp === 'Champions League Feminina') pais = 'Europa';
      else if (camp === 'MLS') pais = 'Estados Unidos';
    }

    return {
      ...jogo,
      campeonato: camp,
      pais,
      divisao: div,
      fase
    };
  });

  await fs.writeFile(filePath, JSON.stringify({ jogosSemana: jogosCorrigidos }, null, 2));
  console.log('✅ public/jogos.json corrigido com sucesso! Watford x Stoke foi para Championship e os jogos do Brasil para Série B.');
}

corrigirJogos();