"use client";

import React, { useState, useEffect } from 'react'
// Removidas dependências do arquivo prioridades.ts - agora usa JSON direto

type Competicao = {
  id: number;
  nome: string;
  pais: string;
  tipo: string;
  descricao: string;
  prioridade: number;
  ativo: boolean;
  bandeiraEmoji: string;
};

type GrupoPrioridade = {
  nome: string;
  cor: string;
  descricao: string;
};

export default function Competicoes() {
  const [competicoes, setCompeticoes] = useState<Competicao[]>([]);
  const [gruposPrioridade, setGruposPrioridade] = useState<Record<string, GrupoPrioridade>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const carregarDados = async () => {
      try {
        const response = await fetch('/competicoes-unificadas.json');
        const data = await response.json();
        setCompeticoes(data.competicoes.filter(comp => comp.ativo));
        setGruposPrioridade(data.grupos_prioridade);
      } catch (error) {
        console.error('Erro ao carregar campeonatos:', error);
        setCompeticoes([]);
        setGruposPrioridade({});
      } finally {
        setLoading(false);
      }
    };

    carregarDados();
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

  // Agrupar competições por prioridade
  const competicoesPorPrioridade = competicoes.reduce((acc, comp) => {
    const prioridade = comp.prioridade;
    if (!acc[prioridade]) {
      acc[prioridade] = [];
    }
    acc[prioridade].push(comp);
    return acc;
  }, {} as Record<number, Competicao[]>);

  const getBadgeColor = (tipo: string) => {
    switch (tipo) {
      case 'Nacional': return 'bg-blue-100 text-blue-800';
      case 'Continental': return 'bg-green-100 text-green-800';
      case 'Copa Nacional': return 'bg-yellow-100 text-yellow-800';
      case 'Eliminatórias': return 'bg-purple-100 text-purple-800';
      case 'Amistoso': return 'bg-gray-100 text-gray-800';
      case 'Futebol Americano': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
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
      
      {Object.keys(competicoesPorPrioridade).length === 0 ? (
        <div className="bg-gray-100 rounded-xl p-8 text-center">
          <h3 className="text-2xl font-semibold text-gray-800 mb-2">Em desenvolvimento!</h3>
          <p className="text-gray-600">Os campeonatos serão adicionados em breve.</p>
        </div>
      ) : (
        <div className="space-y-10">
          {/* Ordenar prioridades de 1 a 5 */}
          {[1, 2, 3, 4, 5].map((prioridade) => {
            const competicoesGrupo = competicoesPorPrioridade[prioridade] || [];
            const grupoInfo = gruposPrioridade[prioridade.toString()];
            
            if (competicoesGrupo.length === 0) return null;
            
            return (
              <div key={prioridade} className="">
                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${grupoInfo?.cor || 'bg-gray-100 text-gray-800'}`}>
                      Prioridade {prioridade}
                    </span>
                    <h2 className="text-2xl font-bold text-gray-800">
                      {grupoInfo?.nome || `Prioridade ${prioridade}`}
                    </h2>
                  </div>
                  <p className="text-gray-600">{grupoInfo?.descricao}</p>
                </div>
                
                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                  {competicoesGrupo.map((comp) => (
                    <div key={comp.id} className="bg-white hover:bg-gray-50 p-6 rounded-xl transition-all duration-200 border border-gray-200 shadow-sm">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{comp.bandeiraEmoji}</span>
                          <h3 className="font-bold text-lg text-gray-800">{comp.nome}</h3>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getBadgeColor(comp.tipo)}`}>
                          {comp.tipo}
                        </span>
                      </div>
                      
                      <p className="text-gray-600 text-sm mb-3">{comp.descricao}</p>
                      
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center text-gray-500">
                          <span className="mr-1">📍</span>
                          <span>{comp.pais}</span>
                        </div>
                        <div className="flex items-center text-gray-400">
                          <span className="mr-1">🏆</span>
                          <span>P{comp.prioridade}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  )
}