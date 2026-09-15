import { MetadataRoute } from 'next';
import { todasCompeticoes } from '@/lib/campeonatos';
import { timesConfig } from '@/lib/times';
import { gerarSlugsJogosAtivos } from '@/lib/jogos-loader';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://agendafc.com.br';

  // 1. Páginas estáticas principais
  const staticRoutes: MetadataRoute.Sitemap = [
    '',
    '/semana',
    '/campeonatos',
    '/time',
    '/sobre',
    '/contato',
    '/privacidade',
    '/instalar',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === '' || route === '/semana' ? 'hourly' : 'daily',
    priority: route === '' ? 1.0 : 0.7,
  }));

  // 2. Páginas dinâmicas de campeonatos (Futebol, F1, NFL)
  const dynamicCampeonatos: MetadataRoute.Sitemap = todasCompeticoes
    .filter((comp) => comp.ativo && comp.slug && comp.slug.trim() !== '')
    .map((comp) => ({
      url: `${baseUrl}/campeonatos/${comp.slug}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    }));

  // 3. Páginas dinâmicas de todos os times e franquias
  const dynamicTimes: MetadataRoute.Sitemap = Object.keys(timesConfig).map((slug) => ({
    url: `${baseUrl}/time/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: 0.8,
  }));

  // 4. Páginas dinâmicas de jogos (/jogo/[slug])
  const agora = new Date();
  const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' });
  const hojeStr = formatter.format(agora).trim();
  const amanhaDate = new Date(agora);
  amanhaDate.setDate(amanhaDate.getDate() + 1);
  const amanhaStr = formatter.format(amanhaDate).trim();

  const jogosAtivos = await gerarSlugsJogosAtivos();
  const dynamicJogos: MetadataRoute.Sitemap = jogosAtivos.map(({ slug, jogo }) => {
    const isHojeOuAmanha = jogo.data === hojeStr || jogo.data === amanhaStr;
    return {
      url: `${baseUrl}/jogo/${slug}`,
      lastModified: new Date(),
      changeFrequency: 'hourly' as const,
      priority: isHojeOuAmanha ? 0.9 : 0.7,
    };
  });

  return [...staticRoutes, ...dynamicCampeonatos, ...dynamicTimes, ...dynamicJogos];
}