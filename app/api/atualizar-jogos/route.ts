import { NextResponse } from 'next/server';
import { dicionarioCampeonatos } from '@/lib/campeonatos';

function extrairTextoHtml(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, '')
    .replace(/<br\s*[\/]?>/gi, '\n')
    .replace(/<\/(p|div|h1|h2|h3|h4|li|tr|table)>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n+/g, '\n')
    .trim();
}

function repararJsonIncompleto(jsonStr: string): any[] {
  let limpo = jsonStr.replace(/```json/g, '').replace(/```/g, '').trim();
  
  try {
    const parsed = JSON.parse(limpo);
    return Array.isArray(parsed) ? parsed : (parsed.jogosSemana || []);
  } catch (e) {
    const ultimoFechamento = limpo.lastIndexOf('}');
    if (ultimoFechamento !== -1) {
      const jsonRecuperado = limpo.substring(0, ultimoFechamento + 1) + ']';
      try {
        const parsedRecuperado = JSON.parse(jsonRecuperado);
        return Array.isArray(parsedRecuperado) ? parsedRecuperado : (parsedRecuperado.jogosSemana || []);
      } catch (e2) {
        console.error("Falha ao recuperar JSON:", e2);
      }
    }
    throw e;
  }
}

export async function GET(request: Request) {
  try {
    if (!process.env.GEMINI_API_KEY || !process.env.GITHUB_TOKEN) {
      return NextResponse.json({ success: false, error: "Chaves GEMINI_API_KEY ou GITHUB_TOKEN não configuradas." }, { status: 500 });
    }

    const githubOwner = process.env.GITHUB_OWNER || "ludgero20";
    const githubRepo = process.env.GITHUB_REPO || "agendafc";
    const filePath = "public/jogos.json";

    const agora = new Date();
    const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' });
    const hoje = formatter.format(agora).trim();

    // 1. FAZ O DOWNLOAD DA MATÉRIA DO GOAL.COM
    const goalUrl = "https://www.goal.com/br/listas/futebol-programacao-jogos-tv-aberta-fechada-onde-assistir-online-app/bltc0a7361374657315";
    const goalResponse = await fetch(goalUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7'
      },
      next: { revalidate: 0 }
    });

    if (!goalResponse.ok) {
      throw new Error(`Falha ao acessar o Goal.com (Status: ${goalResponse.status})`);
    }

    const htmlGoal = await goalResponse.text();
    const textoLimpo = extrairTextoHtml(htmlGoal);

    // 2. PROMPT CALIBRADO PARA A ESTRUTURA DO GOAL.COM
    const prompt = `Aja como um extrator especialista em dados de transmissões de futebol no Brasil.

    Analise o texto abaixo retirado da programação do Goal.com e extraia TODOS os jogos de futebol com transmissão presentes no texto (sexta, sábado, domingo e dias seguintes).

    REGRAS OBRIGATÓRIAS DE EXTRAÇÃO:
    1. DATAS: O texto possui seções como "Jogos de sexta, 4 de setembro de 2026", "Jogos de sábado, 5 de setembro de 2026", "Jogos de domingo, 6 de setembro de 2026". Converta a data de cada jogo estritamente para o formato YYYY-MM-DD (ex: 2026-09-04, 2026-09-05, 2026-09-06).
    2. HORÁRIOS: Converta horários como "14h" para "14h00", "8h30" para "08h30", "0h" para "00h00" (formato estrito HHhMM com 4 dígitos e h minúsculo).
    3. CAMPEONATOS: Normalize os nomes:
       - "Campeonato Brasileiro" ou "Brasileirão": use "Brasileirão"
       - "Campeonato Brasileiro (segunda divisão)": use campeonato "Brasileirão" e divisao "Série B"
       - "Campeonato Brasileiro (terceira divisão)": use campeonato "Brasileirão" e divisao "Série C"
       - "Campeonato Brasileiro Feminino": use "Brasileirão Feminino"
       - "Campeonato Inglês": use "Premier League"
       - "Campeonato Espanhol": use "La Liga"
       - "Campeonato Italiano": use "Serie A"
       - "Campeonato Alemão": use "Bundesliga"
       - "Campeonato Francês": use "Ligue 1"
       - "Campeonato Português": use "Primeira Liga"
       - "Campeonato Saudita": use "Saudi Pro League"
       - Outros campeonatos: mantenha o nome limpo (ex: "MLS", "Campeonato Holandês", "Copa do Brasil", "Copa Libertadores")
    4. CANAL: Extraia todos os canais de transmissão citados (ex: "Globo, ge tv e Premiere", "ESPN e Disney+", "CazéTV").
    5. RETORNE EXCLUSIVAMENTE um array JSON contendo um objeto para cada jogo, sem formatações de código markdown.

    ESTRUTURA DO OBJETO JSON:
    [
      {
        "id": 1001,
        "data": "YYYY-MM-DD",
        "hora": "16h00",
        "campeonato": "Brasileirão",
        "canal": "Globo, Premiere",
        "time1": "Time A",
        "time2": "Time B",
        "divisao": null,
        "fase": null,
        "evento_nome": null,
        "evento_descricao": null
      }
    ]

    TEXTO BRUTO DO GOAL.COM:
    ${textoLimpo.slice(0, 150000)}`;

    // 3. CHAMA O GEMINI NO PLANO GRATUITO
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
    const geminiResponse = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { 
          responseMimeType: "application/json",
          maxOutputTokens: 8192 
        }
      })
    });

    const geminiData = await geminiResponse.json();

    if (geminiData.error) {
      return NextResponse.json({ success: false, error: `Erro do Gemini: ${geminiData.error.message}` }, { status: 400 });
    }

    const textoGerado = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "[]";
    const jogosGerados = repararJsonIncompleto(textoGerado);

    // 4. FILTROS DE SEGURANÇA E NORMALIZAÇÃO
    const jogosLimpos = jogosGerados
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

    // 5. COMMIT DIRETO NO GITHUB
    const githubUrl = `https://api.github.com/repos/${githubOwner}/${githubRepo}/contents/${filePath}`;
    const headersGithub = {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      'Content-Type': 'application/json',
      'User-Agent': 'NextJS-App'
    };

    const repoInfoResponse = await fetch(githubUrl, { headers: headersGithub });
    const repoInfo = await repoInfoResponse.json();

    if (!repoInfo.sha) {
      return NextResponse.json({ success: false, error: "Arquivo public/jogos.json não encontrado no repositório.", detalheGithub: repoInfo }, { status: 400 });
    }

    const commitResponse = await fetch(githubUrl, {
      method: 'PUT',
      headers: headersGithub,
      body: JSON.stringify({
        message: `🤖 Atualização completa da agenda via Goal.com (${jogosLimpos.length} jogos)`,
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
      message: `Jogos atualizados com sucesso via Goal.com!`, 
      quantidadeJogos: jogosLimpos.length,
      primeiraData: jogosLimpos[0]?.data,
      ultimaData: jogosLimpos[jogosLimpos.length - 1]?.data
    });

  } catch (error: any) {
    console.error("Erro na automação:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}