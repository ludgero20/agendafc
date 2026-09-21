// app/api/processar-texto/route.ts
import { NextResponse } from 'next/server';
import { dicionarioCampeonatos } from '@/lib/campeonatos';

const mesesMap: Record<string, string> = {
  "janeiro": "01", "fevereiro": "02", "março": "03", "marco": "03",
  "abril": "04", "maio": "05", "junho": "06", "julho": "07",
  "agosto": "08", "setembro": "09", "outubro": "10", "novembro": "11", "dezembro": "12"
};

// 🧠 SANITIZADOR INTELIGENTE DE CAMPEONATO, PAÍS E FASE
function extrairCampeonatoEFase(campeonatoBruto: string, paisSugerido?: string): { campeonato: string; fase: string | null; pais: string | null } {
  let camp = (campeonatoBruto || '').trim();
  let fase: string | null = null;
  let pais: string | null = paisSugerido?.trim() || null;

  // 1. Identificação prévia do país no texto bruto se não fornecido
  const campLowerTotal = camp.toLowerCase();
  if (!pais) {
    if (campLowerTotal.includes('brasil') || campLowerTotal.includes('brasileir') || campLowerTotal.includes('copa paulista') || campLowerTotal.includes('copa rio') || campLowerTotal === 'série b' || campLowerTotal === 'serie b' || campLowerTotal.includes('série c') || campLowerTotal.includes('serie c')) {
      pais = 'Brasil';
    } else if (campLowerTotal.includes('ingl') || campLowerTotal.includes('championship') || campLowerTotal.includes('premier league')) {
      pais = 'Inglaterra';
    } else if (campLowerTotal.includes('espanh') || campLowerTotal.includes('la liga') || campLowerTotal.includes('laliga')) {
      pais = 'Espanha';
    } else if (campLowerTotal.includes('uruguai')) {
      pais = 'Uruguai';
    } else if (campLowerTotal.includes('argentin')) {
      pais = 'Argentina';
    } else if (campLowerTotal.includes('italian') || campLowerTotal === 'serie a') {
      pais = 'Itália';
    } else if (campLowerTotal.includes('alem') || campLowerTotal.includes('bundesliga')) {
      pais = 'Alemanha';
    } else if (campLowerTotal.includes('franc') || campLowerTotal.includes('ligue')) {
      pais = 'França';
    } else if (campLowerTotal.includes('portug') || campLowerTotal.includes('primeira liga')) {
      pais = 'Portugal';
    } else if (campLowerTotal.includes('holand') || campLowerTotal.includes('eredivisie')) {
      pais = 'Holanda';
    } else if (campLowerTotal.includes('saudita')) {
      pais = 'Arábia Saudita';
    } else if (campLowerTotal.includes('turco')) {
      pais = 'Turquia';
    } else if (campLowerTotal.includes('mexican')) {
      pais = 'México';
    } else if (campLowerTotal.includes('mls') || campLowerTotal.includes('nwsl')) {
      pais = 'Estados Unidos';
    }
  }

  // 2. Analisa se há parênteses no texto (ex: "Campeonato Brasileiro (segunda divisão)", "Campeonato Uruguaio (segunda divisão)", "Copa Libertadores (quartas de final)")
  if (camp.includes('(') && camp.includes(')')) {
    const match = camp.match(/\((.*?)\)/);
    const conteudoParenteses = match ? match[1].trim().toLowerCase() : '';
    const textoSemParenteses = camp.replace(/\s*\(.*?\)/, '').trim();
    const textoSemParentesesLower = textoSemParenteses.toLowerCase();

    // CASO A: Se for indicação de divisão, NÃO é fase! É o próprio campeonato!
    if (conteudoParenteses.includes('segunda') || conteudoParenteses.includes('2ª') || conteudoParenteses.includes('2 division') || conteudoParenteses.includes('série b') || conteudoParenteses.includes('serie b')) {
      // Determina o campeonato baseado no PAÍS / TEXTO:
      if (pais === 'Inglaterra' || textoSemParentesesLower.includes('ingl') || textoSemParentesesLower.includes('championship')) {
        return { campeonato: 'Championship', fase: null, pais: 'Inglaterra' };
      }
      if (pais === 'Espanha' || textoSemParentesesLower.includes('espanh') || textoSemParentesesLower.includes('la liga')) {
        return { campeonato: 'La Liga 2', fase: null, pais: 'Espanha' };
      }
      if (pais === 'Itália' || textoSemParentesesLower.includes('italian')) {
        return { campeonato: 'Serie B Italiana', fase: null, pais: 'Itália' };
      }
      if (pais === 'Alemanha' || textoSemParentesesLower.includes('alem')) {
        return { campeonato: '2. Bundesliga', fase: null, pais: 'Alemanha' };
      }
      if (pais === 'França' || textoSemParentesesLower.includes('franc')) {
        return { campeonato: 'Ligue 2', fase: null, pais: 'França' };
      }
      if (pais === 'Uruguai' || textoSemParentesesLower.includes('uruguai')) {
        return { campeonato: 'Campeonato Uruguaio (2ª Divisão)', fase: null, pais: 'Uruguai' };
      }
      if (pais === 'Argentina' || textoSemParentesesLower.includes('argentin')) {
        return { campeonato: 'Campeonato Argentino (2ª Divisão)', fase: null, pais: 'Argentina' };
      }
      if (pais === 'Brasil' || textoSemParentesesLower.includes('brasileir') || textoSemParentesesLower.includes('brasil')) {
        return { campeonato: 'Série B', fase: null, pais: 'Brasil' };
      }
      // Se não reconheceu país específico, usa o nome do campeonato com a 2ª divisão, JAMAIS Série B do Brasil
      return { campeonato: `${textoSemParenteses} (2ª Divisão)`, fase: null, pais };
    }

    if (conteudoParenteses.includes('terceira') || conteudoParenteses.includes('3ª') || conteudoParenteses.includes('série c') || conteudoParenteses.includes('serie c')) {
      if (pais === 'Brasil' || textoSemParentesesLower.includes('brasileir')) {
        return { campeonato: 'Campeonato Brasileiro Série C', fase: null, pais: 'Brasil' };
      }
    }

    // CASO B: Se for fase real de mata-mata
    fase = match ? match[1].trim() : null;
    // Se por acaso a fase tiver termos de divisão, descarta do campo fase
    if (fase && (fase.toLowerCase().includes('divis') || fase.toLowerCase().includes('série') || fase.toLowerCase().includes('serie'))) {
      fase = null;
    }
    camp = textoSemParenteses;
  }

  // 3. Normalização do nome da liga
  const campLower = camp.toLowerCase();

  if (campLower.includes('ingl') && (campLower.includes('segunda') || campLower.includes('championship'))) {
    camp = 'Championship';
    fase = null;
    pais = 'Inglaterra';
  } else if (campLower.includes('espanh') && (campLower.includes('segunda') || campLower.includes('la liga 2'))) {
    camp = 'La Liga 2';
    fase = null;
    pais = 'Espanha';
  } else if (campLower.includes('uruguai') && (campLower.includes('segunda') || campLower.includes('2ª'))) {
    camp = 'Campeonato Uruguaio (2ª Divisão)';
    fase = null;
    pais = 'Uruguai';
  } else if (campLower.includes('brasileir') && (campLower.includes('segunda') || campLower.includes('série b') || campLower.includes('serie b'))) {
    camp = 'Série B';
    fase = null;
    pais = 'Brasil';
  } else if (campLower === 'série b' || campLower === 'serie b') {
    camp = 'Série B';
    fase = null;
    pais = pais || 'Brasil';
  } else if (campLower === 'campeonato brasileiro' || campLower === 'brasileirão' || campLower === 'brasileirao') {
    camp = 'Brasileirão';
    pais = 'Brasil';
  }

  // 4. Aplica o dicionário de sinônimos oficial
  camp = dicionarioCampeonatos[camp.toLowerCase().trim()] || camp;

  return { campeonato: camp, fase, pais };
}

