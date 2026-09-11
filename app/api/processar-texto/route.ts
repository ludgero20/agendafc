// app/api/processar-texto/route.ts
import { NextResponse } from 'next/server';
import { dicionarioCampeonatos } from '@/lib/campeonatos';

const mesesMap: Record<string, string> = {
  "janeiro": "01", "fevereiro": "02", "março": "03", "marco": "03",
  "abril": "04", "maio": "05", "junho": "06", "julho": "07",
  "agosto": "08", "setembro": "09", "outubro": "10", "novembro": "11", "dezembro": "12"
};

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

          let campLimpo = campeonatoBruto.trim();
          let faseExtraida = null;

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

    let jogosExtraidos = parsearTabelasDireto(textoBruto, anoAtual);

    if (jogosExtraidos.length === 0 && process.env.GEMINI_API_KEY) {
      const promptGemini = `Você é um extrator especialista de grades de jogos na TV.
Extraia TODOS os jogos de futebol do texto abaixo em um array JSON.

REGRAS CRÍTICAS DE CAMPEONATO:
1. "campeonato": APENAS o nome oficial (ex: "Brasileirão", "Série B", "Premier League", "Championship", "La Liga", "Copa Libertadores", "Copa do Brasil").
   - Se for 2ª divisão da Inglaterra, coloque SEMPRE "Championship".
   - Se for 2ª divisão do Brasil, coloque SEMPRE "Série B".
   - NUNCA coloque a fase ou divisão em parênteses dentro de campeonato.
2. "fase": Extraia fases como "Quartas de final", "16-avos de final", etc. Se não houver, null.
3. "divisao": Apenas se for "Série C" ou similar. Para Série B, o campeonato já deve ser "Série B".
4. "data": "YYYY-MM-DD".
5. "hora": formato "16h00".

Texto:
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

    const todosCombinados = [...jogosPreservadosDoArquivo, ...jogosExtraidos];

    const jogosLimpos = todosCombinados
      .map((jogo: any) => {
        let camp = (jogo.campeonato || '').trim();
        let fase = (jogo.fase || '').trim() || undefined;
        let div = (jogo.divisao || '').trim() || undefined;

        // 1. Extrai fase entre parênteses
        if (camp.includes('(') && camp.includes(')')) {
          const matchFase = camp.match(/\((.*?)\)/);
          if (matchFase && !fase) {
            const conteudoParenteses = matchFase[1].trim();
            // Se não for "segunda divisão", é fase de mata-mata
            if (!conteudoParenteses.toLowerCase().includes('divisão') && !conteudoParenteses.toLowerCase().includes('divisao')) {
              fase = conteudoParenteses;
            }
          }
          camp = camp.replace(/\s*\(.*?\)/, '').trim();
        }

        const campLower = camp.toLowerCase();

        // 2. REGRAS ESTRITAS DE PAÍS E DIVISÃO (Corrige o erro de Watford/Stoke!)
        if (campLower.includes("ingl") || campLower.includes("championship")) {
          if (campLower.includes("segunda") || campLower.includes("2ª") || campLower.includes("championship")) {
            camp = "Championship";
            div = undefined;
          } else {
            camp = "Premier League";
          }
        } else if (campLower.includes("espanh")) {
          camp = "La Liga";
        } else if (
          campLower.includes("série b") || 
          campLower.includes("serie b") || 
          campLower.includes("segunda divisão") ||
          div?.toLowerCase().includes("série b") ||
          div?.toLowerCase().includes("segunda divisão")
        ) {
          camp = "Série B";
          div = undefined;
        } else if (campLower.includes("terceira") || campLower.includes("série c") || campLower.includes("serie c")) {
          camp = "Brasileirão";
          div = "Série C";
        } else if (campLower.includes("feminino")) {
          camp = campLower.includes("ingl") ? "Premier League Feminina" : "Brasileirão Feminino";
        } else if (campLower.includes("brasileir") || campLower.includes("brasileiro")) {
          camp = "Brasileirão";
          div = undefined;
        }

        // 3. Aplica o Dicionário Oficial
        camp = dicionarioCampeonatos[camp.toLowerCase().trim()] || camp;

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
      return NextResponse.json({ success: false, error: "Nenhum jogo válido encontrado." }, { status: 400 });
    }

    const jsonFinalParaSalvar = JSON.stringify({ jogosSemana: jogosLimpos }, null, 2);

    if (!repoInfo.sha) {
      return NextResponse.json({ success: false, error: "Arquivo public/jogos.json não encontrado no repositório." }, { status: 400 });
    }

    const commitResponse = await fetch(githubUrl, {
      method: 'PUT',
      headers: headersGithub,
      body: JSON.stringify({
        message: `🤖 Importação via Admin corrigida (${jogosLimpos.length} jogos)`,
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
      message: `Sucesso! Base de dados higienizada e salva com ${jogosLimpos.length} jogos.`,
      quantidadeTotalSalva: jogosLimpos.length
    });

  } catch (error: any) {
    console.error("Erro na importação:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}