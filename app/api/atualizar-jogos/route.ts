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

    // 1. CONFIGURAÇÃO DINÂMICA DO GITHUB (Sem precisar editar código!)
    const githubOwner = process.env.GITHUB_OWNER || "ludgero20";
    const githubRepo = process.env.GITHUB_REPO || "agendafc";
    const filePath = "public/jogos.json";

    const agora = new Date();
    const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' });
    const hoje = formatter.format(agora).trim();

    // 2. GERAÇÃO DINÂMICA DE DATAS (Hoje, D+1, D+2, D+3)
    const datasParaBuscar: string[] = [];
    const ogolUrls: string[] = [];

    for (let i = 0; i <= 3; i++) {
      const d = new Date(agora);
      d.setDate(d.getDate() + i);
      const dataIso = formatter.format(d).trim();
      datasParaBuscar.push(dataIso);

      const [ano, mes, dia] = dataIso.split('-').map(Number);
      const urlOgol = `https://www.ogol.com.br/futebol/proximos-jogos?jogo_data_year=${ano}&jogo_data_month=${mes}&jogo_data_day=${dia}&jogo_estado=3&jogo_genero=0&id_pais=0&id_pais_equipas=0&fk_clube=0`;
      ogolUrls.push(urlOgol);
    }

    const fontesFixas = [
      "https://www.futebolnatv.com.br/",
      "https://www.futebolnatv.com.br/jogos-amanha",
      "https://www.goal.com/br/listas/futebol-programacao-jogos-tv-aberta-fechada-onde-assistir-online-app/bltc0a7361374657315"
    ];

    const todasAsFontes = process.env.SCRAPE_URLS 
      ? process.env.SCRAPE_URLS.split(',').map(url => url.trim()).filter(Boolean)
      : [...ogolUrls, ...fontesFixas];

    // 3. BAIXA AS FONTES EM PARALELO
    const resultados = await Promise.all(
      todasAsFontes.map(async (url) => {
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
            const texto = extrairTextoHtml(html);
            if (texto.length > 300) {
              const hostname = new URL(url).hostname;
              return `\n=== FONTE: ${hostname} ===\n${texto.slice(0, 25000)}`;
            }
          }
        } catch (e) {
          console.log(`Erro ao buscar: ${url}`);
        }
        return null;
      })
    );

    const textosValidos = resultados.filter(Boolean) as string[];

    if (textosValidos.length === 0) {
      throw new Error("Nenhuma das fontes esportivas respondeu.");
    }

    const textoCompilado = textosValidos.join('\n\n');

    // 4. PROMPT COM FOCO EM TODAS AS DATAS
    const prompt = `Hoje é dia ${hoje}. Aja como um compilador especialista em transmissões esportivas na TV e streaming no Brasil.
    
    Abaixo estão textos da programação de TV de múltiplos portais esportivos para as datas: ${datasParaBuscar.join(', ')}.
    Sua tarefa é UNIFICAR, CRUZAR E COMPILAR os jogos de futebol para essas datas em uma lista única e definitiva.

    REGRAS ESSENCIAIS:
    1. COBERTURA: Extraia jogos de ${datasParaBuscar.join(', ')} (especialmente sábado e domingo).
    2. RELEVÂNCIA: Foque em jogos com transmissão de TV e streaming (Brasileirão Séries A/B/C, Copa do Brasil, Libertadores, Sul-Americana, Champions, Premier League, La Liga, Serie A, Bundesliga, Ligue 1, etc.). Ignore categorias de base sub-15 ou ligas amadoras sem transmissão real.
    3. UNIFICAÇÃO: Se o mesmo jogo aparecer em mais de uma fonte, NÃO DUPLIQUE. Junte os canais (ex: "TV Globo, SporTV, Premiere").
    4. RETORNE EXCLUSIVAMENTE um array JSON contendo um objeto para cada jogo, sem markdown.

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

    TEXTOS BRUTOS DAS FONTES ESPORTIVAS:
    ${textoCompilado}`;

    // 5. CHAMA O GEMINI COM RETENTATIVA AUTOMÁTICA EM CASO DE PICO DE DEMANDA
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
    let geminiData: any = null;
    let ultimoErro = "";

    for (let tentativa = 1; tentativa <= 3; tentativa++) {
      try {
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

        const data = await geminiResponse.json();

        if (data.error) {
          ultimoErro = data.error.message;
          console.log(`Tentativa ${tentativa} falhou: ${ultimoErro}. Aguardando 2s...`);
          if (tentativa < 3) {
            await new Promise(res => setTimeout(res, 2000));
            continue;
          }
        } else if (data.candidates && data.candidates.length > 0) {
          geminiData = data;
          break; // Sucesso!
        }
      } catch (err: any) {
        ultimoErro = err.message;
        if (tentativa < 3) await new Promise(res => setTimeout(res, 2000));
      }
    }

    if (!geminiData) {
      return NextResponse.json({ success: false, error: `Erro na API do Gemini após 3 tentativas: ${ultimoErro}` }, { status: 400 });
    }

    const textoGerado = geminiData.candidates[0].content.parts[0].text;
    let jogosGerados = repararJsonIncompleto(textoGerado);

    // 6. FILTROS DE SEGURANÇA JS
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
      });

    const jsonFinalParaSalvar = JSON.stringify({ jogosSemana: jogosLimpos }, null, 2);

    // 7. COMMIT NO GITHUB (Usando as variáveis ou o valor padrão automático)
    const githubUrl = `https://api.github.com/repos/${githubOwner}/${githubRepo}/contents/${filePath}`;
    const headersGithub = {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      'Content-Type': 'application/json',
      'User-Agent': 'NextJS-App'
    };

    const repoInfoResponse = await fetch(githubUrl, { headers: headersGithub });
    const repoInfo = await repoInfoResponse.json();

    if (!repoInfo.sha) {
      return NextResponse.json({ success: false, error: `Não foi possível encontrar ${filePath} no repositório ${githubOwner}/${githubRepo}.`, detalheGithub: repoInfo }, { status: 400 });
    }

    const commitResponse = await fetch(githubUrl, {
      method: 'PUT',
      headers: headersGithub,
      body: JSON.stringify({
        message: `🤖 Atualização de transmissões (${datasParaBuscar[0]} a ${datasParaBuscar[datasParaBuscar.length - 1]})`,
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
      message: `Jogos atualizados com sucesso para as datas: ${datasParaBuscar.join(', ')}!`, 
      fontesProcessadas: textosValidos.length,
      quantidadeJogos: jogosLimpos.length,
      repositorio: `${githubOwner}/${githubRepo}`
    });

  } catch (error: any) {
    console.error("Erro na automação:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}