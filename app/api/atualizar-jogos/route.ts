import { NextResponse } from 'next/server';

const dicionarioCampeonatos: Record<string, string> = {
  "campeonato italiano": "Serie A",
  "campeonato espanhol": "La Liga",
  "campeonato saudita": "Saudi Pro League",
  "campeonato alemão": "Bundesliga",
  "campeonato francês": "Ligue 1",
  "campeonato frances": "Ligue 1",
  "campeonato inglês": "Premier League",
  "campeonato ingles": "Premier League",
  "campeonato português": "Primeira Liga",
  "campeonato portugues": "Primeira Liga",
  "liga europa": "Europa League",
  "afc champions league elite": "Champions League Asiática",
  "uefa champions league": "Champions League",
  "copinha": "Copa São Paulo de Futebol Júnior",
  "libertadores": "Copa Libertadores da América",
  "copa libertadores": "Copa Libertadores da América"
};

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
    // 1. VALIDAÇÃO DE CHAVES E CONFIGURAÇÃO
    if (!process.env.GEMINI_API_KEY || !process.env.GITHUB_TOKEN) {
      return NextResponse.json({ success: false, error: "Chaves GEMINI_API_KEY ou GITHUB_TOKEN não configuradas." }, { status: 500 });
    }

    if (!process.env.SCRAPE_URLS) {
      return NextResponse.json({ success: false, error: "Nenhuma URL configurada na variável SCRAPE_URLS da Vercel." }, { status: 500 });
    }

    // Pega todas as URLs cadastradas na Vercel (separadas por vírgula)
    const fontesDisponiveis = process.env.SCRAPE_URLS
      .split(',')
      .map(url => url.trim())
      .filter(Boolean);

    if (fontesDisponiveis.length === 0) {
      return NextResponse.json({ success: false, error: "Lista de URLs em SCRAPE_URLS está vazia." }, { status: 500 });
    }

    const hoje = new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });

    let textoLimpo = "";
    let urlUtilizada = "";

    // 2. BUSCA DINÂMICA ENTRE AS FONTES DA VERCEL
    for (const url of fontesDisponiveis) {
      try {
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          },
          next: { revalidate: 0 }
        });

        if (response.ok) {
          const html = await response.text();
          const texto = extrairTextoHtml(html);
          if (texto.length > 500) {
            textoLimpo = texto;
            urlUtilizada = url;
            break; // Sucesso na fonte atual, sai do loop!
          }
        }
      } catch (e) {
        console.log(`Falha ao acessar: ${url}, tentando próxima...`);
      }
    }

    if (!textoLimpo) {
      throw new Error("Nenhuma das fontes configuradas na Vercel respondeu com sucesso.");
    }

    // 3. PROMPT PARA O GEMINI
    const prompt = `Hoje é dia ${hoje}. Aja como um extrator de dados esportivos.
    
    Analise o texto abaixo com a programação esportiva e extraia TODOS os jogos de futebol com transmissão para HOJE e para os PRÓXIMOS 3 DIAS.
    Retorne EXCLUSIVAMENTE um array JSON contendo um objeto para cada jogo, sem formatações markdown:

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
    - Para campeonatos de mata-mata, extraia a fase no campo "fase" (ex: "oitavas", "quartas", "semifinal", "final"). Se for pontos corridos, "fase": null.

    ESTRUTURA DO OBJETO JSON:
    - id: numero aleatorio inteiro
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

    // 4. CHAMA O GEMINI 3.6 FLASH NO FREE TIER
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

    // 5. FILTROS JS (NORMALIZAÇÃO E ANTI-DUPLICAÇÃO)
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
      });

    const jsonFinalParaSalvar = JSON.stringify({ jogosSemana: jogosLimpos }, null, 2);

    // 6. COMMIT DIRETO NO GITHUB
    const githubOwner = "ludgero20"; // 🔴 SEU USUÁRIO
    const githubRepo = "agendafc"; // 🔴 SEU REPOSITÓRIO
    const filePath = "public/jogos.json";
    
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

    let hostnameFonte = "desconhecido";
    try {
      hostnameFonte = new URL(urlUtilizada).hostname;
    } catch {}

    const commitResponse = await fetch(githubUrl, {
      method: 'PUT',
      headers: headersGithub,
      body: JSON.stringify({
        message: `🤖 Atualização automática via ${hostnameFonte}`,
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
      message: `Jogos atualizados com sucesso via ${hostnameFonte}!`, 
      fonte: urlUtilizada,
      quantidade: jogosLimpos.length 
    });

  } catch (error: any) {
    console.error("Erro na automação:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}