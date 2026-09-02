import { MetadataRoute } from 'next';
import { todasCompeticoes } from '@/lib/campeonatos';
import { timesConfig } from '@/lib/times';

export default function sitemap(): MetadataRoute.Sitemap {
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

  return [...staticRoutes, ...dynamicCampeonatos, ...dynamicTimes];
}