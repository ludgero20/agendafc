"use client";

import React, { useState, useEffect } from 'react';
import JogoCard from "./components/JogoCard";

type Jogo = {
  id: number;
  campeonato: string;
  time1: string;
  time2: string;
  hora: string;
  canal: string;
};

export default function Home() {
  const [jogos, setJogos] = useState<Jogo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const carregarJogos = async () => {
      try {
        const response = await fetch('/jogos.json');
        const data = await response.json();
        setJogos(data.jogosHoje);
      } catch (error) {
        console.error('Erro ao carregar jogos:', error);
        // Fallback para dados fixos em caso de erro
        setJogos([
          { id: 1, campeonato: "Brasileirão Série A", time1: "Flamengo", time2: "Palmeiras", hora: "20:00", canal: "Globo / Premiere" },
          { id: 2, campeonato: "Champions League", time1: "Real Madrid", time2: "Manchester City", hora: "16:00", canal: "HBO Max" },
        ]);
      } finally {
        setLoading(false);
      }
    };

    carregarJogos();
  }, []);

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="text-center py-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            ⚽ Jogos de Hoje
          </h1>
          <p className="text-xl text-gray-600">Carregando jogos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center py-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          ⚽ Jogos de Hoje
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Acompanhe todos os jogos de futebol de hoje com horários e canais de transmissão
        </p>
      </div>

      {/* Games Section */}
      <div className="">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Jogos Agendados</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {jogos.map((jogo) => (
            <JogoCard
              key={jogo.id}
              campeonato={jogo.campeonato}
              time1={jogo.time1}
              time2={jogo.time2}
              hora={jogo.hora}
              canal={jogo.canal}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
