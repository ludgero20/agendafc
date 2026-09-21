// app/api/admin/gerar-copy-post/route.ts
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

type JogoEntrada = {
  time1?: string | null;
  time2?: string | null;
  campeonato?: string;
  hora: string;
  canal?: string;
  data?: string;
  evento_nome?: string | null;
  evento_descricao?: string | null;
};

// Fallback inteligente caso a API do Gemini esteja fora ou sem chave
function gerarCopyFallback(jogos: JogoEntrada[], titulo?: string): string {
  const primeiro = jogos[0];
  const ehF1 = jogos.some((j) => (j.campeonato || '').toLowerCase().includes('f1') || Boolean(j.evento_nome));
  const ehNFL = jogos.some((j) => (j.campeonato || '').toUpperCase().includes('NFL'));

  let cabecalho = '⚽ JOGOS IMPERDÍVEIS NA TV!';
  if (ehF1) cabecalho = '🏎️ FÓRMULA 1 NA TV!';
  else if (ehNFL) cabecalho = '🏈 RODADA DA NFL!';

  let linhas: string[] = [];
  jogos.slice(0, 3).forEach((j) => {
    if (j.time1 && j.time2) {
      linhas.push(`• ${j.hora} ${j.time1} x ${j.time2} (${j.canal || 'TV'})`);
    } else if (j.evento_nome) {
      linhas.push(`• ${j.hora} ${j.evento_nome} (${j.canal || 'Band'})`);
    }
  });

  const cta = 'Guia completo em agendafc.com.br';
  let tweet = `${cabecalho}\n\n${linhas.join('\n')}\n\n👉 ${cta}`;

  if (tweet.length > 275) {
    tweet = `${cabecalho}\n\n${linhas.slice(0, 2).join('\n')}\n\n👉 ${cta}`;
  }

  return tweet;
}

export async function POST(request: Request) {
  try {
    const { senha, jogos, contexto } = await request.json();

    const senhaCorreta = process.env.ADMIN_PASSWORD;
    if (senhaCorreta && senha !== senhaCorreta) {
      return NextResponse.json({ success: false, error: 'Acesso negado: Senha incorreta.' }, { status: 401 });
    }

    if (!Array.isArray(jogos) || jogos.length === 0) {
      return NextResponse.json({ success: false, error: 'Selecione pelo menos um jogo para gerar o post.' }, { status: 400 });
    }

    const ehF1 = jogos.some((j: JogoEntrada) => (j.campeonato || '').toLowerCase().includes('f1') || Boolean(j.evento_nome));
    const ehNFL = jogos.some((j: JogoEntrada) => (j.campeonato || '').toUpperCase().includes('NFL'));

    // Resumo dos jogos formatado para o prompt
    const listaFormatada = jogos
      .map((j: JogoEntrada) => {
        if (j.time1 && j.time2) {
          return `${j.time1} x ${j.time2} | ${j.campeonato || 'Futebol'} | ${j.hora} | ${j.canal || 'TV'}`;
        }
        return `${j.evento_nome || 'Sessão'} (${j.evento_descricao || 'F1'}) | ${j.hora} | ${j.canal || 'TV'}`;
      })
      .join('\n');

    let textoFinal = '';

    if (process.env.GEMINI_API_KEY) {
      const prompt = `Você é um social media esportivo de elite no X (Twitter) da página Agenda FC (agendafc.com.br).
Crie um tweet VIRAL, magnético e direto ao ponto divulgando os jogos/eventos esportivos selecionados abaixo.

LISTA DE EVENTOS:
${listaFormatada}
CONTEXTO ADICIONAL: ${contexto || 'Jogos selecionados para a programação'}

REGRAS RÍGIDAS & OBRIGATÓRIAS:
1. LIMITE MÁXIMO ABSOLUTO: 260 CARACTERES no total! (Muito importante: tweets com mais de 270 serão rejeitados).
2. Comece com um gancho forte esportivo (ex: destaque o maior clássico ou o GP/rodada) usando 1 ou 2 emojis relevantes.
3. Mencione os horários e confrontos de forma ultra concisa (ex: "16h Fla x Flu (Globo)").
4. Finalize OBRIGATORIAMENTE com a chamada: "👉 Guia em agendafc.com.br" ou "👉 Mais jogos: agendafc.com.br".
5. NÃO use hashtags ou limite a apenas 1 tag curta.
6. Retorne APENAS o texto do tweet, sem aspas e sem explicações.`;

      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
      const geminiRes = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 250,
          },
        }),
      });

      if (geminiRes.ok) {
        const geminiData = await geminiRes.json();
        const cand = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
        if (cand && typeof cand === 'string') {
          textoFinal = cand.trim().replace(/^["']|["']$/g, '');
        }
      }
    }

    // Se a IA não respondeu ou estourou, usa o gerador estruturado
    if (!textoFinal) {
      textoFinal = gerarCopyFallback(jogos, contexto);
    }

    // Garante garantia matemática de tamanho <= 280 caracteres
    if (textoFinal.length > 275) {
      // Ajuste de emergência caso o Gemini ultrapasse o limite
      const cta = '\n👉 Guia: agendafc.com.br';
      const tamanhoMax = 275 - cta.length;
      textoFinal = textoFinal.slice(0, tamanhoMax).trim() + '...' + cta;
    }

    const caracteres = textoFinal.length;
    const validoParaX = caracteres <= 280;

    return NextResponse.json({
      sucesso: true,
      texto: textoFinal,
      caracteres,
      validoParaX,
    });
  } catch (error: any) {
    console.error('Erro em gerar-copy-post:', error);
    return NextResponse.json({ sucesso: false, error: error.message }, { status: 500 });
  }
}
