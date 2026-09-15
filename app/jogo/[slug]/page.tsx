// app/jogo/[slug]/page.tsx
import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  buscarJogoPorSlug,
  gerarSlugsJogosAtivos,
  JogoItem,
} from '@/lib/jogos-loader';
import { resolverEscudoTime } from '@/lib/escudos-helper';
import JsonLdSportsEvent from '@/app/components/seo/JsonLdSportsEvent';
import AdSenseBlock from '@/app/components/ads/AdSenseBlock';

export const revalidate = 1800; // 30 minutos

export async function generateStaticParams() {
  const jogosAtivos = await gerarSlugsJogosAtivos();
  return jogosAtivos.map((item) => ({
    slug: item.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const jogo = await buscarJogoPorSlug(slug);

  if (!jogo || !jogo.time1 || !jogo.time2) {
    return {
      title: 'Jogo não encontrado | Agenda FC',
      description: 'O jogo solicitado não foi encontrado na grade do Agenda FC.',
    };
  }

  const titulo = `Onde assistir ${jogo.time1} x ${jogo.time2} ao vivo hoje: horário e canal`;
  const descricao = `Saiba onde assistir ${jogo.time1} x ${jogo.time2} ao vivo hoje pelo ${jogo.campeonato}. Veja horário (${jogo.hora}), canal de transmissão (TV e streaming) e informações do jogo.`;
  const canonicalUrl = `https://agendafc.com.br/jogo/${slug}`;

  const escudo1 = resolverEscudoTime(jogo.time1);
  const escudo2 = resolverEscudoTime(jogo.time2);

  return {
    title: titulo,
    description: descricao,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `${titulo} | Agenda FC`,
      description: descricao,
      url: canonicalUrl,
      type: 'article',
      siteName: 'Agenda FC',
      images: [
        {
          url: escudo1.url || '/logo.png',
          width: 500,
          height: 500,
          alt: `${jogo.time1} x ${jogo.time2}`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${titulo} | Agenda FC`,
      description: descricao,
      images: [escudo1.url || '/logo.jpg'],
    },
  };
}

// 🗓️ Formata a data por extenso em português
function formatarDataPorExtenso(dataStr: string): string {
  if (!dataStr) return '';
  const [ano, mes, dia] = dataStr.split('-').map(Number);
  if (!ano || !mes || !dia) return dataStr;
  const dataObj = new Date(ano, mes - 1, dia, 12);

  const diaSemana = dataObj.toLocaleDateString('pt-BR', { weekday: 'long' });
  const dataFormatada = dataObj.toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const diaSemanaCap = diaSemana.charAt(0).toUpperCase() + diaSemana.slice(1);
  return `${diaSemanaCap}, ${dataFormatada}`;
}

// 📺 Categoriza os canais de transmissão
function categorizarCanais(canalStr: string) {
  const texto = canalStr.toLowerCase();
  const categorias: { tipo: string; badge: string; cor: string }[] = [];

  const temTvAberta = /(globo|sbt|band|record|tv brasil|cultura)/i.test(texto);
  const temTvFechada = /(sportv|premiere|espn|bandsports|tnt|space)/i.test(texto);
  const temStreaming = /(disney\+|max|cazétv|caze tv|prime video|globoplay|youtube|apple tv|paramount\+|dazn|zapping|star\+)/i.test(
    texto
  );

  if (temTvAberta) {
    categorias.push({
      tipo: 'TV Aberta',
      badge: '📺 Aberta',
      cor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    });
  }
  if (temTvFechada) {
    categorias.push({
      tipo: 'TV por Assinatura',
      badge: '📡 TV Fechada',
      cor: 'bg-blue-100 text-blue-800 border-blue-300',
    });
  }
  if (temStreaming) {
    categorias.push({
      tipo: 'Streaming Online',
      badge: '📱 Streaming',
      cor: 'bg-purple-100 text-purple-800 border-purple-300',
    });
  }

  if (categorias.length === 0) {
    categorias.push({
      tipo: 'Transmissão Oficial',
      badge: '📺 Transmissão',
      cor: 'bg-slate-100 text-slate-800 border-slate-300',
    });
  }

  return categorias;
}

// 📅 Gera link para adicionar ao Google Agenda
function gerarLinkGoogleAgenda(jogo: JogoItem) {
  const titulo = `${jogo.time1} x ${jogo.time2}`;
  const campeonato = jogo.divisao ? `${jogo.campeonato} ${jogo.divisao}` : jogo.campeonato;

  const [hStr, mStr] = (jogo.hora || '12h00').replace('h', ':').split(':');
  const horaNum = parseInt(hStr || '12', 10);
  const minNum = parseInt(mStr || '0', 10);

  const [ano, mes, dia] = (jogo.data || '2026-01-01').split('-').map(Number);
  const dataInicio = new Date(Date.UTC(ano, mes - 1, dia, horaNum + 3, minNum));
  const dataFim = new Date(dataInicio.getTime() + 2 * 60 * 60 * 1000);

  const formatUTC = (d: Date) => d.toISOString().replace(/-|:|\.\d+/g, '');
  const startIso = formatUTC(dataInicio);
  const endIso = formatUTC(dataFim);

  const detalhes = `🏆 Campeonato: ${campeonato}\n📺 Transmissão: ${jogo.canal}\n\nConfira todos os horários em https://agendafc.com.br`;
  const local = 'Estádio / Transmissão';

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
    titulo
  )}&dates=${startIso}/${endIso}&details=${encodeURIComponent(
    detalhes
  )}&location=${encodeURIComponent(local)}`;
}

// 💬 Gera link para compartilhamento no WhatsApp
function gerarLinkWhatsApp(jogo: JogoItem, urlAtual: string) {
  const titulo = `⚽ ${jogo.time1} x ${jogo.time2}`;
  const campeonato = jogo.divisao ? `${jogo.campeonato} ${jogo.divisao}` : jogo.campeonato;
  const fase = jogo.fase ? ` - ${jogo.fase}` : '';

  const mensagem = `${titulo}
🏆 ${campeonato}${fase}
📅 ${formatarDataPorExtenso(jogo.data)} às ${jogo.hora}
📺 Onde assistir: ${jogo.canal}

Acesse os detalhes do jogo: ${urlAtual}`;

  return `https://api.whatsapp.com/send?text=${encodeURIComponent(mensagem)}`;
}

export default async function JogoPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const jogo = await buscarJogoPorSlug(slug);

  if (!jogo || !jogo.time1 || !jogo.time2) {
    notFound();
  }

  const canonicalUrl = `https://agendafc.com.br/jogo/${slug}`;
  const escudo1 = resolverEscudoTime(jogo.time1);
  const escudo2 = resolverEscudoTime(jogo.time2);
  const categoriasCanais = categorizarCanais(jogo.canal);
  const dataExtenso = formatarDataPorExtenso(jogo.data);

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 sm:py-6 space-y-6">
      {/* 1. DADOS ESTRUTURADOS SCHEMA.ORG */}
      <JsonLdSportsEvent
        jogo={jogo}
        url={canonicalUrl}
        escudoTime1Url={escudo1.url}
        escudoTime2Url={escudo2.url}
      />

      {/* 2. BREADCRUMBS */}
      <nav
        aria-label="Breadcrumb"
        className="flex items-center text-xs font-semibold text-slate-500 space-x-2 overflow-x-auto py-1"
      >
        <Link href="/" className="hover:text-blue-600 transition-colors">
          Início
        </Link>
        <span>&gt;</span>
        <span className="text-slate-600 truncate">{jogo.campeonato}</span>
        <span>&gt;</span>
        <span className="text-slate-900 truncate">
          {jogo.time1} x {jogo.time2}
        </span>
      </nav>

      {/* 3. CARD PRINCIPAL DO CONFRONTO (HERO) */}
      <section className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80 text-center relative overflow-hidden">
        {/* Badge do Campeonato e Fase */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200/70">
            🏆 {jogo.campeonato}
            {jogo.divisao ? ` ${jogo.divisao}` : ''}
          </span>
          {jogo.fase && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200/70">
              {jogo.fase}
            </span>
          )}
        </div>

        {/* Confronto e Escudos */}
        <div className="grid grid-cols-3 items-center gap-2 sm:gap-6 my-4">
          {/* Time Mandante */}
          <div className="flex flex-col items-center gap-3">
            {escudo1.isFallback ? (
              <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 text-slate-700 font-black text-xl sm:text-2xl flex items-center justify-center border-2 border-slate-300 shadow-inner">
                {escudo1.iniciais}
              </div>
            ) : (
              <img
                src={escudo1.url}
                alt={`Escudo do ${jogo.time1}`}
                className="w-16 h-16 sm:w-24 sm:h-24 object-contain drop-shadow-sm transition-transform hover:scale-105"
                loading="eager"
              />
            )}
            <h2 className="text-sm sm:text-xl font-bold text-slate-900 leading-tight">
              {jogo.time1}
            </h2>
          </div>

          {/* Placar / Versus e Horário */}
          <div className="flex flex-col items-center justify-center gap-2">
            <span className="text-xs sm:text-sm font-black uppercase text-slate-400 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
              VS
            </span>
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 sm:px-4 py-1.5 rounded-xl font-black text-base sm:text-xl tracking-tight shadow-2xs">
              🕒 {jogo.hora}
            </div>
            <span className="text-[11px] font-semibold text-slate-400">
              Horário de Brasília
            </span>
          </div>

          {/* Time Visitante */}
          <div className="flex flex-col items-center gap-3">
            {escudo2.isFallback ? (
              <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 text-slate-700 font-black text-xl sm:text-2xl flex items-center justify-center border-2 border-slate-300 shadow-inner">
                {escudo2.iniciais}
              </div>
            ) : (
              <img
                src={escudo2.url}
                alt={`Escudo do ${jogo.time2}`}
                className="w-16 h-16 sm:w-24 sm:h-24 object-contain drop-shadow-sm transition-transform hover:scale-105"
                loading="eager"
              />
            )}
            <h2 className="text-sm sm:text-xl font-bold text-slate-900 leading-tight">
              {jogo.time2}
            </h2>
          </div>
        </div>

        {/* Data Formatada */}
        <p className="mt-6 text-sm sm:text-base font-semibold text-slate-600">
          📅 {dataExtenso}
        </p>
      </section>

      {/* 4. BLOCO ONDE ASSISTIR AO VIVO */}
      <section className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-3xl p-6 sm:p-8 shadow-md border border-slate-700">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-700/80 pb-5 mb-5">
          <div>
            <h3 className="text-lg sm:text-xl font-extrabold flex items-center gap-2">
              <span>📺</span> Onde assistir ao vivo na TV e Streaming
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">
              Canais e plataformas oficiais com direitos de transmissão
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {categoriasCanais.map((cat, i) => (
              <span
                key={i}
                className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border ${cat.cor}`}
              >
                {cat.badge}
              </span>
            ))}
          </div>
        </div>

        <div className="bg-white/10 rounded-2xl p-5 backdrop-blur-xs border border-white/10 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">📡</span>
            <div>
              <span className="text-xs uppercase font-bold text-slate-300 block">
                Transmissão confirmada
              </span>
              <p className="text-lg sm:text-2xl font-black text-amber-300 mt-0.5">
                {jogo.canal}
              </p>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex flex-wrap items-center justify-center gap-2.5">
            <a
              href={gerarLinkGoogleAgenda(jogo)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-bold bg-white hover:bg-slate-100 text-slate-900 px-3 py-2 rounded-xl transition-all shadow-xs"
            >
              <svg className="w-4 h-4 fill-current text-blue-600" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M5.75 2a.75.75 0 01.75.75V4h7V2.75a.75.75 0 011.5 0V4h.25A2.75 2.75 0 0118 6.75v8.5A2.75 2.75 0 0115.25 18H4.75A2.75 2.75 0 012 15.25v-8.5A2.75 2.75 0 014.75 4H5V2.75A.75.75 0 015.75 2zm-1 5.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h10.5c.69 0 1.25-.56 1.25-1.25v-6.5c0-.69-.56-1.25-1.25-1.25H4.75z"
                  clipRule="evenodd"
                />
              </svg>
              Lembrar na Agenda
            </a>

            <a
              href={gerarLinkWhatsApp(jogo, canonicalUrl)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-2 rounded-xl transition-all shadow-xs"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
              </svg>
              Enviar no Zap
            </a>
          </div>
        </div>
      </section>

      {/* 5. BLOCO ADSENSE 1 (TOPO / MEIO) */}
      <AdSenseBlock />

      {/* 6. GUIA RÁPIDO DE DÚVIDAS (SEO FAQ) */}
      <section className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80 space-y-5">
        <h3 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
          <span>❓</span> Perguntas Frequentes sobre {jogo.time1} x {jogo.time2}
        </h3>

        <div className="space-y-4">
          <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/60">
            <h4 className="font-bold text-slate-800 text-sm sm:text-base">
              Que horas é o jogo entre {jogo.time1} e {jogo.time2}?
            </h4>
            <p className="text-xs sm:text-sm text-slate-600 mt-1.5 leading-relaxed">
              A partida está marcada para começar às <strong>{jogo.hora}</strong> (horário de Brasília)
              neste(a) <strong>{dataExtenso}</strong>, válida pelo(a) <strong>{jogo.campeonato}</strong>.
            </p>
          </div>

          <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/60">
            <h4 className="font-bold text-slate-800 text-sm sm:text-base">
              Qual canal vai passar o jogo do {jogo.time1} x {jogo.time2} ao vivo?
            </h4>
            <p className="text-xs sm:text-sm text-slate-600 mt-1.5 leading-relaxed">
              O confronto terá transmissão ao vivo confirmada nos canais e plataformas: <strong>{jogo.canal}</strong>.
            </p>
          </div>

          <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/60">
            <h4 className="font-bold text-slate-800 text-sm sm:text-base">
              Como assistir ao jogo online pelo celular ou computador?
            </h4>
            <p className="text-xs sm:text-sm text-slate-600 mt-1.5 leading-relaxed">
              Para assistir pelo celular, tablet ou computador, basta acessar o aplicativo ou site oficial dos serviços transmissores informados acima ({jogo.canal}), disponíveis para Android, iOS e navegadores web.
            </p>
          </div>
        </div>
      </section>

      {/* 7. BLOCO ADSENSE 2 (RODAPÉ) */}
      <AdSenseBlock />

      {/* 8. CTA FINAL DE RETENÇÃO PARA A HOME */}
      <div className="pt-2 text-center">
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm sm:text-base px-6 py-3.5 rounded-2xl shadow-sm transition-all hover:scale-[1.02] w-full sm:w-auto"
        >
          <span>⬅️</span> Ver todos os jogos de hoje na Home do Agenda FC
        </Link>
      </div>
    </div>
  );
}
