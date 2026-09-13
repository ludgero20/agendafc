// lib/services/f1-service.ts
import fs from 'fs/promises';
import path from 'path';

export type EquipeF1 = {
  position: number;
  name: string;
  points: number;
  wins: number;
};

export async function getEquipesF1(): Promise<EquipeF1[]> {
  try {
    const res = await fetch('https://api.jolpi.ca/ergast/f1/current/constructorStandings.json', {
      next: { revalidate: 3600 }
    });

    if (!res.ok) throw new Error('Erro na API de construtores');
    const data = await res.json();
    const lista = data?.MRData?.StandingsTable?.StandingsLists?.[0]?.ConstructorStandings || [];

    if (lista.length === 0) throw new Error('Lista vazia');

    return lista.map((item: any) => ({
      position: parseInt(item.position, 10),
      name: item.Constructor.name,
      points: parseFloat(item.points),
      wins: parseInt(item.wins, 10)
    }));
  } catch {
    try {
      const fallback = await fs.readFile(
        path.join(process.cwd(), 'public/importacoes-manuais/f1/equipes.json'),
        'utf-8'
      );
      const parsed = JSON.parse(fallback);
      return (parsed.standings || []).map((item: any) => ({
        position: parseInt(item.position, 10),
        name: item.name,
        points: parseFloat(item.points),
        wins: parseInt(item.wins || '0', 10)
      }));
    } catch {
      return [];
    }
  }
}