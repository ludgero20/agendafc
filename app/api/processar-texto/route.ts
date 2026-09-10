// app/api/processar-texto/route.ts
import { NextResponse } from 'next/server';
import { dicionarioCampeonatos } from '@/lib/campeonatos';

const mesesMap: Record<string, string> = {
  "janeiro": "01", "fevereiro": "02", "março": "03", "marco": "03",
  "abril": "04", "maio": "05", "junho": "06", "julho": "07",
  "agosto": "08", "setembro": "09", "outubro": "10", "novembro": "11", "dezembro": "12"
};

// ⚡ PARSER INSTANTÂNEO DE TABELAS COM SEPARAÇÃO DE FASE
function parsearTabelasDireto(texto: string, anoAtual: string): any[] {
  const linhas = texto.split('\n').map(l => l.trim()).filter(Boolean);
  const jogos: any[] = [];
  let dataAtual = "";

  for (const linha of linhas) {
    // Detecta cabeçalhos de data (ex: "Jogos de sexta, 4 de setembro de 2026" ou "Sábado, 5 de setembro")
    const matchData = linha.match(/(?:jogos de\s+)?([a-zçãéíóú\-]+),\s+(\d{1,2})\s+de\s+([a-zçãéíóú]+)(?:\s+de\s+(\d{4}))?/i);
    if (matchData) {
      const dia = matchData[2].padStart(2, '0');
      const mesNome = matchData[3].toLowerCase();
      const mes = mesesMap[mesNome] || '09';
      const ano = matchData[4] || anoAtual;
      dataAtual = `${ano}-${mes}-${dia}`;
      continue;
    }

    // Detecta linhas de jogos
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

          let campLimpo = campeonatoBruto.trim();
          let faseExtraida = null;

          // Extrai fase em parênteses ex: "Copa Libertadores (quartas de final)"
          if (campLimpo.includes('(') && campLimpo.includes(')')) {
            const matchFase = campLimpo.match(/\((.*?)\)/);
            if (matchFase) faseExtraida = matchFase[1].trim();
            campLimpo = campLimpo.replace(/\s*\(.*?\)/, '').trim();
          }

          jogos.push({
            id: Math.floor(Math.random() * 100000),
            data: dataAtual,
            hora: hora,
            campeonato: campLimpo,
            canal: canalBruto,
            time1: partesTimes[0].trim(),
            time2: partesTimes[1].trim(),
            divisao: null,
            fase: faseExtraida,
            evento_nome: null,
            evento_descricao: null
          });
        }
      } else if (linha.includes(' x ') || linha.includes(' X ')) {
        const partes = linha.split(/\s+-\s+|\t/);
        const confronto = partes[0] || '';
        const partesTimes = confronto.split(/\s+[xX]\s+/);
        
        if (partesTimes.length === 2) {
          let campLimpo = (partes[1] || "Brasileirão").trim();
          let faseExtraida = null;

          if (campLimpo.includes('(') && campLimpo.includes(')')) {
            const matchFase = campLimpo.match(/\((.*?)\)/);
            if (matchFase) faseExtraida = matchFase[1].trim();
            campLimpo = campLimpo.replace(/\s*\(.*?\)/, '').trim();
          }

          jogos.push({
            id: Math.floor(Math.random() * 100000),
            data: dataAtual,
            hora: "16h00",
            campeonato: campLimpo,
            canal: partes[2] || "A definir",
            time1: partesTimes[0].trim(),
            time2: partesTimes[1].trim(),
            divisao: null,
            fase: faseExtraida,
            evento_nome: null,
            evento_descricao: null
          });
        }
      }
    }
  }

  return jogos;
}