// ⚡ PARSER INSTANTÂNEO DE TABELAS
function parsearTabelasDireto(texto: string, anoAtual: string): any[] {
  const linhas = texto.split('\n').map(l => l.trim()).filter(Boolean);
  const jogos: any[] = [];
  let dataAtual = "";

  for (const linha of linhas) {
    const matchData = linha.match(/(?:jogos de\s+)?([a-zçãéíóú\-]+),\s+(\d{1,2})\s+de\s+([a-zçãéíóú]+)(?:\s+de\s+(\d{4}))?/i);
    if (matchData) {
      const dia = matchData[2].padStart(2, '0');
      const mesNome = matchData[3].toLowerCase();
      const mes = mesesMap[mesNome] || '09';
      const ano = matchData[4] || anoAtual;
      dataAtual = `${ano}-${mes}-${dia}`;
      continue;
    }

    if (dataAtual && (linha.includes(' x ') || linha.includes(' X ') || linha.includes('\t'))) {
      const colunas = linha.split('\t').map(c => c.trim()).filter(Boolean);
      
      if (colunas.length >= 4) {
        const [confronto, campeonatoBruto, horarioBruto, canalBruto] = colunas;
        if (confronto.toUpperCase() === 'JOGO' || horarioBruto.toUpperCase().includes('HORÁRIO')) continue;

        const partesTimes = confronto.split(/\s+[xX]\s+/);
        if (partesTimes.length === 2) {
          let hora = horarioBruto.toLowerCase().replace(':', 'h').trim();
          if (/^\d{1,2}h$/.test(hora)) hora = hora.replace('h', 'h00');
          if (/^\d{1}h/.test(hora)) hora = '0' + hora;

          const { campeonato, fase, pais } = extrairCampeonatoEFase(campeonatoBruto);

          jogos.push({
            id: Math.floor(Math.random() * 100000),
            data: dataAtual,
            hora: hora,
            campeonato,
            pais: pais || undefined,
            canal: canalBruto,
            time1: partesTimes[0].trim(),
            time2: partesTimes[1].trim(),
            divisao: null,
            fase,
            evento_nome: null,
            evento_descricao: null
          });
        }
      } else if (linha.includes(' x ') || linha.includes(' X ')) {
        const partes = linha.split(/\s+-\s+|\t/);
        const confronto = partes[0] || '';
        const partesTimes = confronto.split(/\s+[xX]\s+/);
        
        if (partesTimes.length === 2) {
          const { campeonato, fase, pais } = extrairCampeonatoEFase(partes[1] || "Brasileirão");

          jogos.push({
            id: Math.floor(Math.random() * 100000),
            data: dataAtual,
            hora: "16h00",
            campeonato,
            pais: pais || undefined,
            canal: partes[2] || "A definir",
            time1: partesTimes[0].trim(),
            time2: partesTimes[1].trim(),
            divisao: null,
            fase,
            evento_nome: null,
            evento_descricao: null
          });
        }
      }
    }
  }

  return jogos;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(request: Request) {
  try {
    const { senha, textoBruto } = await request.json();

    const senhaCorreta = process.env.ADMIN_PASSWORD;
    if (!senhaCorreta || senha !== senhaCorreta) {
      return NextResponse.json({ success: false, error: "Acesso negado: Senha incorreta." }, { status: 401, headers: corsHeaders });
    }

    if (!textoBruto || textoBruto.trim().length < 20) {
      return NextResponse.json({ success: false, error: "O texto colado está muito curto ou vazio." }, { status: 400, headers: corsHeaders });
    }

    const githubToken = process.env.GITHUB_TOKEN;
    const githubOwner = process.env.GITHUB_OWNER || "ludgero20";
    const githubRepo = process.env.GITHUB_REPO || "agendafc";
    const filePath = "public/jogos.json";

    if (!githubToken) {
      return NextResponse.json({ success: false, error: "GITHUB_TOKEN não configurada no servidor." }, { status: 500, headers: corsHeaders });
    }

    const agora = new Date();
    const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' });
    const hoje = formatter.format(agora).trim();
    const anoAtual = agora.getFullYear().toString();

    // 1. Tenta o parser de tabelas com TABs
    let jogosExtraidos = parsearTabelasDireto(textoBruto, anoAtual);

    // 2. Se não tiver formato de tabela, usa o Gemini
    if (jogosExtraidos.length === 0 && process.env.GEMINI_API_KEY) {
      const promptGemini = `Você é um extrator especialista de grades de jogos na TV.
Extraia TODOS os jogos de futebol do texto abaixo em um array JSON.

ESTRUTURA DE CADA OBJETO NO JSON:
{
  "pais": "Nome do país (ex: 'Brasil', 'Inglaterra', 'Espanha', 'Itália', 'Alemanha', 'França', 'Uruguai', 'Argentina', 'Estados Unidos', ou 'Europa'/'América do Sul' para torneios continentais)",
  "campeonato": "Nome oficial do campeonato",
  "fase": "Apenas fase de mata-mata (ex: 'Quartas de final', 'Semifinal', 'Final') ou null",
  "divisao": null,
  "data": "YYYY-MM-DD",
  "hora": "16h00",
  "canal": "Canal de TV ou streaming",
  "time1": "Nome do time mandante",
  "time2": "Nome do time visitante"
}

REGRAS CRÍTICAS DE PAÍS E CAMPEONATO:
1. "pais": Determine SEMPRE o país de origem do campeonato/liga ANTES de definir o campeonato.
2. "campeonato": Baseie-se no PAÍS para definir a competição:
   - BRASIL:
     * 1ª divisão: "Brasileirão"
     * 2ª divisão ("segunda divisão", "série b"): "Série B"
     * 3ª divisão ("terceira divisão", "série c"): "Campeonato Brasileiro Série C"
     * Feminino: "Campeonato Brasileiro Feminino"
   - INGLATERRA:
     * 1ª divisão: "Premier League"
     * 2ª divisão: "Championship"
   - ESPANHA:
     * 1ª divisão: "La Liga"
     * 2ª divisão: "La Liga 2"
   - ITÁLIA:
     * 1ª divisão: "Serie A"
     * 2ª divisão: "Serie B Italiana"
   - ALEMANHA:
     * 1ª divisão: "Bundesliga"
     * 2ª divisão: "2. Bundesliga"
   - FRANÇA:
     * 1ª divisão: "Ligue 1"
     * 2ª divisão: "Ligue 2"
   - URUGUAI:
     * 1ª divisão: "Campeonato Uruguaio"
     * 2ª divisão: "Campeonato Uruguaio (2ª Divisão)"
   - ARGENTINA:
     * 1ª divisão: "Campeonato Argentino"
     * 2ª divisão: "Campeonato Argentino (2ª Divisão)"
   - DEMAIS PAÍSES:
     * Se for 2ª divisão, coloque "{Nome do Campeonato} (2ª Divisão)".
     * NUNCA, SOB HIPÓTESE ALGUMA, coloque jogos de outros países na "Série B" do Brasil! A "Série B" é EXCLUSIVA do Brasil.
3. "fase": Extraia apenas fases reais de mata-mata (ex: "Quartas de final", "16-avos de final", "Semifinal", "Final"). NUNCA coloque divisões aqui (ex: nunca coloque "2ª divisão" em fase). Se for jogo de pontos corridos ou sem fase definida, coloque null.
4. "divisao": Deixe SEMPRE null (a divisão já fica incorporada no nome oficial do campeonato).
5. "data": "YYYY-MM-DD".
6. "hora": formato "16h00".

Texto:
${textoBruto}`;

      const modelos = ['gemini-3.8-flash', 'gemini-3.6-flash', 'gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
      for (const modelo of modelos) {
        try {
          const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent?key=${process.env.GEMINI_API_KEY}`;
          const geminiResponse = await fetch(geminiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: promptGemini }] }],
              generationConfig: { responseMimeType: "application/json", maxOutputTokens: 8192 }
            })
          });

          if (geminiResponse.ok) {
            const geminiData = await geminiResponse.json();
            const txt = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "[]";
            try {
              const rawGemini = JSON.parse(txt.replace(/```json/g, '').replace(/```/g, '').trim());
              if (Array.isArray(rawGemini) && rawGemini.length > 0) {
                jogosExtraidos = rawGemini.map((j: any) => {
                  const { campeonato, fase, pais } = extrairCampeonatoEFase(j.campeonato, j.pais);
                  let faseLimpa = j.fase || fase || undefined;
                  if (faseLimpa && (faseLimpa.toLowerCase().includes('divis') || faseLimpa.toLowerCase().includes('série') || faseLimpa.toLowerCase().includes('serie'))) {
                    faseLimpa = undefined;
                  }
                  return {
                    ...j,
                    campeonato,
                    pais: j.pais || pais || undefined,
                    fase: faseLimpa,
                    divisao: null,
                  };
                });
                break;
              }
            } catch {
              // continua para o próximo modelo caso o parse falhe
            }
          }
        } catch (err) {
          console.warn(`Tentativa de extração com ${modelo} falhou:`, err);
        }
      }
    }

    // 3. RECUPERA OS JOGOS EXISTENTES DO GITHUB
    const githubUrl = `https://api.github.com/repos/${githubOwner}/${githubRepo}/contents/${filePath}`;
    const headersGithub = {
      Authorization: `Bearer ${githubToken}`,
      'Content-Type': 'application/json',
      'User-Agent': 'NextJS-App'
    };

    const repoInfoResponse = await fetch(githubUrl, { headers: headersGithub });
    const repoInfo = await repoInfoResponse.json();

    let jogosPreservadosDoArquivo: any[] = [];
    if (repoInfo.content) {
      try {
        const conteudoAntigo = Buffer.from(repoInfo.content, 'base64').toString('utf-8');
        const parsedAntigo = JSON.parse(conteudoAntigo);
        const listaAntiga = parsedAntigo.jogosSemana || (Array.isArray(parsedAntigo) ? parsedAntigo : []);
        jogosPreservadosDoArquivo = listaAntiga.filter((j: any) => j.data && j.data >= hoje);
      } catch (e) {}
    }

    // 4. MESCLAGEM & NORMALIZAÇÃO DEFINITIVA
    const todosCombinados = [...jogosPreservadosDoArquivo, ...jogosExtraidos];

    const jogosLimpos = todosCombinados
      .map((jogo: any) => {
        const { campeonato, fase, pais } = extrairCampeonatoEFase(jogo.campeonato, jogo.pais);
        let faseLimpa = jogo.fase || fase || undefined;
        if (faseLimpa && (faseLimpa.toLowerCase().includes('divis') || faseLimpa.toLowerCase().includes('série') || faseLimpa.toLowerCase().includes('serie'))) {
          faseLimpa = undefined;
        }

        return {
          id: jogo.id || Math.floor(Math.random() * 100000),
          data: jogo.data,
          hora: jogo.hora,
          campeonato,
          pais: jogo.pais || pais || undefined,
          canal: (jogo.canal || '').trim(),
          time1: (jogo.time1 || '').trim(),
          time2: (jogo.time2 || '').trim(),
          divisao: null,
          fase: faseLimpa,
          evento_nome: null,
          evento_descricao: null
        };
      })
      .filter((j: any) => Boolean(j.data) && j.data >= hoje)
      .filter((j: any, index: number, array: any[]) => {
        const chaveUnica = `${j.data}-${j.time1}-${j.time2}`;
        return index === array.findIndex((x: any) => `${x.data}-${x.time1}-${x.time2}` === chaveUnica);
      })
      .sort((a: any, b: any) => a.data.localeCompare(b.data) || a.hora.localeCompare(b.hora));

    if (jogosLimpos.length === 0) {
      return NextResponse.json({ success: false, error: "Nenhum jogo válido encontrado." }, { status: 400, headers: corsHeaders });
    }

    const jsonFinalParaSalvar = JSON.stringify({ jogosSemana: jogosLimpos }, null, 2);

    if (!repoInfo.sha) {
      return NextResponse.json({ success: false, error: "Arquivo public/jogos.json não encontrado no repositório." }, { status: 400, headers: corsHeaders });
    }

    const commitResponse = await fetch(githubUrl, {
      method: 'PUT',
      headers: headersGithub,
      body: JSON.stringify({
        message: `🤖 Importação via Admin higienizada (${jogosLimpos.length} jogos)`,
        content: Buffer.from(jsonFinalParaSalvar).toString('base64'),
        sha: repoInfo.sha
      })
    });

    if (!commitResponse.ok) {
      const commitError = await commitResponse.json();
      return NextResponse.json({ success: false, error: "Erro ao salvar no GitHub.", detalhe: commitError }, { status: 400, headers: corsHeaders });
    }

    return NextResponse.json({ 
      success: true, 
      message: `Sucesso! Base de dados higienizada com ${jogosLimpos.length} jogos salvos.`,
      quantidadeTotalSalva: jogosLimpos.length
    }, { headers: corsHeaders });

  } catch (error: any) {
    console.error("Erro na importação:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500, headers: corsHeaders });
  }
}