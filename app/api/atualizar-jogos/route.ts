import { NextResponse } from 'next/server';
import { dicionarioCampeonatos } from '@/lib/campeonatos';

function extrairTextoHtml(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<br\s*[\/]?>/gi, '\n')
    .replace(/<\/(p|div|h1|h2|h3|h4|li|tr)>/gi, '\n')
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
    
    // Mapeamento de datas para ensinar a IA
    const datas = Array.from({ length: 4 }, (_, i) => {
      const d = new Date(agora);
      d.setDate(d.getDate() + i);
      const dataIso = formatter.format(d).trim();
      const diaSemana = d.toLocaleDateString('pt-BR', { weekday: 'long' });
      return { dataIso, diaSemana };
    });

    // 🌐 FONTES REAIS E ABERTAS DE PROGRAMAÇÃO
    const fontes = [
      "https://www.futebolnatv.com.br/",
      "https://www.futebolnatv.com.br/jogos-amanha",
      "https://www.goal.com/br/listas/futebol-programacao-jogos-tv-aberta-fechada-onde-assistir-online-app/bltc0a7361374657315",
      "https://www.mantosdofutebol.com.br/jogos-de-hoje-na-tv-ao-vivo/"
    ];

    // Baixa os portais em paralelo
    const resultados = await Promise.all(
      fontes.map(async (url) => {
        try {
          const res = await fetch(url, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            },
            next: { revalidate: 0 }
          });
          if (res.ok) {
            const html = await res.text();
            const txt = extrairTextoHtml(html);
            if (txt.length > 300) {
              return `\n=== FONTE: ${new URL(url).hostname} ===\n${txt.slice(0, 25000)}`;
            }
          }
        } catch (e) {}
        return null;
      })
    );

    const textosValidos = resultados.filter(Boolean) as string[];

    if (textosValidos.length === 0) {
      throw new Error("Nenhum portal esportivo respondeu.");
    }

    const textoCompilado = textosValidos.join('\n\n');

    // 🧠 PROMPT COM MAPEAMENTO INTELIGENTE DE DIAS DA SEMANA
    const instrucaoDatas = datas.map(d => `- Se o jogo for ${d.diaSemana} (ou data correspondente), use o campo data: "${d.dataIso}"`).join('\n');

    const prompt = `Hoje é ${datas[0].diaSemana}, data: ${datas[0].dataIso}.
    Aja como um compilador especialista em transmissões esportivas na TV e streaming no Brasil.
    
    Analise os textos da programação esportiva abaixo e extraia TODOS os jogos de futebol com transmissão ao vivo que encontrar.

    MAPA DE DATAS PARA CADA DIA DA SEMANA:
    ${instrucaoDatas}
    - Se for "Hoje", use: "${datas[0].dataIso}"
    - Se for "Amanhã", use: "${datas[1].dataIso}"

    REGRAS DE FORMATAÇÃO:
    - Retorne EXCLUSIVAMENTE um array JSON com os jogos encontrados.
    - hora: formato HHhMM (ex: 16h00, 21h30).
    - canal: canais separados por vírgula.
    - campeonato: nomes padrão (Brasileirão, Copa do Brasil, Libertadores, Champions League, Premier League, La Liga, etc.).
    - divisao: "Série B" ou "Série C" se aplicável, senão null.
    - fase: fase de mata-mata ou null.
    - Se o mesmo jogo estiver em mais de um site, NÃO DUPLIQUE. Cruze as informações e junte os canais.

    ESTRUTURA DO JSON:
    [{"id": 1001, "data": "YYYY-MM-DD", "hora": "16h00", "campeonato": "Brasileirão", "canal": "Globo, Premiere", "time1": "Time A", "time2": "Time B", "divisao": null, "fase": null, "evento_nome": null, "evento_descricao": null}]

    TEXTOS BRUTOS DAS EMISSORAS E PORTAIS:
    ${textoCompilado}`;

    // Chamada única e robusta ao Gemini
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

    // Filtros de segurança e ordenação
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

    // Commit no GitHub
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
        message: `🤖 Atualização automática de transmissões (${jogosLimpos.length} jogos)`,
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
      message: "Jogos atualizados com sucesso!", 
      fontesProcessadas: textosValidos.length,
      quantidadeJogos: jogosLimpos.length 
    });

  } catch (error: any) {
    console.error("Erro na automação:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}