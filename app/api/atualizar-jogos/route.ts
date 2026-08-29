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

export async function GET(request: Request) {
  try {
    // 1. VERIFICAÇÃO DE VARIÁVEIS DE AMBIENTE
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ success: false, error: "A variável GEMINI_API_KEY não foi configurada na Vercel." }, { status: 500 });
    }
    if (!process.env.GITHUB_TOKEN) {
      return NextResponse.json({ success: false, error: "A variável GITHUB_TOKEN não foi configurada na Vercel." }, { status: 500 });
    }

    const hoje = new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });

    const prompt = `Hoje é dia ${hoje}. Pesquise na internet a agenda de jogos de futebol do Brasil e internacionais para HOJE e para os PRÓXIMOS 3 DIAS. 
    Retorne EXCLUSIVAMENTE um array JSON puro (sem markdown, sem blocos de código com crases) contendo um objeto para cada jogo.

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
    - id: numero aleatorio inteiro
    - data: formato YYYY-MM-DD
    - hora: formato HHhMM (ex: 16h00)
    - campeonato: nome normalizado
    - canal: canais separados por virgula
    - time1: time mandante
    - time2: time visitante
    - divisao: nome da divisão ou null
    - fase: nome da fase ou null
    - evento_nome: null
    - evento_descricao: null`;

    // 2. CHAMA O GEMINI
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
    
    const geminiResponse = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        tools: [{ googleSearch: {} }]
      })
    });

    const geminiData = await geminiResponse.json();

    // Se o Google retornou erro, mostramos o erro exato do Google
    if (geminiData.error) {
      return NextResponse.json({ success: false, error: `Erro da API do Gemini: ${geminiData.error.message}` }, { status: 400 });
    }

    if (!geminiData.candidates || geminiData.candidates.length === 0) {
      return NextResponse.json({ success: false, error: "O Gemini não retornou nenhum candidato de resposta.", detalhe: geminiData }, { status: 400 });
    }

    let textoGerado = geminiData.candidates[0].content.parts[0].text;
    
    // Limpeza de crases markdown se a IA colocar (ex: ```json ... ```)
    textoGerado = textoGerado.replace(/```json/g, '').replace(/```/g, '').trim();

    let jogosGerados = JSON.parse(textoGerado);

    // 3. FILTROS DE SEGURANÇA (Anti-Duplicação e Normalização)
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

    // 4. SALVANDO NO GITHUB
    const githubOwner = "ludgero20"; // 🔴 CONFIRME SEU USUÁRIO GITHUB
    const githubRepo = "agendafc"; // 🔴 CONFIRME SEU REPOSITÓRIO GITHUB
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
      return NextResponse.json({ success: false, error: "Não foi possível encontrar o arquivo public/jogos.json no repositório do GitHub.", detalheGithub: repoInfo }, { status: 400 });
    }

    const commitResponse = await fetch(githubUrl, {
      method: 'PUT',
      headers: headersGithub,
      body: JSON.stringify({
        message: "🤖 Atualização automática da agenda via Gemini",
        content: Buffer.from(jsonFinalParaSalvar).toString('base64'),
        sha: repoInfo.sha
      })
    });

    if (!commitResponse.ok) {
      const commitError = await commitResponse.json();
      return NextResponse.json({ success: false, error: "Erro ao fazer commit no GitHub.", detalhe: commitError }, { status: 400 });
    }

    return NextResponse.json({ 
      success: true, 
      message: "Jogos atualizados com sucesso!", 
      quantidade: jogosLimpos.length 
    });

  } catch (error: any) {
    console.error("Erro na automação:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}