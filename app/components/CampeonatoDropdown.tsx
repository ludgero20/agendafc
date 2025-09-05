"use client";

import React, { useState } from 'react';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import { getBandeiraPorCompeticao } from '../utils/prioridades';

interface CampeonatoDropdownProps {
  campeonatos: string[];
  campeonatosSelecionados: string[];
  onSelecaoChange: (campeonatos: string[]) => void;
}

export default function CampeonatoDropdown({
  campeonatos,
  campeonatosSelecionados,
  onSelecaoChange
}: CampeonatoDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const handleCampeonatoToggle = (campeonato: string) => {
    const novaSeleção = campeonatosSelecionados.includes(campeonato)
      ? campeonatosSelecionados.filter(c => c !== campeonato)
      : [...campeonatosSelecionados, campeonato];
    
    onSelecaoChange(novaSeleção);
  };

  const selecionarTodos = () => {
    onSelecaoChange(campeonatos);
  };

  const limparSelecao = () => {
    onSelecaoChange([]);
  };

  const totalSelecionados = campeonatosSelecionados.length;
  const totalCampeonatos = campeonatos.length;

  return (
    <div className="relative mb-6">
      <button
        onClick={toggleDropdown}
        className="w-full md:w-auto bg-white border border-gray-300 rounded-lg px-4 py-3 flex items-center justify-between min-w-[300px] hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center">
          <span className="text-gray-700 font-medium mr-2">🏆 Filtrar Campeonatos</span>
          <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2 py-1 rounded-full">
            {totalSelecionados}/{totalCampeonatos}
          </span>
        </div>
        {isOpen ? (
          <ChevronUpIcon className="h-5 w-5 text-gray-400" />
        ) : (
          <ChevronDownIcon className="h-5 w-5 text-gray-400" />
        )}
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          {/* Botões de controle */}
          <div className="p-3 border-b border-gray-200 bg-gray-50">
            <div className="flex gap-2">
              <button
                onClick={selecionarTodos}
                className="flex-1 bg-blue-500 text-white px-3 py-2 rounded text-sm font-medium hover:bg-blue-600 transition-colors"
              >
                ✅ Selecionar Todos
              </button>
              <button
                onClick={limparSelecao}
                className="flex-1 bg-gray-500 text-white px-3 py-2 rounded text-sm font-medium hover:bg-gray-600 transition-colors"
              >
                🚫 Limpar Seleção
              </button>
            </div>
          </div>

          {/* Lista de campeonatos */}
          <div className="max-h-80 overflow-y-auto">
            {campeonatos.map((campeonato) => (
              <label
                key={campeonato}
                className="flex items-center p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
              >
                <input
                  type="checkbox"
                  checked={campeonatosSelecionados.includes(campeonato)}
                  onChange={() => handleCampeonatoToggle(campeonato)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-3"
                />
                <span className="text-xl mr-3">{getBandeiraPorCompeticao(campeonato)}</span>
                <span className="text-gray-700 font-medium text-sm flex-1">{campeonato}</span>
              </label>
            ))}
          </div>

          {/* Footer com informações */}
          <div className="p-3 bg-gray-50 border-t border-gray-200">
            <div className="text-xs text-gray-600 text-center">
              {totalSelecionados === 0 && (
                <span className="text-red-600 font-medium">⚠️ Nenhum campeonato selecionado - nenhum jogo será exibido</span>
              )}
              {totalSelecionados > 0 && totalSelecionados < totalCampeonatos && (
                <span>📊 Mostrando {totalSelecionados} de {totalCampeonatos} campeonatos</span>
              )}
              {totalSelecionados === totalCampeonatos && (
                <span className="text-green-600 font-medium">✅ Todos os campeonatos selecionados</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}