import { NextResponse } from 'next/server';

// 1. Dicionário de Normalização com as SUAS regras (Segurança extra no JS)
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
    const hoje = new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });

    // 2. O PROMPT MESTRE COM TODAS AS SUAS REGRAS EMBUTIDAS
    const prompt = `Hoje é dia ${hoje}. Pesquise na internet a agenda de jogos de futebol do Brasil e internacionais para HOJE e para os PRÓXIMOS 3 DIAS. 
    Retorne EXCLUSIVAMENTE um array JSON contendo um objeto para cada jogo.

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
    - Para campeonatos de mata-mata (Copa do Brasil, Libertadores, Sul-Americana, Champions), extraia a fase no campo "fase" (ex: "oitavas", "quartas", "semifinal", "final"). Se for pontos corridos ou grupos normais, deixe "fase": null.

    ESTRUTURA DO OBJETO JSON:
    - id: gere um numero aleatorio inteiro
    - data: formato YYYY-MM-DD
    - hora: formato HHhMM (com h minúsculo, ex: 16h00)
    - campeonato: nome normalizado
    - canal: canais separados por virgula
    - time1: time mandante
    - time2: time visitante
    - divisao: nome da divisão ou null
    - fase: nome da fase ou null
    - evento_nome: null
    - evento_descricao: null`;

    // 3. CHAMA O GEMINI
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
    
    const geminiResponse = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        tools: [{ googleSearch: {} }],
        generationConfig: { responseMimeType: "application/json" }
      })
    });

    const geminiData = await geminiResponse.json();
    const textoGerado = geminiData.candidates[0].content.parts[0].text;
    let jogosGerados = JSON.parse(textoGerado);

    // 4. APLICA AS SUAS REGRAS NO JAVASCRIPT (Caso a IA deixe passar algo)
    const jogosLimpos = jogosGerados
      .map((jogo: any) => {
        const nomeLower = (jogo.campeonato || '').toLowerCase().trim();
        jogo.campeonato = dicionarioCampeonatos[nomeLower] || jogo.campeonato;
        
        // Trata caso a IA coloque "Brasileirão Série B" direto no campeonato
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
        // Anti-Duplicação
        const chaveUnica = `${jogo.data}-${jogo.time1}-${jogo.time2}`;
        return index === array.findIndex((j: any) => `${j.data}-${j.time1}-${j.time2}` === chaveUnica);
      });

    const jsonFinalParaSalvar = JSON.stringify({ jogosSemana: jogosLimpos }, null, 2);

    // 5. SALVANDO NO GITHUB
    const githubOwner = "ludgero20"; // 🔴 MUDE PARA O SEU USUÁRIO
    const githubRepo = "agendafc"; // 🔴 MUDE PARA O SEU REPOSITÓRIO
    const filePath = "public/jogos.json";
    
    const githubUrl = `https://api.github.com/repos/${githubOwner}/${githubRepo}/contents/${filePath}`;
    const headersGithub = {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      'Content-Type': 'application/json'
    };

    const repoInfoResponse = await fetch(githubUrl, { headers: headersGithub });
    const repoInfo = await repoInfoResponse.json();

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
      throw new Error("Erro ao salvar no GitHub");
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