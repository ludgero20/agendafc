"use client";

import React, { useState, useEffect } from 'react';
import JogoCard from "./components/JogoCard";

type JogoSemana = {
  id: number;
  data: string;
  campeonato: string;
  time1: string;
  time2: string;
  hora: string;
  canal: string;
};

export default function Home() {
  const [jogosHoje, setJogosHoje] = useState<JogoSemana[]>([]);
  const [jogosAmanha, setJogosAmanha] = useState<JogoSemana[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const carregarJogos = async () => {
      try {
        const response = await fetch('/jogos.json');
        const data = await response.json();
        
        // Obter data de hoje e amanhã (usando timezone local)
        const hoje = new Date();
        const amanha = new Date(hoje);
        amanha.setDate(hoje.getDate() + 1);
        
        // Formatar datas para comparar (YYYY-MM-DD) usando timezone local
        const hojeStr = hoje.getFullYear() + '-' + 
                       String(hoje.getMonth() + 1).padStart(2, '0') + '-' + 
                       String(hoje.getDate()).padStart(2, '0');
        const amanhaStr = amanha.getFullYear() + '-' + 
                         String(amanha.getMonth() + 1).padStart(2, '0') + '-' + 
                         String(amanha.getDate()).padStart(2, '0');
        
        
        // Filtrar jogos por data
        const jogosDaSemanа = data.jogosSemana || [];
        const jogosDeHoje = jogosDaSemanа.filter((jogo: JogoSemana) => {
          // Converter formato DD/MM para YYYY-MM-DD se necessário
          let dataJogo = jogo.data;
          if (dataJogo.includes('/')) {
            const [dia, mes] = dataJogo.split('/');
            const ano = hoje.getFullYear();
            dataJogo = `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
          }
          return dataJogo === hojeStr;
        });
        
        const jogosDeAmanha = jogosDaSemanа.filter((jogo: JogoSemana) => {
          let dataJogo = jogo.data;
          if (dataJogo.includes('/')) {
            const [dia, mes] = dataJogo.split('/');
            const ano = hoje.getFullYear();
            dataJogo = `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
          }
          return dataJogo === amanhaStr;
        });
        
        setJogosHoje(jogosDeHoje);
        setJogosAmanha(jogosDeAmanha);
        
      } catch (error) {
        console.error('Erro ao carregar jogos:', error);
        // Fallback para dados fixos em caso de erro
        setJogosHoje([]);
        setJogosAmanha([]);
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
            ⚽ Jogos de Hoje e Amanhã
          </h1>
          <p className="text-xl text-gray-600">Carregando jogos...</p>
        </div>
      </div>
    );
  }

  const formatarData = (data: Date) => {
    return data.toLocaleDateString('pt-BR', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long' 
    });
  };

  const hoje = new Date();
  const amanha = new Date(hoje);
  amanha.setDate(hoje.getDate() + 1);

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center py-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          ⚽ Jogos de Hoje e Amanhã
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Acompanhe todos os jogos de futebol de hoje e amanhã com horários e canais de transmissão
        </p>
      </div>

      {/* Jogos de Hoje */}
      <div className="">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800 capitalize">
            📅 Hoje - {formatarData(hoje)}
          </h2>
        </div>
        {jogosHoje.length === 0 ? (
          <div className="bg-gray-100 rounded-xl p-6 text-center">
            <p className="text-gray-600">Nenhum jogo programado para hoje</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {jogosHoje.map((jogo) => (
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
        )}
      </div>

      {/* Jogos de Amanhã */}
      <div className="">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800 capitalize">
            📅 Amanhã - {formatarData(amanha)}
          </h2>
        </div>
        {jogosAmanha.length === 0 ? (
          <div className="bg-gray-100 rounded-xl p-6 text-center">
            <p className="text-gray-600">Nenhum jogo programado para amanhã</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {jogosAmanha.map((jogo) => (
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
        )}
      </div>
    </div>
  );
}
