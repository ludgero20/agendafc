import React from 'react'
import { TrophyIcon } from '@heroicons/react/24/outline'

export default function Competicoes() {
  return (
    <div className="space-y-8">
      <div className="text-center py-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          🏆 Competições
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Acompanhe todas as principais competições de futebol
        </p>
      </div>
      
      <div className="bg-gray-100 rounded-xl p-8 text-center">
        <TrophyIcon className="w-16 h-16 mx-auto text-blue-600 mb-4" />
        <h3 className="text-2xl font-semibold text-gray-800 mb-2">Em desenvolvimento!</h3>
        <p className="text-gray-600">As competições serão adicionadas em breve.</p>
      </div>
    </div>
  )
}