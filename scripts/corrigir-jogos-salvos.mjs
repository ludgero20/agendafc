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

  function limparNomeTime(nomeBruto) {
    if (!nomeBruto) return '';
    return nomeBruto
      .replace(/\s*\([Ff]\)\s*$/, '')
      .replace(/\s*\([Ff]em\)\s*$/, '')
      .replace(/\s*\([Ff]eminino\)\s*$/, '')
      .replace(/\s+feminino\s*$/i, '')
      .replace(/\s+fem\s*$/i, '')
      .trim();
  }

  function normalizarParaChave(texto) {
    if (!texto) return '';
    return texto
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '');
  }

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

    if (camp.toLowerCase().includes('champions league') && camp.toLowerCase().includes('fem')) {
      camp = 'Champions League Feminina';
      pais = 'Europa';
    }

    if (!pais) {
      if (camp.includes('Brasil') || camp === 'Série B' || camp === 'Copa Paulista') pais = 'Brasil';
      else if (camp.includes('Champions League')) pais = 'Europa';
      else if (camp === 'MLS') pais = 'Estados Unidos';
    }

    return {
      ...jogo,
      time1: limparNomeTime(jogo.time1),
      time2: limparNomeTime(jogo.time2),
      campeonato: camp,
      pais,
      divisao: div,
      fase
    };
  });

  // Deduplicação inteligente
  const jogosDeduplicados = jogosCorrigidos.filter((j, index, arr) => {
    const chave = `${j.data}-${normalizarParaChave(j.time1)}-${normalizarParaChave(j.time2)}`;
    return index === arr.findIndex(x => `${x.data}-${normalizarParaChave(x.time1)}-${normalizarParaChave(x.time2)}` === chave);
  });

  await fs.writeFile(filePath, JSON.stringify({ jogosSemana: jogosDeduplicados }, null, 2));
  console.log(`✅ public/jogos.json corrigido e deduplicado! De ${jogos.length} jogos para ${jogosDeduplicados.length} jogos.`);
}

corrigirJogos();