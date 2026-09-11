// scripts/sugerir-post.mjs
import fs from 'fs/promises';
import path from 'path';

// Pesos de relevância para o público brasileiro
const pesosCampeonatos = {
  'Brasileirão': 100,
  'Série B': 90,
  'Copa do Brasil': 100,
  'Libertadores': 100,
  'Copa Libertadores': 100,
  'Sul-Americana': 85,
  'Champions League': 95,
  'Premier League': 90,
  'La Liga': 85,
  'NFL': 80,
  'Fórmula 1': 80,
  'NBA': 80,
  'Nations League': 75,
  'Serie A': 70,
  'Bundesliga': 70,
  'Ligue 1': 65,
  'Saudi Pro League': 60,
  'Copa da Liga Inglesa': 65,
  'Championship': 50,
  'Eredivisie': 50,
};

const clubesDeMassa = [
  'flamengo', 'corinthians', 'palmeiras', 'são paulo', 'sao paulo',
  'santos', 'vasco', 'gremio', 'grêmio', 'internacional', 'inter',
  'cruzeiro', 'atlético-mg', 'atletico-mg', 'botafogo', 'fluminense',
  'bahia', 'sport', 'real madrid', 'barcelona', 'manchester city',
  'liverpool', 'arsenal', 'psg', 'bayern', 'lakers', 'warriors', 'chiefs'
];

function calcularRelevancia(jogo) {
  let pontos = pesosCampeonatos[jogo.campeonato] || 30;

  const t1 = (jogo.time1 || '').toLowerCase();
  const t2 = (jogo.time2 || '').toLowerCase();

  // Bônus se tiver clube de grande torcida
  if (clubesDeMassa.some(c => t1.includes(c) || t2.includes(c))) {
    pontos += 40;
  }

  // Bônus para F1 se for classificação ou corrida
  if (jogo.campeonato === 'Fórmula 1') {
    const ev = (jogo.evento_nome || '').toLowerCase();
    if (ev.includes('corrida') || ev.includes('classificação') || ev.includes('qualifying')) {
      pontos += 50;
    }
  }

  return pontos;
}

async function gerarSugestaoPost() {
  const argumento = (process.argv[2] || 'hoje').toLowerCase();
  const jogosPath = path.join(process.cwd(), 'public', 'jogos.json');

  try {
    const raw = await fs.readFile(jogosPath, 'utf-8');
    const todosJogos = JSON.parse(raw).jogosSemana || [];

    const agora = new Date();
    const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' });

    let dataAlvo = new Date(agora);
    if (argumento === 'amanha' || argumento === 'amanhã') {
      dataAlvo.setDate(dataAlvo.getDate() + 1);
    }

    const dataAlvoStr = formatter.format(dataAlvo).trim();
    const jogosFiltrados = todosJogos.filter(j => j.data === dataAlvoStr);

    if (jogosFiltrados.length === 0) {
      console.log(`\n⚠️ Nenhum jogo encontrado no jogos.json para ${argumento.toUpperCase()} (${dataAlvoStr}).\n`);
      return;
    }

    // 1. Ordena os jogos pelo Score de Relevância
    const jogosRanqueados = [...jogosFiltrados].sort((a, b) => {
      const scoreA = calcularRelevancia(a);
      const scoreB = calcularRelevancia(b);
      if (scoreA !== scoreB) return scoreB - scoreA;
      return a.hora.localeCompare(b.hora);
    });

    const [ano, mes, dia] = dataAlvoStr.split('-').map(Number);
    const dataObj = new Date(ano, mes - 1, dia, 12);
    const diaFormatado = dataObj.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' });

    const titulo = argumento.includes('amanh') 
      ? `⚽ JOGOS DE AMANHÃ NA TV (${diaFormatado})\n\n`
      : `⚽ JOGOS DE HOJE NA TV (${diaFormatado})\n\n`;

    const linkRodape = `\n👉 Guia completo e tabelas:\nagendafc.com.br`;
    const LIMITE_TWITTER = 280;

    let linhasJogos = [];

    for (const j of jogosRanqueados) {
      let linha = '';
      if (j.time1 && j.time2) {
        linha = `🕒 ${j.hora} - ${j.time1} x ${j.time2} (${j.canal})\n`;
      } else if (j.evento_nome) {
        linha = `🏎️ ${j.hora} - ${j.evento_nome} (${j.canal})\n`;
      }

      if (!linha) continue;

      // Testa se adicionar essa linha estoura o limite de 280 caracteres
      const tweetProvisorio = `${titulo}${linhasJogos.join('')}${linha}${linkRodape}`;

      if (tweetProvisorio.length <= LIMITE_TWITTER) {
        linhasJogos.push(linha);
      } else {
        // Se estourar 280, para e não adiciona mais linhas
        break;
      }
    }

    const tweetFinal = `${titulo}${linhasJogos.join('')}${linkRodape}`;

    console.log('\n======================================================');
    console.log(`📋 POST OTIMIZADO PARA O X (${argumento.toUpperCase()}):`);
    console.log('======================================================\n');
    console.log(tweetFinal);
    console.log('\n======================================================');
    console.log(`📊 Caracteres: ${tweetFinal.length} / 280 (✅ Válido para o X!)`);
    console.log(`🏆 Jogos mais relevantes selecionados: ${linhasJogos.length} confrontos`);
    console.log('======================================================\n');

  } catch (error) {
    console.error('Erro ao ler jogos.json:', error.message);
  }
}

gerarSugestaoPost();