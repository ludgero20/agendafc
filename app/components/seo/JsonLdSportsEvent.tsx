// app/components/seo/JsonLdSportsEvent.tsx
import React from 'react';
import { JogoItem } from '@/lib/jogos-slug';

type Props = {
  jogo: JogoItem;
  url: string;
  escudoTime1Url?: string;
  escudoTime2Url?: string;
};

export default function JsonLdSportsEvent({
  jogo,
  url,
  escudoTime1Url,
  escudoTime2Url,
}: Props) {
  // Normaliza o horário para montar ISO 8601 com timezone de Brasília (-03:00)
  let horaLimpa = (jogo.hora || '12h00').replace('h', ':').trim();
  const partesHora = horaLimpa.split(':');
  const hh = (partesHora[0] || '12').padStart(2, '0');
  const mm = (partesHora[1] || '00').padEnd(2, '0');

  const startDate = `${jogo.data}T${hh}:${mm}:00-03:00`;

  // Fallback seguro de logo para validação do Google Rich Results
  const defaultLogo = 'https://agendafc.com.br/icon.png';
  const logo1 =
    escudoTime1Url && escudoTime1Url.startsWith('http') ? escudoTime1Url : defaultLogo;
  const logo2 =
    escudoTime2Url && escudoTime2Url.startsWith('http') ? escudoTime2Url : defaultLogo;

  const nomeConfronto = `${jogo.time1} x ${jogo.time2}`;
  const descricaoEvento = `Onde assistir ${nomeConfronto} ao vivo pelo ${jogo.campeonato}${
    jogo.fase ? ` (${jogo.fase})` : ''
  }. Horário e canal de transmissão.`;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'SportsEvent',
    name: nomeConfronto,
    description: descricaoEvento,
    startDate,
    sport: 'Soccer',
    url,
    homeTeam: {
      '@type': 'SportsTeam',
      name: jogo.time1,
      logo: logo1,
    },
    awayTeam: {
      '@type': 'SportsTeam',
      name: jogo.time2,
      logo: logo2,
    },
    location: {
      '@type': 'Place',
      name: 'Brasil',
    },
    broadcastEvent: {
      '@type': 'BroadcastEvent',
      name: 'Transmissão ao vivo na TV e Streaming',
      isLiveBroadcast: true,
      videoFormat: 'HD',
      broadcastDisplayName: jogo.canal || 'TV e Streaming',
    },
    organizer: {
      '@type': 'Organization',
      name: 'Agenda FC',
      url: 'https://agendafc.com.br',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

