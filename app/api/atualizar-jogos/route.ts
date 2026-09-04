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
      } catch (e2) {}
    }
    return [];
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

    // 1. BAIXA AS 3 FONTES EM PARALELO (Garante Hoje, Amanhã e Fim de Semana)
    const fontes = [
      "https://www.futebolnatv.com.br/",
      "https://www.futebolnatv.com.br/jogos-amanha",
      "https://www.goal.com/br/listas/futebol-programacao-jogos-tv-aberta-fechada-onde-assistir-online-app/bltc0a7361374657315"
    ];

    const resultados = await Promise.all(
      fontes.map(async (url) => {
        try {
          const res = await fetch(url, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7'
            },
            next: { revalidate: 0 }
          });
          if (res.ok) {
            const html = await res.text();
            const txt = extrairTextoHtml(html);
            if (txt.length > 200) {
              return `\n=== FONTE: ${new URL(url).hostname} ===\n${txt.slice(0, 50000)}`;
            }
          }
        } catch (e) {}
        return null;
      })
    );

    const textosValidos = resultados.filter(Boolean) as string[];

    if (textosValidos.length === 0) {
      throw new Error("Nenhuma fonte de programação esportiva respondeu.");
    }

    const textoCompilado = textosValidos.join('\n\n');

    // 2. PROMPT DE COMPILAÇÃO
    const prompt = `Hoje é dia ${hoje}. Aja como um compilador especialista em transmissões de futebol no Brasil.
    
    Analise os textos da programação esportiva abaixo e extraia TODOS os jogos de futebol com transmissão ao vivo que encontrar (sexta, sábado, domingo e dias seguintes).

    REGRAS ESSENCIAIS:
    1. EXTRAÇÃO COMPLETA: Não pare na sexta-feira. Extraia todos os jogos de sábado e domingo presentes nos textos.
    2. UNIFICAÇÃO: Se o mesmo jogo aparecer em mais de uma fonte, NÃO DUPLIQUE. Junte os canais (ex: "SporTV, Premiere").
    3. RETORNE EXCLUSIVAMENTE um array JSON puro, sem formatações de markdown.

    REGRAS DE NOMES E PADRONIZAÇÃO:
    - data: formato YYYY-MM-DD
    - hora: formato HHhMM (com h minúsculo, ex: 16h00)
    - campeonato: nome normalizado (Brasileirão, Copa do Brasil, Libertadores, Champions League, Premier League, La Liga, Serie A, Bundesliga, Ligue 1, etc.)
    - divisao: "Série B" ou "Série C" se aplicável, senão null
    - fase: fase de mata-mata ou null
    - canal: canais separados por vírgula

    ESTRUTURA DO JSON:
    [{"id": 1001, "data": "${hoje}", "hora": "16h00", "campeonato": "Brasileirão", "canal": "Globo, Premiere", "time1": "Time A", "time2": "Time B", "divisao": null, "fase": null, "evento_nome": null, "evento_descricao": null}]

    TEXTOS DAS FONTES:
    ${textoCompilado}`;

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
    const jogosNovosDaIA = repararJsonIncompleto(textoGerado);

    // 3. RECUPERA JOGOS ANTIGOS DO GITHUB PARA PRESERVAR DIAS FUTUROS
    const githubUrl = `https://api.github.com/repos/${githubOwner}/${githubRepo}/contents/${filePath}`;
    const headersGithub = {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      'Content-Type': 'application/json',
      'User-Agent': 'NextJS-App'
    };

    const repoInfoResponse = await fetch(githubUrl, { headers: headersGithub });
    const repoInfo = await repoInfoResponse.json();

    let jogosPreservados: any[] = [];
    if (repoInfo.content) {
      try {
        const jsonAntigo = Buffer.from(repoInfo.content, 'base64').toString('utf-8');
        const parsedAntigo = JSON.parse(jsonAntigo);
        const listaAntiga = parsedAntigo.jogosSemana || (Array.isArray(parsedAntigo) ? parsedAntigo : []);
        // Mantém todos os jogos de HOJE em diante que já estavam gravados
        jogosPreservados = listaAntiga.filter((j: any) => j.data && j.data >= hoje);
      } catch (e) {}
    }

    // 4. MESCLAGEM E DESDUPLICAÇÃO
    const todosCombinados = [...jogosPreservados, ...jogosNovosDaIA];

    const jogosLimpos = todosCombinados
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
    if (!repoInfo.sha) {
      return NextResponse.json({ success: false, error: "Arquivo public/jogos.json não encontrado no repositório.", detalheGithub: repoInfo }, { status: 400 });
    }

    const commitResponse = await fetch(githubUrl, {
      method: 'PUT',
      headers: headersGithub,
      body: JSON.stringify({
        message: `🤖 Atualização unificada da agenda (${jogosLimpos.length} jogos salvos)`,
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
      message: "Agenda atualizada com sucesso combinando múltiplas fontes!", 
      quantidadeTotal: jogosLimpos.length,
      primeiraData: jogosLimpos[0]?.data,
      ultimaData: jogosLimpos[jogosLimpos.length - 1]?.data
    });

  } catch (error: any) {
    console.error("Erro na automação:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}