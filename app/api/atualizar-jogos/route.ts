import { NextResponse } from 'next/server';
import { dicionarioCampeonatos } from '@/lib/campeonatos';

function extrairTextoHtml(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function GET(request: Request) {
  try {
    if (!process.env.GEMINI_API_KEY || !process.env.GITHUB_TOKEN) {
      return NextResponse.json({ success: false, error: "Chaves de ambiente não configuradas na Vercel." }, { status: 500 });
    }

    const githubOwner = process.env.GITHUB_OWNER || "ludgero20";
    const githubRepo = process.env.GITHUB_REPO || "agendafc";
    const filePath = "public/jogos.json";

    const hoje = new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });

    // 1. FAZ O DOWNLOAD DA PROGRAMAÇÃO DO GOAL.COM (A FONTE COMPROVADA)
    const goalUrl = "https://www.goal.com/br/listas/futebol-programacao-jogos-tv-aberta-fechada-onde-assistir-online-app/bltc0a7361374657315";
    const goalResponse = await fetch(goalUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      next: { revalidate: 0 }
    });

    if (!goalResponse.ok) {
      throw new Error(`Falha ao acessar o Goal.com (Status: ${goalResponse.status})`);
    }

    const htmlGoal = await goalResponse.text();
    const textoLimpo = extrairTextoHtml(htmlGoal);

    // 2. PROMPT ORIGINAL QUE TROUXE OS 144 JOGOS
    const prompt = `Hoje é dia ${hoje}. Aja como um extrator de dados de futebol.
    
    Analise o texto abaixo retirado da programação do Goal.com e extraia os jogos de futebol com transmissão.
    Retorne EXCLUSIVAMENTE um array JSON contendo um objeto para cada jogo, sem formatações de código markdown:

    REGRAS OBRIGATÓRIAS DE NOMES E PADRONIZAÇÃO:
    - Campeonato Italiano -> Use "Serie A"
    - Campeonato Espanhol -> Use "La Liga"
    - Campeonato Saudita -> Use "Saudi Pro League"
    - Campeonato Alemão -> Use "Bundesliga"
    - Campeonato Francês -> Use "Ligue 1"
    - Campeonato Inglês -> Use "Premier League"
    - Campeonato Português -> Use "Primeira Liga"
    - Liga Europa -> Use "Europa League"
    - AFC Champions League Elite -> Use "Champions League Asiática"
    - UEFA Champions League -> Use "Champions League"
    - Copinha -> Use "Copa São Paulo de Futebol Júnior"
    - Libertadores -> Use "Copa Libertadores da América"
    
    REGRAS PARA DIVISÃO E FASE:
    - Se for "Brasileirão Série B", coloque "campeonato": "Brasileirão" e "divisao": "Série B".
    - Se for "Brasileirão Série C", coloque "campeonato": "Brasileirão" e "divisao": "Série C".
    - Para campeonatos de mata-mata, extraia a fase no campo "fase" (ex: "oitavas", "quartas", "semifinal", "final"). Se for pontos corridos normais, deixe "fase": null.

    ESTRUTURA DO OBJETO JSON:
    - id: gere um numero aleatorio inteiro
    - data: formato YYYY-MM-DD
    - hora: formato HHhMM (com h minúsculo, ex: 16h00)
    - campeonato: nome normalizado
    - canal: canais separados por virgula
    - time1: mandante
    - time2: visitante
    - divisao: nome da divisao ou null
    - fase: nome da fase ou null
    - evento_nome: null
    - evento_descricao: null

    TEXTO DA PROGRAMAÇÃO ESPORTIVA:
    ${textoLimpo.slice(0, 40000)}`;

    // 3. CHAMA O GEMINI NO PLANO GRATUITO
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
    
    const geminiResponse = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" }
      })
    });

    const geminiData = await geminiResponse.json();

    if (geminiData.error) {
      return NextResponse.json({ success: false, error: `Erro da API do Gemini: ${geminiData.error.message}` }, { status: 400 });
    }

    if (!geminiData.candidates || geminiData.candidates.length === 0) {
      return NextResponse.json({ success: false, error: "O Gemini não retornou candidatos de resposta." }, { status: 400 });
    }

    let textoGerado = geminiData.candidates[0].content.parts[0].text;
    textoGerado = textoGerado.replace(/```json/g, '').replace(/```/g, '').trim();

    let jogosGerados = JSON.parse(textoGerado);

    // 4. FILTROS JS (NORMALIZAÇÃO E ANTI-DUPLICAÇÃO)
    const jogosLimpos = (Array.isArray(jogosGerados) ? jogosGerados : jogosGerados.jogosSemana || [])
      .map((jogo: any) => {
        const nomeLower = (jogo.campeonato || '').toLowerCase().trim();
        jogo.campeonato = dicionarioCampeonatos[nomeLower] || jogo.campeonato;
        
        if (jogo.campeonato === "Brasileirão Série B") {
          jogo.campeonato = "Brasileirão";
          jogo.divisao = "Série B";
        }
        if (jogo.campeonato === "Brasileirão Série C") {
          jogo.campeonato = "Brasileirão";
          jogo.divisao = "Série C";
        }

        return jogo;
      })
      .filter((jogo: any, index: number, array: any[]) => {
        const chaveUnica = `${jogo.data}-${jogo.time1}-${jogo.time2}`;
        return index === array.findIndex((j: any) => `${j.data}-${j.time1}-${j.time2}` === chaveUnica);
      })
      .sort((a: any, b: any) => (a.data || '').localeCompare(b.data || '') || (a.hora || '').localeCompare(b.hora || ''));

    const jsonFinalParaSalvar = JSON.stringify({ jogosSemana: jogosLimpos }, null, 2);

    // 5. COMMIT NO GITHUB
    const githubUrl = `https://api.github.com/repos/${githubOwner}/${githubRepo}/contents/${filePath}`;
    const headersGithub = {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      'Content-Type': 'application/json',
      'User-Agent': 'NextJS-App'
    };

    const repoInfoResponse = await fetch(githubUrl, { headers: headersGithub });
    const repoInfo = await repoInfoResponse.json();

    if (!repoInfo.sha) {
      return NextResponse.json({ success: false, error: "Não foi possível encontrar public/jogos.json no repositório.", detalheGithub: repoInfo }, { status: 400 });
    }

    const commitResponse = await fetch(githubUrl, {
      method: 'PUT',
      headers: headersGithub,
      body: JSON.stringify({
        message: "🤖 Atualização automática da agenda via Goal.com + Gemini",
        content: Buffer.from(jsonFinalParaSalvar).toString('base64'),
        sha: repoInfo.sha
      })
    });

    if (!commitResponse.ok) {
      const commitError = await commitResponse.json();
      return NextResponse.json({ success: false, error: "Erro ao commitar no GitHub.", detalhe: commitError }, { status: 400 });
    }

    return NextResponse.json({ 
      success: true, 
      message: "Jogos atualizados com sucesso via Goal.com!", 
      quantidade: jogosLimpos.length 
    });

  } catch (error: any) {
    console.error("Erro na automação:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}