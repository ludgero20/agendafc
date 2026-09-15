// app/api/og/post-x/route.tsx
import { ImageResponse } from 'next/og';
import { resolverEscudoTime, EscudoInfo } from '@/lib/escudos-helper';

export const runtime = 'nodejs';

type JogoPayload = {
  time1: string;
  time2: string;
  hora: string;
  canal: string;
  campeonato?: string;
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const jogosParam = searchParams.get('jogos');
    const dataTitulo = searchParams.get('dataTitulo') || 'JOGOS DE HOJE NA TV';

    let jogos: JogoPayload[] = [];
    if (jogosParam) {
      try {
        jogos = JSON.parse(jogosParam);
      } catch {
        jogos = [];
      }
    }

    // Jogos de demonstração caso nenhum seja passado
    if (!jogos || jogos.length === 0) {
      jogos = [
        { time1: 'Flamengo', time2: 'Palmeiras', hora: '16h00', canal: 'Globo, Premiere', campeonato: 'Brasileirão' },
        { time1: 'Real Madrid', time2: 'Barcelona', hora: '17h00', canal: 'ESPN, Disney+', campeonato: 'La Liga' },
        { time1: 'Corinthians', time2: 'São Paulo', hora: '18h30', canal: 'Premiere, CazéTV', campeonato: 'Brasileirão' },
      ];
    }

    // Garante entre 2 e 4 jogos
    const listaJogos = jogos.slice(0, 4);
    const totalJogos = listaJogos.length;
    const isGrid2x2 = totalJogos === 4;

    // Resolução de escudos
    const jogosResolvidos = listaJogos.map((j) => ({
      ...j,
      escudo1: resolverEscudoTime(j.time1),
      escudo2: resolverEscudoTime(j.time2),
    }));

    // Renderizador de escudo (com suporte a imagem ou caixa estilizada com iniciais nativas em JSX)
    const renderEscudo = (escudo: EscudoInfo, tamanho: number, fontSz: number) => {
      if (!escudo.isFallback && escudo.url) {
        return (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={escudo.url}
            alt={escudo.nomeExibicao}
            width={tamanho}
            height={tamanho}
            style={{
              objectFit: 'contain',
              borderRadius: '12px',
            }}
          />
        );
      }

      // Fallback JSX nítido com as iniciais do clube
      return (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: `${tamanho}px`,
            height: `${tamanho}px`,
            borderRadius: '14px',
            backgroundColor: '#1e293b',
            border: '2px solid #334155',
            color: '#38bdf8',
            fontWeight: 900,
            fontSize: `${fontSz}px`,
            letterSpacing: '1px',
          }}
        >
          {escudo.iniciais}
        </div>
      );
    };

    // Renderizador de um único card de jogo
    const renderCard = (jogo: typeof jogosResolvidos[0], idx: number) => {
      const escudoSize = isGrid2x2 ? 52 : totalJogos === 2 ? 68 : 56;
      const fontInitials = isGrid2x2 ? 16 : totalJogos === 2 ? 22 : 18;
      const timeFontSize = isGrid2x2 ? '20px' : totalJogos === 2 ? '26px' : '22px';

      return (
        <div
          key={idx}
          style={{
            display: 'flex',
            flexDirection: isGrid2x2 ? 'column' : 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: 'rgba(15, 23, 42, 0.90)',
            border: '1px solid rgba(51, 65, 85, 0.7)',
            borderRadius: '20px',
            padding: isGrid2x2 ? '20px 24px' : totalJogos === 2 ? '28px 32px' : '18px 28px',
            flex: 1,
            width: isGrid2x2 ? '548px' : '100%',
            height: '100%',
          }}
        >
          {/* Lado Esquerdo / Topo: Confronto e Escudos */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: isGrid2x2 ? '14px' : '24px',
              flex: isGrid2x2 ? 'none' : '1',
              width: isGrid2x2 ? '100%' : 'auto',
              justifyContent: isGrid2x2 ? 'space-between' : 'flex-start',
            }}
          >
            {/* Time 1 */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                flex: 1,
                justifyContent: 'flex-start',
              }}
            >
              {renderEscudo(jogo.escudo1, escudoSize, fontInitials)}
              <span
                style={{
                  fontSize: timeFontSize,
                  fontWeight: 800,
                  color: '#ffffff',
                  maxWidth: isGrid2x2 ? '145px' : '210px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {jogo.time1}
              </span>
            </div>

            {/* "X" central */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '32px',
                height: '32px',
                borderRadius: '10px',
                backgroundColor: 'rgba(30, 41, 59, 0.9)',
                border: '1px solid rgba(71, 85, 105, 0.5)',
                fontSize: '13px',
                fontWeight: 900,
                color: '#94a3b8',
              }}
            >
              X
            </div>

            {/* Time 2 */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                flex: 1,
                justifyContent: 'flex-end',
              }}
            >
              <span
                style={{
                  fontSize: timeFontSize,
                  fontWeight: 800,
                  color: '#ffffff',
                  maxWidth: isGrid2x2 ? '145px' : '210px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  textAlign: 'right',
                }}
              >
                {jogo.time2}
              </span>
              {renderEscudo(jogo.escudo2, escudoSize, fontInitials)}
            </div>
          </div>

          {/* Lado Direito / Base: Horário, Campeonato e Canais */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: isGrid2x2 ? 'space-between' : 'flex-end',
              gap: isGrid2x2 ? '12px' : '20px',
              width: isGrid2x2 ? '100%' : 'auto',
              borderTop: isGrid2x2 ? '1px solid rgba(51, 65, 85, 0.5)' : 'none',
              paddingTop: isGrid2x2 ? '14px' : '0',
              marginTop: isGrid2x2 ? '12px' : '0',
            }}
          >
            {/* Horário */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: '#2563eb',
                borderRadius: '12px',
                padding: isGrid2x2 ? '6px 14px' : '8px 18px',
                fontSize: isGrid2x2 ? '15px' : totalJogos === 2 ? '18px' : '16px',
                fontWeight: 900,
                color: '#ffffff',
              }}
            >
              <span>🕒</span>
              <span>{jogo.hora}</span>
            </div>

            {/* Campeonato e Canal */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-end',
                gap: '3px',
              }}
            >
              {jogo.campeonato && (
                <span
                  style={{
                    fontSize: isGrid2x2 ? '12px' : '13px',
                    fontWeight: 700,
                    color: '#38bdf8',
                    letterSpacing: '0.5px',
                  }}
                >
                  {jogo.campeonato}
                </span>
              )}
              <span
                style={{
                  fontSize: isGrid2x2 ? '14px' : totalJogos === 2 ? '16px' : '15px',
                  fontWeight: 700,
                  color: '#e2e8f0',
                  maxWidth: isGrid2x2 ? '240px' : '280px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                📺 {jogo.canal}
              </span>
            </div>
          </div>
        </div>
      );
    };

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            backgroundColor: '#030712',
            backgroundImage: 'radial-gradient(circle at 50% 0%, #1e1b4b 0%, #030712 75%)',
            padding: '32px 44px',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            color: '#f8fafc',
          }}
        >
          {/* TOPO: Logotipo e Badge da Data */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              borderBottom: '1px solid rgba(51, 65, 85, 0.6)',
              paddingBottom: '18px',
            }}
          >
            {/* Logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  backgroundColor: '#2563eb',
                  fontSize: '22px',
                }}
              >
                ⚽
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '26px', fontWeight: 900, letterSpacing: '-0.5px', color: '#ffffff' }}>
                  AGENDA <span style={{ color: '#38bdf8' }}>FC</span>
                </span>
                <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '1.5px', color: '#94a3b8' }}>
                  GUIA DE TRANSMISSÕES AO VIVO
                </span>
              </div>
            </div>

            {/* Badge da Data */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: 'rgba(37, 99, 235, 0.15)',
                border: '1px solid rgba(56, 189, 248, 0.4)',
                borderRadius: '9999px',
                padding: '8px 22px',
              }}
            >
              <div style={{ width: '8px', height: '8px', borderRadius: '9999px', backgroundColor: '#38bdf8' }} />
              <span style={{ fontSize: '14px', fontWeight: 800, letterSpacing: '1px', color: '#e0f2fe' }}>
                {dataTitulo.toUpperCase()}
              </span>
            </div>
          </div>

          {/* CORPO: Distribuição vertical balanceada */}
          {isGrid2x2 ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                flex: 1,
                justifyContent: 'space-between',
                gap: '16px',
                marginTop: '16px',
                marginBottom: '16px',
              }}
            >
              {/* Linha 1 */}
              <div style={{ display: 'flex', flexDirection: 'row', gap: '16px', flex: 1 }}>
                {renderCard(jogosResolvidos[0], 0)}
                {renderCard(jogosResolvidos[1], 1)}
              </div>
              {/* Linha 2 */}
              <div style={{ display: 'flex', flexDirection: 'row', gap: '16px', flex: 1 }}>
                {renderCard(jogosResolvidos[2], 2)}
                {renderCard(jogosResolvidos[3], 3)}
              </div>
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                flex: 1,
                justifyContent: 'space-between',
                gap: '16px',
                marginTop: '16px',
                marginBottom: '16px',
              }}
            >
              {jogosResolvidos.map((jogo, idx) => renderCard(jogo, idx))}
            </div>
          )}

          {/* RODAPÉ: Chamada de ação e link oficial */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              backgroundColor: 'rgba(30, 41, 59, 0.5)',
              border: '1px solid rgba(51, 65, 85, 0.5)',
              borderRadius: '14px',
              padding: '10px 24px',
            }}
          >
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#94a3b8' }}>
              Grade atualizada com todos os canais de TV e streaming
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#cbd5e1' }}>
                Acesse a programação completa:
              </span>
              <span
                style={{
                  fontSize: '15px',
                  fontWeight: 900,
                  color: '#38bdf8',
                  letterSpacing: '0.5px',
                }}
              >
                agendafc.com.br
              </span>
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 675,
      }
    );
  } catch (error: any) {
    console.error('Erro ao gerar imagem para o X:', error);
    return new Response(`Erro ao renderizar imagem: ${error.message}`, { status: 500 });
  }
}
