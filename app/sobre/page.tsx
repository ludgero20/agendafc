import React from 'react'

export default function Sobre() {
  return (
    <div className="space-y-8">
      <div className="text-center py-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          ℹ️ Sobre o FutbolApp
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Conheça mais sobre nossa plataforma de jogos de futebol
        </p>
      </div>
      
      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-gray-100 rounded-xl p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-3">Nossa Missão</h3>
          <p className="text-gray-600">
            Facilitar o acesso à informação sobre jogos de futebol, oferecendo horários e canais de transmissão de forma prática e organizada.
          </p>
        </div>
        
        <div className="bg-gray-100 rounded-xl p-6">
          <span className="text-4xl mb-4 block">⚽</span>
          <h3 className="text-xl font-semibold text-gray-800 mb-3">Para Amantes do Futebol</h3>
          <p className="text-gray-600">
            Desenvolvido especialmente para quem não quer perder nenhum jogo importante e precisa saber onde assistir.
          </p>
        </div>
      </div>
    </div>
  )
}