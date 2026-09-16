// app/api/admin/gerar-copy-post/route.ts
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

type JogoSimples = {
  time1: string;
  time2: string;
  hora: string;
  canal: string;
  campeonato?: string;
};

// Calcula a contagem real de caracteres no X considerando encurtamento t.co (23 caracteres por URL)
function calcularCaracteresX(texto: string): number {
  const textoComUrlPadrao = texto.replace(/(?:https?:\/\/)?agendafc\.com\.br[^\s]*/gi, '12345678901234567890123');
  return textoComUrlPadrao.length;
}

// Gerador de fallback elegante caso a API do Gemini esteja temporariamente indisponível
function gerarCopyFallback(jogos: JogoSimples[], dataLabel: string): string {
  const diaTexto = dataLabel === 'amanha' ? 'amanhã' : 'hoje';
  const jogoPrincipal = jogos[0];
  const outrosJogos = jogos.slice(1);

  let linhas = [
    `🔥 Dia de jogão ${diaTexto}! ${jogoPrincipal.time1} x ${jogoPrincipal.time2} às ${jogoPrincipal.hora} (${jogoPrincipal.canal})`
  ];

  for (const j of outrosJogos) {
    linhas.push(`• ${j.time1} x ${j.time2} às ${j.hora} | ${j.canal}`);
  }

  linhas.push(`📲 Confira o guia completo em agendafc.com.br`);

  let copy = linhas.join('\n');
  if (calcularCaracteresX(copy) > 275) {
    // Versão ultra-compacta
    copy = `⚽ Jogos de ${diaTexto} na TV:\n` +
      jogos.map(j => `${j.time1} x ${j.time2} (${j.hora} - ${j.canal})`).join('\n') +
      `\n📲 Veja tudo em agendafc.com.br`;
  }

  return copy;
}

export async function POST(request: Request) {
  try {
    const { senha, jogos, dataLabel } = await request.json();

    const senhaCorreta = process.env.ADMIN_PASSWORD;
    if (!senhaCorreta || senha !== senhaCorreta) {
      return NextResponse.json({ success: false, error: 'Acesso negado: Senha incorreta.' }, { status: 401 });
    }

    if (!Array.isArray(jogos) || jogos.length < 1) {
      return NextResponse.json({ success: false, error: 'Selecione pelo menos um jogo para gerar a legenda.' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    const diaReferencia = dataLabel === 'amanha' ? 'amanhã' : 'hoje';

    // Se não tiver chave de API configurada, utiliza o gerador inteligente local
    if (!apiKey) {
      const copyLocal = gerarCopyFallback(jogos, dataLabel);
      const chars = calcularCaracteresX(copyLocal);
      return NextResponse.json({
        success: true,
        texto: copyLocal,
        caracteres: chars,
        validoParaX: chars <= 280,
        origem: 'template_local'
      });
    }

    const listaFormatada = jogos
      .map((j: JogoSimples, idx: number) => `${idx + 1}. ${j.time1} x ${j.time2} às ${j.hora} (${j.canal}) - ${j.campeonato || 'Futebol'}`)
      .join('\n');

    const prompt = `Você é o social media do site "Agenda FC" (agendafc.com.br), um guia rápido de onde assistir esportes ao vivo.
Crie um tweet curto, dinâmico e provocativo sobre os jogos de ${diaReferencia}.

JOGOS SELECIONADOS:
${listaFormatada}

REGRAS OBRIGATÓRIAS:
1. Tom: Torcedor brasileiro, engajador e direto ao ponto.
2. Destaque o principal confronto com um gancho provocativo na primeira linha.
3. Mencione os horários e canais de forma extremamente compacta.
4. Finalize OBRIGATORIAMENTE com: "Confira todos os jogos em agendafc.com.br"
5. LIMITE ESTRITO: O texto total não pode ultrapassar 230 caracteres (para sobrar espaço seguro no limite de 280 caracteres do X).
6. Responda APENAS com o texto final do post, sem aspas, sem hashtags em excesso e sem explicações.`;

    // Tentativa em cascata: gemini-3.8-flash -> gemini-3.6-flash -> gemini-2.5-flash -> gemini-2.0-flash -> gemini-1.5-flash
    const modelos = ['gemini-3.8-flash', 'gemini-3.6-flash', 'gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
    let textoGerado = '';

    for (const modelo of modelos) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent?key=${apiKey}`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 300,
            }
          })
        });

        if (res.ok) {
          const data = await res.json();
          const resposta = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (resposta && resposta.trim().length > 10) {
            textoGerado = resposta.trim();
            break;
          }
        }
      } catch (err) {
        console.warn(`Tentativa com ${modelo} falhou, tentando próximo...`, err);
      }
    }

    // Se todas as chamadas à API falharem, aciona o fallback de segurança
    if (!textoGerado) {
      textoGerado = gerarCopyFallback(jogos, dataLabel);
    }

    // Garante que o link do site esteja presente
    if (!textoGerado.toLowerCase().includes('agendafc.com.br')) {
      textoGerado += '\n\nConfira todos os jogos em agendafc.com.br';
    }

    const totalCharsX = calcularCaracteresX(textoGerado);

    return NextResponse.json({
      success: true,
      texto: textoGerado,
      caracteres: totalCharsX,
      validoParaX: totalCharsX <= 280,
      origem: 'gemini'
    });

  } catch (error: any) {
    console.error('Erro ao gerar copy do post:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