export async function POST(request: Request) {
  try {
    const { senha, textoBruto } = await request.json();

    // 1. VALIDAÇÃO DE SEGURANÇA POR SENHA
    const senhaCorreta = process.env.ADMIN_PASSWORD;
    if (!senhaCorreta || senha !== senhaCorreta) {
      return NextResponse.json({ success: false, error: "Acesso negado: Senha incorreta." }, { status: 401 });
    }

    if (!textoBruto || textoBruto.trim().length < 20) {
      return NextResponse.json({ success: false, error: "O texto colado está muito curto ou vazio." }, { status: 400 });
    }

    const githubToken = process.env.GITHUB_TOKEN;
    const githubOwner = process.env.GITHUB_OWNER || "ludgero20";
    const githubRepo = process.env.GITHUB_REPO || "agendafc";
    const filePath = "public/jogos.json";

    if (!githubToken) {
      return NextResponse.json({ success: false, error: "GITHUB_TOKEN não configurada no servidor." }, { status: 500 });
    }

    const agora = new Date();
    const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' });
    const hoje = formatter.format(agora).trim();
    const anoAtual = agora.getFullYear().toString();

    // 2. PARSE DIRETO DOS JOGOS COLADOS
    let jogosExtraidos = parsearTabelasDireto(textoBruto, anoAtual);

    // Fallback com Gemini (Prompt Especialista com Separação de Fase)
    if (jogosExtraidos.length === 0 && process.env.GEMINI_API_KEY) {
      const promptGemini = `Você é um extrator especialista de grades de jogos na TV.
Extraia TODOS os jogos de futebol do texto abaixo em um array JSON.

REGRAS OBRIGATÓRIAS:
1. "data": formato "YYYY-MM-DD" (se o texto disser apenas dia e mês, use o ano ${anoAtual}).
2. "hora": formato "16h00" ou "21h30".
3. "campeonato": APENAS o nome oficial do campeonato (ex: "Copa Libertadores", "Copa Sul-Americana", "Copa da Liga Inglesa", "Copa do Brasil", "Champions League", "Brasileirão", "Premier League", "La Liga"). NUNCA coloque a fase ou rodada dentro deste campo.
4. "fase": Extraia aqui a fase do mata-mata ou rodada se houver (ex: "Quartas de final", "16-avos de final", "Semifinal", "Oitavas de final", "Final", "Fase de Grupos", "Rodada 24"). Se não houver, retorne null.
5. "divisao": Apenas se for divisão explícita como "Série B" ou "Série C". Caso contrário, null.
6. "time1" e "time2": Nomes dos dois clubes.
7. "canal": Nomes dos canais e streamings (ex: "ESPN, Disney+", "SporTV, Premiere", "Globo, CazéTV").

Texto a ser processado:
${textoBruto}`;

      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
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
          jogosExtraidos = JSON.parse(txt.replace(/```json/g, '').replace(/```/g, '').trim());
        } catch {
          jogosExtraidos = [];
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
        let camp = (jogo.campeonato || '').trim();
        let fase = (jogo.fase || '').trim() || undefined;
        let div = (jogo.divisao || '').trim() || undefined;

        // Proteção: extrai fase se por acaso ainda tiver vindo com parênteses
        if (camp.includes('(') && camp.includes(')')) {
          const matchFase = camp.match(/\((.*?)\)/);
          if (matchFase && !fase) {
            fase = matchFase[1].trim();
          }
          camp = camp.replace(/\s*\(.*?\)/, '').trim();
        }

        // Mapeamento de Divisões do Brasileirão
        if (camp.includes("segunda divisão") || camp.toLowerCase().includes("série b") || camp.toLowerCase().includes("serie b")) {
          camp = "Série B";
          div = undefined;
        } else if (camp.includes("terceira divisão") || camp.toLowerCase().includes("série c") || camp.toLowerCase().includes("serie c")) {
          camp = "Brasileirão";
          div = "Série C";
        } else if (camp.includes("Feminino")) {
          camp = camp.includes("Inglês") ? "Premier League Feminina" : "Brasileirão Feminino";
        } else if (camp.includes("Brasileiro") || camp.includes("Brasileirão")) {
          camp = "Brasileirão";
        }

        // Normalização pelo Dicionário Oficial
        const campLower = camp.toLowerCase().trim();
        camp = dicionarioCampeonatos[campLower] || camp;

        return {
          id: jogo.id || Math.floor(Math.random() * 100000),
          data: jogo.data,
          hora: jogo.hora,
          campeonato: camp,
          canal: (jogo.canal || '').trim(),
          time1: (jogo.time1 || '').trim(),
          time2: (jogo.time2 || '').trim(),
          divisao: div || undefined,
          fase: fase || undefined,
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
      return NextResponse.json({ success: false, error: "Nenhum jogo válido para hoje ou dias futuros foi identificado." }, { status: 400 });
    }

    const jsonFinalParaSalvar = JSON.stringify({ jogosSemana: jogosLimpos }, null, 2);

    // 5. COMMIT NO GITHUB
    if (!repoInfo.sha) {
      return NextResponse.json({ success: false, error: "Arquivo public/jogos.json não encontrado no repositório.", detalheGithub: repoInfo }, { status: 400 });
    }

    const commitResponse = await fetch(githubUrl, {
      method: 'PUT',
      headers: headersGithub,
      body: JSON.stringify({
        message: `🤖 Importação via Admin (${jogosLimpos.length} jogos no total)`,
        content: Buffer.from(jsonFinalParaSalvar).toString('base64'),
        sha: repoInfo.sha
      })
    });

    if (!commitResponse.ok) {
      const commitError = await commitResponse.json();
      return NextResponse.json({ success: false, error: "Erro ao salvar no GitHub.", detalhe: commitError }, { status: 400 });
    }

    return NextResponse.json({ 
      success: true, 
      message: `Sucesso! Total acumulado no site: ${jogosLimpos.length} jogos salvos de ${jogosLimpos[0].data} até ${jogosLimpos[jogosLimpos.length - 1].data}.`,
      jogosNovosProcessados: jogosExtraidos.length,
      quantidadeTotalSalva: jogosLimpos.length,
      primeiraData: jogosLimpos[0]?.data,
      ultimaData: jogosLimpos[jogosLimpos.length - 1]?.data
    });

  } catch (error: any) {
    console.error("Erro na importação:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}