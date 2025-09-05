"use client";

import React, { useState, useEffect } from 'react'
import JogoCard from '../components/JogoCard'

type JogoSemana = {
  id: number;
  data: string;
  campeonato: string;
  time1: string;
  time2: string;
  hora: string;
  canal: string;
};

export default function Semana() {
  const [jogos, setJogos] = useState<JogoSemana[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const carregarJogos = async () => {
      try {
        const response = await fetch('/jogos.json');
        const data = await response.json();
        setJogos(data.jogosSemana);
      } catch (error) {
        console.error('Erro ao carregar jogos da semana:', error);
        setJogos([]);
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
            📅 Jogos da Semana
          </h1>
          <p className="text-xl text-gray-600">Carregando jogos...</p>
        </div>
      </div>
    );
  }

  const jogosPorDia = jogos.reduce((acc, jogo) => {
    const data = jogo.data;
    if (!acc[data]) {
      acc[data] = [];
    }
    acc[data].push(jogo);
    return acc;
  }, {} as Record<string, JogoSemana[]>);

  const formatarData = (data: string) => {
    const [ano, mes, dia] = data.split('-');
    const dataObj = new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia));
    return dataObj.toLocaleDateString('pt-BR', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long' 
    });
  };

  return (
    <div className="space-y-8">
      <div className="text-center py-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          📅 Jogos da Semana
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Veja todos os jogos programados para esta semana com horários e canais
        </p>
      </div>
      
      {Object.keys(jogosPorDia).length === 0 ? (
        <div className="bg-gray-100 rounded-xl p-8 text-center">
          <h3 className="text-2xl font-semibold text-gray-800 mb-2">Nenhum jogo encontrado!</h3>
          <p className="text-gray-600">Não há jogos programados para esta semana.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.keys(jogosPorDia).sort().map((data) => (
            <div key={data} className="">
              <h2 className="text-2xl font-bold text-gray-800 mb-4 capitalize">
                {formatarData(data)}
              </h2>
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {jogosPorDia[data].map((jogo) => (
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
          ))}
        </div>
      )}
    </div>
  )
}