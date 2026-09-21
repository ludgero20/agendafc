// app/api/og/post-x/route.tsx
import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import { resolverEscudoSeguro, gerarEscudoFallbackSvg } from '@/lib/escudos-helper';

export const runtime = 'nodejs';

type JogoPayload = {
  id?: string | number;
  data?: string;
  hora: string;
  campeonato: string;
  canal: string;
  time1?: string | null;
  time2?: string | null;
  escudo1?: string | null;
  escudo2?: string | null;
  divisao?: string | null;
  fase?: string | null;
  evento_nome?: string | null;
  evento_descricao?: string | null;
};

async function gerarBannerResponse(titulo: string, jogosBrutos: JogoPayload[]) {
  // Limita a exibição entre 2 e 6 itens
  const jogos = (jogosBrutos || []).slice(0, 6);

  // Pré-resolve todos os escudos em paralelo com timeout e fallback seguro
  const jogosComEscudos = await Promise.all(
    jogos.map(async (j) => {
      const ehF1 = j.campeonato?.toLowerCase().includes('fórmula 1') || j.campeonato?.toLowerCase().includes('f1') || Boolean(j.evento_nome);

      if (ehF1) {
        return {
          ...j,
          escudo1Base64: null,
          escudo2Base64: null,
          ehF1: true,
        };
      }

      const [escudo1Base64, escudo2Base64] = await Promise.all([
        resolverEscudoSeguro(j.time1 || '', j.escudo1),
        resolverEscudoSeguro(j.time2 || '', j.escudo2),
      ]);

      return {
        ...j,
        escudo1Base64,
        escudo2Base64,
        ehF1: false,
      };
    })
  );

  const totalJogos = jogosComEscudos.length;
  // Configuração de grid de acordo com a quantidade
  const ehGridDuplo = totalJogos >= 3;
  const ehSeisJogos = totalJogos >= 5;

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '675px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          backgroundImage: 'linear-gradient(135deg, #020617 0%, #0a1128 45%, #032042 100%)',
          color: '#ffffff',
          fontFamily: 'sans-serif',
          padding: '36px 44px',
          boxSizing: 'border-box',
          position: 'relative',
        }}
      >
        {/* ELEMENTOS DECORATIVOS DE FUNDO */}
        <div
          style={{
            position: 'absolute',
            top: '-80px',
            right: '-80px',
            width: '320px',
            height: '320px',
            borderRadius: '160px',
            background: 'radial-gradient(circle, rgba(14, 165, 233, 0.15) 0%, rgba(2, 6, 23, 0) 70%)',
            display: 'flex',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-60px',
            left: '-60px',
            width: '280px',
            height: '280px',
            borderRadius: '140px',
            background: 'radial-gradient(circle, rgba(59, 130, 246, 0.12) 0%, rgba(2, 6, 23, 0) 70%)',
            display: 'flex',
          }}
        />

        {/* 1. CABEÇALHO */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
            paddingBottom: '18px',
          }}
        >
          {/* BADGE DE TÍTULO / DATA */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: 'rgba(59, 130, 246, 0.18)',
              border: '1px solid rgba(96, 165, 250, 0.4)',
              borderRadius: '9999px',
              padding: '8px 20px',
            }}
          >
            <div
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '5px',
                backgroundColor: '#38bdf8',
                marginRight: '10px',
                display: 'flex',
              }}
            />
            <span
              style={{
                fontSize: '18px',
                fontWeight: 800,
                color: '#e0f2fe',
                letterSpacing: '1px',
                textTransform: 'uppercase',
              }}
            >
              {titulo}
            </span>
          </div>

          {/* LOGO AGENDA FC */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                backgroundColor: '#2563eb',
                marginRight: '12px',
                boxShadow: '0 4px 14px rgba(37, 99, 235, 0.4)',
              }}
            >
              <span style={{ fontSize: '22px' }}>⚽</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span
                style={{
                  fontSize: '26px',
                  fontWeight: 900,
                  letterSpacing: '1.5px',
                  color: '#ffffff',
                }}
              >
                AGENDA<span style={{ color: '#38bdf8' }}>FC</span>
              </span>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#94a3b8',
                  letterSpacing: '1px',
                  marginTop: '-3px',
                }}
              >
                GUIA OFICIAL DE TRANSMISSÕES
              </span>
            </div>
          </div>
        </div>

        {/* 2. ÁREA CENTRAL (JOGOS / SESSÕES) */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignContent: 'center',
            width: '100%',
            height: '460px',
            gap: ehSeisJogos ? '10px' : '14px',
          }}
        >
          {jogosComEscudos.map((jogo, index) => {
            const cardWidth = ehGridDuplo ? '544px' : '100%';
            const cardHeight = ehSeisJogos ? '135px' : totalJogos <= 2 ? '210px' : '195px';

            if (jogo.ehF1) {
              // CARD DE FÓRMULA 1
              return (
                <div
                  key={index}
                  style={{
                    width: cardWidth,
                    height: cardHeight,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    backgroundColor: 'rgba(15, 23, 42, 0.75)',
                    border: '1px solid rgba(239, 68, 68, 0.35)',
                    borderRadius: '18px',
                    padding: ehSeisJogos ? '12px 18px' : '18px 24px',
                    boxSizing: 'border-box',
                    position: 'relative',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span
                        style={{
                          backgroundColor: '#dc2626',
                          color: '#ffffff',
                          fontWeight: 900,
                          fontSize: '12px',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          marginRight: '10px',
                        }}
                      >
                        F1
                      </span>
                      <span
                        style={{
                          fontSize: ehSeisJogos ? '14px' : '16px',
                          fontWeight: 700,
                          color: '#e2e8f0',
                        }}
                      >
                        {jogo.evento_descricao || 'Fórmula 1'}
                      </span>
                    </div>
                    <span
                      style={{
                        backgroundColor: 'rgba(56, 189, 248, 0.15)',
                        color: '#38bdf8',
                        fontSize: ehSeisJogos ? '13px' : '15px',
                        fontWeight: 800,
                        padding: '4px 10px',
                        borderRadius: '8px',
                      }}
                    >
                      🕒 {jogo.hora}
                    </span>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '4px 0',
                    }}
                  >
                    <span
                      style={{
                        fontSize: ehSeisJogos ? '20px' : '26px',
                        fontWeight: 900,
                        color: '#ffffff',
                        textAlign: 'center',
                      }}
                    >
                      🏁 {jogo.evento_nome || 'Sessão Oficial'}
                    </span>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                      paddingTop: '6px',
                    }}
                  >
                    <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>
                      {jogo.data ? `📅 ${jogo.data.split('-').reverse().slice(0, 2).join('/')}` : ''}
                    </span>
                    <span
                      style={{
                        fontSize: ehSeisJogos ? '12px' : '13px',
                        fontWeight: 700,
                        color: '#67e8f9',
                        backgroundColor: 'rgba(6, 182, 212, 0.12)',
                        padding: '2px 8px',
                        borderRadius: '6px',
                      }}
                    >
                      📺 {jogo.canal || 'Bandeirantes'}
                    </span>
                  </div>
                </div>
              );
            }

            // CARD PADRÃO DE JOGO (Futebol / NFL / NBA)
            return (
              <div
                key={index}
                style={{
                  width: cardWidth,
                  height: cardHeight,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  backgroundColor: 'rgba(15, 23, 42, 0.75)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '18px',
                  padding: ehSeisJogos ? '10px 16px' : '14px 20px',
                  boxSizing: 'border-box',
                }}
              >
                {/* LINHA SUPERIOR: CAMPEONATO & HORÁRIO */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span
                    style={{
                      fontSize: ehSeisJogos ? '12px' : '13px',
                      fontWeight: 800,
                      color: '#93c5fd',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}
                  >
                    {jogo.campeonato}
                    {jogo.fase ? ` • ${jogo.fase}` : ''}
                  </span>

                  <span
                    style={{
                      backgroundColor: 'rgba(56, 189, 248, 0.15)',
                      color: '#38bdf8',
                      fontSize: ehSeisJogos ? '12px' : '14px',
                      fontWeight: 800,
                      padding: '3px 9px',
                      borderRadius: '8px',
                    }}
                  >
                    {jogo.hora}
                  </span>
                </div>

                {/* LINHA CENTRAL: CONFRONTO COM ESCUDOS */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: '0 6px',
                  }}
                >
                  {/* TIME 1 */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      flex: 1,
                      overflow: 'hidden',
                    }}
                  >
                    {jogo.escudo1Base64 && (
                      <img
                        src={jogo.escudo1Base64}
                        alt=""
                        width={ehSeisJogos ? 38 : 50}
                        height={ehSeisJogos ? 38 : 50}
                        style={{
                          objectFit: 'contain',
                          marginRight: '12px',
                          borderRadius: '8px',
                        }}
                      />
                    )}
                    <span
                      style={{
                        fontSize: ehSeisJogos ? '16px' : totalJogos <= 2 ? '22px' : '18px',
                        fontWeight: 800,
                        color: '#ffffff',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {jogo.time1}
                    </span>
                  </div>

                  {/* X CENTRAL */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '0 12px',
                    }}
                  >
                    <span
                      style={{
                        fontSize: ehSeisJogos ? '12px' : '14px',
                        fontWeight: 900,
                        color: '#64748b',
                      }}
                    >
                      X
                    </span>
                  </div>

                  {/* TIME 2 */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                      flex: 1,
                      overflow: 'hidden',
                    }}
                  >
                    <span
                      style={{
                        fontSize: ehSeisJogos ? '16px' : totalJogos <= 2 ? '22px' : '18px',
                        fontWeight: 800,
                        color: '#ffffff',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        textAlign: 'right',
                        marginRight: '12px',
                      }}
                    >
                      {jogo.time2}
                    </span>
                    {jogo.escudo2Base64 && (
                      <img
                        src={jogo.escudo2Base64}
                        alt=""
                        width={ehSeisJogos ? 38 : 50}
                        height={ehSeisJogos ? 38 : 50}
                        style={{
                          objectFit: 'contain',
                          borderRadius: '8px',
                        }}
                      />
                    )}
                  </div>
                </div>

                {/* LINHA INFERIOR: TRANSMISSÃO */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                    paddingTop: '6px',
                  }}
                >
                  <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>
                    {jogo.data ? `📅 ${jogo.data.split('-').reverse().slice(0, 2).join('/')}` : ''}
                  </span>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      backgroundColor: 'rgba(30, 41, 59, 0.9)',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                      borderRadius: '6px',
                      padding: '2px 8px',
                    }}
                  >
                    <span
                      style={{
                        fontSize: ehSeisJogos ? '11px' : '12px',
                        fontWeight: 700,
                        color: '#94a3b8',
                      }}
                    >
                      📺 {jogo.canal || 'A definir'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* 3. RODAPÉ */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            backgroundColor: 'rgba(2, 6, 23, 0.85)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            borderRadius: '14px',
            padding: '10px 24px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ fontSize: '14px', color: '#94a3b8', fontWeight: 600 }}>
              Quer ver todos os jogos e onde assistir?
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span
              style={{
                fontSize: '16px',
                fontWeight: 900,
                color: '#38bdf8',
                letterSpacing: '0.5px',
              }}
            >
              agendafc.com.br
            </span>
            <span style={{ fontSize: '14px', color: '#60a5fa', marginLeft: '6px' }}>↗</span>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 675,
    }
  );
}

// Manipulador GET (permite usar diretamente em <img src="/api/og/post-x?..." /> ou baixar)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const titulo = searchParams.get('titulo') || searchParams.get('dataTitulo') || 'JOGOS EM DESTAQUE NA TV';
    const jogosParam = searchParams.get('jogos');

    let jogos: JogoPayload[] = [];
    if (jogosParam) {
      try {
        jogos = JSON.parse(decodeURIComponent(jogosParam));
      } catch {
        try {
          jogos = JSON.parse(jogosParam);
        } catch {
          jogos = [];
        }
      }
    }

    return await gerarBannerResponse(titulo, jogos);
  } catch (error: any) {
    console.error('Erro ao gerar banner OG:', error);
    return new Response(`Erro ao gerar imagem: ${error.message}`, { status: 500 });
  }
}

// Manipulador POST (para payloads grandes)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const titulo = body.titulo || body.dataTitulo || 'JOGOS EM DESTAQUE NA TV';
    const jogos: JogoPayload[] = body.jogos || [];

    return await gerarBannerResponse(titulo, jogos);
  } catch (error: any) {
    console.error('Erro ao processar POST banner OG:', error);
    return new Response(`Erro ao gerar imagem: ${error.message}`, { status: 500 });
  }
}
