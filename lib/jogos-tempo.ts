// lib/jogos-tempo.ts

/**
 * Converte strings como "16h00", "16:00", "9h30" no total de minutos do dia.
 */
export function extrairMinutosDoDia(horaStr: string): number | null {
  if (!horaStr) return null;
  const limpo = horaStr.replace('h', ':').trim();
  const partes = limpo.split(':');
  if (partes.length === 0) return null;

  const h = parseInt(partes[0], 10);
  const m = partes[1] ? parseInt(partes[1], 10) : 0;

  if (isNaN(h) || isNaN(m)) return null;
  return h * 60 + m;
}

/**
 * Retorna a data 'YYYY-MM-DD' e os minutos do dia atuais no fuso de Brasília.
 */
export function getAgoraBrasilia(): { dataHoje: string; minutosAgora: number } {
  const agora = new Date();

  // Data no padrão YYYY-MM-DD
  const dateFormatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });

  // Hora e minuto
  const timeFormatter = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });

  const dataHoje = dateFormatter.format(agora);
  const [hStr, mStr] = timeFormatter.format(agora).split(':');
  const minutosAgora = (parseInt(hStr, 10) * 60) + parseInt(mStr, 10);

  return { dataHoje, minutosAgora };
}

/**
 * Determina se uma partida está em andamento (Ao Vivo).
 * Considera 5 min de pré-jogo até 115 min após o início oficial.
 */
export function isJogoAoVivo(
  jogo: { data: string; hora: string },
  dataHoje: string,
  minutosAgora: number
): boolean {
  if (!jogo.data || !jogo.hora) return false;
  if (jogo.data !== dataHoje) return false;

  const minutosJogo = extrairMinutosDoDia(jogo.hora);
  if (minutosJogo === null) return false;

  // Janela: 5 min antes até 115 min depois
  return minutosAgora >= (minutosJogo - 5) && minutosAgora <= (minutosJogo + 115);
}

