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

// Função auxiliar para chamar o Gemini para uma data específica
async function extrairJogosDoDia(dataIso: string, textoBruto: string, apiKey: string): Promise<any[]> {
  if (!textoBruto || textoBruto.length < 200) return [];

  const prompt = `Aja como um extrator de dados de transmissões de futebol na TV e streaming no Brasil.
  
  Analise o texto abaixo e extraia EXCLUSIVAMENTE os jogos de futebol que acontecem na data EXATA: ${dataIso}.
  Retorne APENAS um array JSON puro (sem formatação markdown).

  REGRAS:
  - data: use estritamente "${dataIso}"
  - hora: formato HHhMM (ex: 16h00)
  - campeonato: normalize para os nomes padrão (Brasileirão, Premier League, La Liga, Champions League, Serie A, Bundesliga, Ligue 1, Primeira Liga, Copa do Brasil, Libertadores, etc.)
  - divisao: "Série B" ou "Série C" se for o caso, senão null
  - fase: fase de mata-mata ou null
  - canal: canais de TV/streaming separados por vírgula

  ESTRUTURA:
  [{"id": 1234, "data": "${dataIso}", "hora": "16h00", "campeonato": "Brasileirão", "canal": "Globo, Premiere", "time1": "Time A", "time2": "Time B", "divisao": null, "fase": null, "evento_nome": null, "evento_descricao": null}]

  TEXTO BRUTO DA PROGRAMAÇÃO:
  ${textoBruto.slice(0, 30000)}`;

  try {
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`;
    const res = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json", maxOutputTokens: 4096 }
      })
    });

    const data = await res.json();
    if (data.candidates && data.candidates.length > 0) {
      let txt = data.candidates[0].content.parts[0].text;
      txt = txt.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(txt);
      return Array.isArray(parsed) ? parsed : (parsed.jogosSemana || []);
    }
  } catch (e) {
    console.error(`Erro ao extrair jogos do dia ${dataIso}:`, e);
  }
  return [];
}

export async function GET(request: Request) {
  try {
    const geminiKey = process.env.GEMINI_API_KEY;
    const githubToken = process.env.GITHUB_TOKEN;

    if (!geminiKey || !githubToken) {
      return NextResponse.json({ success: false, error: "Chaves GEMINI_API_KEY ou GITHUB_TOKEN não configuradas." }, { status: 500 });
    }

    const githubOwner = process.env.GITHUB_OWNER || "ludgero20";
    const githubRepo = process.env.GITHUB_REPO || "agendafc";
    const filePath = "public/jogos.json";

    const agora = new Date();
    const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' });

    // 1. GERA AS 4 DATAS (Hoje = 0, Amanhã = 1, Sábado = 2, Domingo = 3)
    const datas = Array.from({ length: 4 }, (_, i) => {
      const d = new Date(agora);
      d.setDate(d.getDate() + i);
      const dataIso = formatter.format(d).trim();
      const [ano, mes, dia] = dataIso.split('-').map(Number);
      return { dataIso, ano, mes, dia, indice: i };
    });

    // 2. BUSCA AS FONTES ESPECÍFICAS PARA CADA DIA EM PARALELO
    const promessasPorDia = datas.map(async ({ dataIso, ano, mes, dia, indice }) => {
      const urlsDoDia: string[] = [
        // oGol específico para este dia
        `https://www.ogol.com.br/futebol/proximos-jogos?jogo_data_year=${ano}&jogo_data_month=${mes}&jogo_data_day=${dia}&jogo_estado=3&jogo_genero=0&id_pais=0&id_pais_equipas=0&fk_clube=0`
      ];

      if (indice === 0) {
        urlsDoDia.push("https://www.futebolnatv.com.br/");
        urlsDoDia.push("https://www.goal.com/br/listas/futebol-programacao-jogos-tv-aberta-fechada-onde-assistir-online-app/bltc0a7361374657315");
      } else if (indice === 1) {
        urlsDoDia.push("https://www.futebolnatv.com.br/jogos-amanha");
      }

      // Baixa os textos das URLs deste dia
      let textoDoDia = "";
      for (const url of urlsDoDia) {
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
              textoDoDia += `\n${txt.slice(0, 20000)}`;
            }
          }
        } catch {}
      }

      // Chama o Gemini para processar apenas este dia
      return extrairJogosDoDia(dataIso, textoDoDia, geminiKey);
    });

    // Executa os 4 dias em paralelo
    const resultadosPorDia = await Promise.all(promessasPorDia);
    const todosOsJogosBrutos = resultadosPorDia.flat();

    // 3. FILTROS DE NORMALIZAÇÃO E ANTI-DUPLICAÇÃO
    const jogosLimpos = todosOsJogosBrutos
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
      .sort((a: any, b: any) => a.data.localeCompare(b.data) || a.hora.localeCompare(b.hora));

    const jsonFinalParaSalvar = JSON.stringify({ jogosSemana: jogosLimpos }, null, 2);

    // 4. COMMIT NO GITHUB
    const githubUrl = `https://api.github.com/repos/${githubOwner}/${githubRepo}/contents/${filePath}`;
    const headersGithub = {
      Authorization: `Bearer ${githubToken}`,
      'Content-Type': 'application/json',
      'User-Agent': 'NextJS-App'
    };

    const repoInfoResponse = await fetch(githubUrl, { headers: headersGithub });
    const repoInfo = await repoInfoResponse.json();

    if (!repoInfo.sha) {
      return NextResponse.json({ success: false, error: `Não foi possível encontrar ${filePath} no repositório.`, detalheGithub: repoInfo }, { status: 400 });
    }

    const commitResponse = await fetch(githubUrl, {
      method: 'PUT',
      headers: headersGithub,
      body: JSON.stringify({
        message: `🤖 Atualização por dia (${datas[0].dataIso} a ${datas[3].dataIso}) - ${jogosLimpos.length} jogos`,
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
      message: `Extração concluída com sucesso para 4 dias!`, 
      datasProcessadas: datas.map(d => d.dataIso),
      quantidadeJogos: jogosLimpos.length 
    });

  } catch (error: any) {
    console.error("Erro na automação:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}