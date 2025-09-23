import { MetadataRoute } from 'next';
import fs from 'fs';
import path from 'path';

type Competicao = {
  slug?: string;
  ativo: boolean;
};

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://agendafc.com.br';

  // 1. Adiciona as páginas estáticas
  const staticRoutes = [
    '/',
    '/semana',
    '/campeonatos',
    '/sobre',
    '/contato',
    '/privacidade',
    '/instalar',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
  }));

  // 2. Adiciona as páginas dinâmicas de campeonatos
  const competicoesFilePath = path.join(process.cwd(), 'public', 'competicoes-unificadas.json');
  const competicoesFile = fs.readFileSync(competicoesFilePath, 'utf-8');
  const competicoesData = JSON.parse(competicoesFile);

  const dynamicRoutes = competicoesData.competicoes
    .filter((comp: Competicao) => comp.ativo && comp.slug)
    .map((comp: Competicao) => ({
      url: `${baseUrl}/campeonatos/${comp.slug}`,
      lastModified: new Date(),
    }));

  return [...staticRoutes, ...dynamicRoutes];
}