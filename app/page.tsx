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
  const [jogosHoje, setJogosHoje] = useState<Record<string, JogoSemana[]>>({});
  const [jogosAmanha, setJogosAmanha] = useState<Record<string, JogoSemana[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const carregarJogos = async () => {
      try {
        const response = await fetch('/jogos.json');
        const data = await response.json();
        
        // Obter data de hoje e amanhã (usando timezone de São Paulo)
        const agora = new Date();
        const hojeDate = new Date(agora.toLocaleString("en-US", {timeZone: "America/Sao_Paulo"}));
        const amanhaDate = new Date(hojeDate);
        amanhaDate.setDate(hojeDate.getDate() + 1);
        
        // Formatar datas para comparar (YYYY-MM-DD) usando timezone de São Paulo
        const hojeStr = hojeDate.getFullYear() + '-' + 
                       String(hojeDate.getMonth() + 1).padStart(2, '0') + '-' + 
                       String(hojeDate.getDate()).padStart(2, '0');
        const amanhaStr = amanhaDate.getFullYear() + '-' + 
                         String(amanhaDate.getMonth() + 1).padStart(2, '0') + '-' + 
                         String(amanhaDate.getDate()).padStart(2, '0');
        
        
        // Filtrar jogos por data
        const jogosDaSemanа = data.jogosSemana || [];
        const jogosDeHoje = jogosDaSemanа.filter((jogo: JogoSemana) => {
          // Converter formato DD/MM para YYYY-MM-DD se necessário
          let dataJogo = jogo.data;
          if (dataJogo.includes('/')) {
            const [dia, mes] = dataJogo.split('/');
            const ano = hojeDate.getFullYear();
            dataJogo = `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
          }
          return dataJogo === hojeStr;
        });
        
        const jogosDeAmanha = jogosDaSemanа.filter((jogo: JogoSemana) => {
          let dataJogo = jogo.data;
          if (dataJogo.includes('/')) {
            const [dia, mes] = dataJogo.split('/');
            const ano = hojeDate.getFullYear();
            dataJogo = `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
          }
          return dataJogo === amanhaStr;
        });
        
        // Organizar jogos de hoje por campeonato e horário
        const jogosHojePorCampeonato = jogosDeHoje.reduce((acc: Record<string, JogoSemana[]>, jogo: JogoSemana) => {
          if (!acc[jogo.campeonato]) {
            acc[jogo.campeonato] = [];
          }
          acc[jogo.campeonato].push(jogo);
          return acc;
        }, {} as Record<string, JogoSemana[]>);
        
        // Organizar jogos de amanhã por campeonato e horário
        const jogosAmanhaPorCampeonato = jogosDeAmanha.reduce((acc: Record<string, JogoSemana[]>, jogo: JogoSemana) => {
          if (!acc[jogo.campeonato]) {
            acc[jogo.campeonato] = [];
          }
          acc[jogo.campeonato].push(jogo);
          return acc;
        }, {} as Record<string, JogoSemana[]>);
        
        // Ordenar jogos por horário dentro de cada campeonato
        Object.keys(jogosHojePorCampeonato).forEach(campeonato => {
          jogosHojePorCampeonato[campeonato].sort((a: JogoSemana, b: JogoSemana) => a.hora.localeCompare(b.hora));
        });
        Object.keys(jogosAmanhaPorCampeonato).forEach(campeonato => {
          jogosAmanhaPorCampeonato[campeonato].sort((a: JogoSemana, b: JogoSemana) => a.hora.localeCompare(b.hora));
        });
        
        setJogosHoje(jogosHojePorCampeonato);
        setJogosAmanha(jogosAmanhaPorCampeonato);
        
      } catch (error) {
        console.error('Erro ao carregar jogos:', error);
        // Fallback para dados fixos em caso de erro
        setJogosHoje({});
        setJogosAmanha({});
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

  const getBandeiraPorCompeticao = (comp: string) => {
    switch (comp) {
      case 'Brasileirão Série A':
      case 'Brasileirão Série B':
      case 'Brasileirão Série C':
      case 'Brasileirão Série D (quartas)':
      case 'Brasileirão Feminino (final)':
      case 'Brasileirão Feminino sub-20':
      case 'Copa do Brasil':
      case 'Copa do Nordeste sub-20 (semifinal)':
      case 'Copa do Nordeste (final)':
        return '🇧🇷';
      case 'Eliminatórias Africanas':
        return '🌍';
      case 'Eliminatórias Europeias':
        return '🇪🇺';
      case 'Eliminatórias Sul-Americanas':
        return '🌎';
      case 'Eliminatórias da Concacaf':
        return '🇺🇸';
      case 'Campeonato Inglês (Quarta Divisão)':
      case 'Campeonato Inglês Feminino':
        return '🏴󠁧󠁢󠁥󠁮󠁧󠁿';
      case 'Campeonato Norte-Irlandês':
        return '🏴󠁧󠁢󠁮󠁩󠁲󠁿';
      case 'Campeonato Espanhol (Segunda Divisão)':
        return '🇪🇸';
      case 'Campeonato Uruguaio':
        return '🇺🇾';
      case 'Supercopa da Argentina':
      case 'Copa da Argentina':
        return '🇦🇷';
      case 'Liga Feminina dos EUA':
      case 'MLS':
        return '🇺🇸';
      case 'Campeonato Holandês (Segunda Divisão)':
        return '🇳🇱';
      case 'Campeonato Português':
        return '🇵🇹';
      case 'Copa da Liga Japonesa (quartas)':
        return '🇯🇵';
      case 'Campeonato Alemão Feminino':
        return '🇩🇪';
      case 'Amistoso Internacional':
        return '🌐';
      default:
        return '⚽';
    }
  };

  const agora = new Date();
  const hoje = new Date(agora.toLocaleString("en-US", {timeZone: "America/Sao_Paulo"}));
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
        {Object.keys(jogosHoje).length === 0 ? (
          <div className="bg-gray-100 rounded-xl p-6 text-center">
            <p className="text-gray-600">Nenhum jogo programado para hoje</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.keys(jogosHoje).sort().map((campeonato) => (
              <div key={campeonato} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-bold text-gray-800 flex items-center">
                    <span className="mr-3 text-xl">{getBandeiraPorCompeticao(campeonato)}</span>
                    {campeonato}
                    <span className="ml-auto bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                      {jogosHoje[campeonato].length} {jogosHoje[campeonato].length === 1 ? 'jogo' : 'jogos'}
                    </span>
                  </h3>
                </div>
                <div className="p-4">
                  <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
                    {jogosHoje[campeonato].map((jogo) => (
                      <div key={jogo.id} className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                        <div className="flex items-center justify-center mb-3">
                          <span className="text-sm font-medium text-green-600 bg-green-50 px-2 py-1 rounded">
                            🕒 {jogo.hora}
                          </span>
                        </div>
                        <div className="text-center mb-3">
                          <div className="flex items-center justify-center">
                            <span className="text-lg font-semibold text-gray-800">{jogo.time1}</span>
                            <span className="mx-3 text-gray-400 font-bold">VS</span>
                            <span className="text-lg font-semibold text-gray-800">{jogo.time2}</span>
                          </div>
                        </div>
                        <div className="text-center">
                          <span className="text-sm text-gray-600">
                            📺 {jogo.canal}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
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
        {Object.keys(jogosAmanha).length === 0 ? (
          <div className="bg-gray-100 rounded-xl p-6 text-center">
            <p className="text-gray-600">Nenhum jogo programado para amanhã</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.keys(jogosAmanha).sort().map((campeonato) => (
              <div key={campeonato} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-bold text-gray-800 flex items-center">
                    <span className="mr-3 text-xl">{getBandeiraPorCompeticao(campeonato)}</span>
                    {campeonato}
                    <span className="ml-auto bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                      {jogosAmanha[campeonato].length} {jogosAmanha[campeonato].length === 1 ? 'jogo' : 'jogos'}
                    </span>
                  </h3>
                </div>
                <div className="p-4">
                  <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
                    {jogosAmanha[campeonato].map((jogo) => (
                      <div key={jogo.id} className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                        <div className="flex items-center justify-center mb-3">
                          <span className="text-sm font-medium text-green-600 bg-green-50 px-2 py-1 rounded">
                            🕒 {jogo.hora}
                          </span>
                        </div>
                        <div className="text-center mb-3">
                          <div className="flex items-center justify-center">
                            <span className="text-lg font-semibold text-gray-800">{jogo.time1}</span>
                            <span className="mx-3 text-gray-400 font-bold">VS</span>
                            <span className="text-lg font-semibold text-gray-800">{jogo.time2}</span>
                          </div>
                        </div>
                        <div className="text-center">
                          <span className="text-sm text-gray-600">
                            📺 {jogo.canal}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
