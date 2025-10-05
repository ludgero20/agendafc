import type { Metadata } from 'next';
import fs from 'fs/promises';
import path from 'path';
import Image from 'next/image';
import CalendarioF1Client from '@/app/components/CalendarioF1Client'; // Importamos o novo componente

export const metadata: Metadata = {
  title: "Fórmula 1: Classificação e Calendário | Agenda FC",
  description: "Acompanhe o calendário completo da temporada, a classificação de pilotos e o campeonato de construtores da Fórmula 1.",
};

// --- Tipos para os dados dos seus arquivos JSON ---
type Sessao = { nome: string; data: string; hora: string; transmissao: string[]; };
type Corrida = { round: number; raceName: string; circuitName: string; country: string; status: string; winner: string | null; sessoes: Sessao[]; };
type Piloto = { position: number; name: string; nationality: string; team: string; points: number; wins: number; podiums: number; };
type Equipe = { position: number; name: string; logoUrl: string; points: number; wins: number; podiums: number; };

// --- Função para ler os arquivos JSON locais ---
async function getF1Data() {
  try {
    const calendarioPath = path.join(process.cwd(), "public/importacoes-manuais/f1/calendario.json");
    const pilotosPath = path.join(process.cwd(), "public/importacoes-manuais/f1/pilotos.json");
    const equipesPath = path.join(process.cwd(), "public/importacoes-manuais/f1/equipes.json");

    const [calendarioFile, pilotosFile, equipesFile] = await Promise.all([
      fs.readFile(calendarioPath, "utf-8"),
      fs.readFile(pilotosPath, "utf-8"),
      fs.readFile(equipesPath, "utf-8"),
    ]);

    const calendarioData = JSON.parse(calendarioFile);
    const pilotosData = JSON.parse(pilotosFile);
    const equipesData = JSON.parse(equipesFile);

    return {
      calendario: calendarioData.races as Corrida[],
      pilotos: pilotosData.standings as Piloto[],
      equipes: equipesData.standings as Equipe[],
    };
  } catch (error) {
    console.error("🚨 ERRO AO LER ARQUIVOS JSON DA F1:", error);
    return { calendario: [], pilotos: [], equipes: [] };
  }
}

// --- Componente da Página ---
export default async function F1Page() {
  const { calendario, pilotos, equipes } = await getF1Data();

  return (
    <div className="space-y-12">
      <div className="text-center">
        <h1 className="text-4xl font-bold">🏁 Fórmula 1</h1>
        <h2 className="text-xl font-bold">Temporada 2025</h2>
        <p className="text-xl text-gray-600 mt-2">Classificação de Pilotos e de Equipes</p>
        <p className="text-xl text-gray-600 mt-2">Calendário completo</p>
      </div>

      {/* MUDANÇA 1: Seção das Classificações AGORA VEM PRIMEIRO */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Tabela de Pilotos */}
        <section className="lg:col-span-3">
          <h2 className="text-3xl font-bold text-gray-800 mb-6 border-b pb-4">Classificação de Pilotos</h2>
          <div className="overflow-x-auto bg-white rounded-lg shadow-md">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold text-gray-600">#</th>
                  <th className="px-3 py-2 text-left font-semibold text-gray-600">Piloto</th>
                  <th className="px-3 py-2 text-left font-semibold text-gray-600">Equipe</th>
                  <th className="px-3 py-2 text-center font-semibold text-gray-600">Pontos</th>
                  <th className="px-3 py-2 text-center font-semibold text-gray-600">Vitórias</th>
                  <th className="px-3 py-2 text-center font-semibold text-gray-600">Pódios</th>
                </tr>
              </thead>
              <tbody>
                {pilotos.map((piloto) => (
                  <tr key={piloto.position} className="border-t hover:bg-gray-50">
                    <td className="px-3 py-2 font-bold">{piloto.position}</td>
                    <td className="px-3 py-2 font-medium">{piloto.nationality} {piloto.name}</td>
                    <td className="px-3 py-2 text-gray-600">{piloto.team}</td>
                    <td className="px-3 py-2 text-center font-bold text-blue-600">{piloto.points}</td>
                    <td className="px-3 py-2 text-center">{piloto.wins}</td>
                    <td className="px-3 py-2 text-center">{piloto.podiums}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Tabela de Equipes */}
          <section className="lg:col-span-2">
          <h2 className="text-3xl font-bold text-gray-800 mb-6 border-b pb-4">Classificação de Equipes</h2>
          <div className="overflow-x-auto bg-white rounded-lg shadow-md">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold text-gray-600">#</th>
                  <th className="px-3 py-2 text-left font-semibold text-gray-600">Equipe</th>
                  <th className="px-3 py-2 text-center font-semibold text-gray-600">Pontos</th>
                  <th className="px-3 py-2 text-center font-semibold text-gray-600">Vitórias</th>
                  <th className="px-3 py-2 text-center font-semibold text-gray-600">Pódios</th>
                </tr>
              </thead>
              <tbody>
                {equipes.map((equipe) => (
                  <tr key={equipe.position} className="border-t hover:bg-gray-50">
                    <td className="px-3 py-2 font-bold">{equipe.position}</td>
                    <td className="px-3 py-2 font-medium flex items-center">
                      {equipe.name}
                    </td>
                    <td className="px-3 py-2 text-center font-bold text-blue-600">{equipe.points}</td>
                    <td className="px-3 py-2 text-center">{equipe.wins}</td>
                    <td className="px-3 py-2 text-center">{equipe.podiums}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* MUDANÇA 1: Seção do Calendário AGORA VEM POR ÚLTIMO e usa o Client Component */}
      <CalendarioF1Client calendario={calendario} />
    </div>
  );
}