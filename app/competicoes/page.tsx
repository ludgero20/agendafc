"use client";

import React, { useState, useEffect } from 'react'

type Competicao = {
  id: number;
  nome: string;
  pais: string;
  tipo: string;
  descricao: string;
};

export default function Competicoes() {
  const [competicoes, setCompeticoes] = useState<Competicao[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const carregarCompeticoes = async () => {
      try {
        const response = await fetch('/competicoes.json');
        const data = await response.json();
        setCompeticoes(data.competicoes);
      } catch (error) {
        console.error('Erro ao carregar campeonatos:', error);
        setCompeticoes([]);
      } finally {
        setLoading(false);
      }
    };

    carregarCompeticoes();
  }, []);

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="text-center py-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🏆 Campeonatos
          </h1>
          <p className="text-xl text-gray-600">Carregando campeonatos...</p>
        </div>
      </div>
    );
  }

  const competicoesPorTipo = competicoes.reduce((acc, comp) => {
    const tipo = comp.tipo;
    if (!acc[tipo]) {
      acc[tipo] = [];
    }
    acc[tipo].push(comp);
    return acc;
  }, {} as Record<string, Competicao[]>);

  const getBadgeColor = (tipo: string) => {
    switch (tipo) {
      case 'Nacional': return 'bg-blue-100 text-blue-800';
      case 'Continental': return 'bg-green-100 text-green-800';
      case 'Copa Nacional': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getBandeira = (pais: string) => {
    switch (pais) {
      case 'Brasil': return '🇧🇷';
      case 'Inglaterra': return '🏴󠁧󠁢󠁥󠁮󠁧󠁿';
      case 'Espanha': return '🇪🇸';
      case 'Itália': return '🇮🇹';
      case 'França': return '🇫🇷';
      case 'Alemanha': return '🇩🇪';
      case 'Arábia Saudita': return '🇸🇦';
      case 'Europa': return '🇪🇺';
      case 'América do Sul': return '🌎';
      default: return '🌍';
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center py-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          🏆 Campeonatos
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Acompanhe todos os principais campeonatos de futebol
        </p>
      </div>
      
      {Object.keys(competicoesPorTipo).length === 0 ? (
        <div className="bg-gray-100 rounded-xl p-8 text-center">
          <h3 className="text-2xl font-semibold text-gray-800 mb-2">Em desenvolvimento!</h3>
          <p className="text-gray-600">Os campeonatos serão adicionados em breve.</p>
        </div>
      ) : (
        <div className="space-y-10">
          {Object.keys(competicoesPorTipo).map((tipo) => (
            <div key={tipo} className="">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">
                {tipo === 'Nacional' && '🏁 Competições Nacionais'}
                {tipo === 'Continental' && '🌍 Competições Continentais'}
                {tipo === 'Copa Nacional' && '🏆 Copas Nacionais'}
              </h2>
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {competicoesPorTipo[tipo].map((comp) => (
                  <div key={comp.id} className="bg-gray-100 hover:bg-gray-200 p-6 rounded-xl transition-all duration-200 border border-gray-200">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-bold text-lg text-gray-800">{comp.nome}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getBadgeColor(comp.tipo)}`}>
                        {comp.tipo}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm mb-3">{comp.descricao}</p>
                    <div className="flex items-center text-sm text-gray-500">
                      <span className="mr-2">{getBandeira(comp.pais)}</span>
                      <span>{comp.pais}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}