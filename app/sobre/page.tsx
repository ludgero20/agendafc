import React from 'react'
import Head from 'next/head'

export default function Sobre() {
  return (
    <>
      <Head>
        <title>Sobre o Agenda FC - Onde assistir futebol e NFL</title>
        <meta
          name="description"
          content="Saiba mais sobre o Agenda FC, sua plataforma para acompanhar transmissões de jogos de futebol do Brasil, Europa, Champions League e NFL com horários e canais atualizados."
        />
        <meta
          name="keywords"
          content="Agenda FC, futebol ao vivo, onde assistir futebol, jogos de hoje, transmissão futebol, NFL ao vivo, Champions League, Brasileirão, Premier League"
        />
        <meta name="author" content="Agenda FC" />
      </Head>

      <div className="space-y-8">
        <div className="text-center py-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            ℹ️ Sobre o Agenda FC
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Conheça mais sobre nossa plataforma de jogos de futebol e NFL
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-gray-100 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-3">Nossa Missão</h2>
            <p className="text-gray-600">
              Facilitar o acesso às transmissões esportivas, reunindo horários e canais de jogos de futebol e NFL em um só lugar.
            </p>
          </div>

          <div className="bg-gray-100 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-3">Para Amantes do Esporte</h2>
            <p className="text-gray-600">
              Criado para torcedores que não querem perder nenhum lance, seja no Brasileirão, Champions League ou NFL.
            </p>
          </div>
        </div>
      </div>
    </>
  )
}