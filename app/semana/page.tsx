import React from 'react'
import { CalendarDaysIcon } from '@heroicons/react/24/outline'

export default function Semana() {
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
      
      <div className="bg-gray-100 rounded-xl p-8 text-center">
        <CalendarDaysIcon className="w-5 h-5 mx-auto text-blue-600 mb-4" />
        <h3 className="text-2xl font-semibold text-gray-800 mb-2">Em breve!</h3>
        <p className="text-gray-600">A programação semanal será adicionada em breve.</p>
      </div>
    </div>
  )
}