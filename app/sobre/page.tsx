import React from 'react';
import Head from 'next/head';

export default function Sobre() {
  return (
    <>
      <Head>
        <title>Sobre o Agenda FC - Onde assistir futebol, NFL e mais</title>
        <meta
          name="description"
          content="Conheça a nossa história e missão. O Agenda FC é a sua plataforma completa para encontrar horários e canais de transmissão de futebol, NFL e outros esportes de forma fácil e rápida."
        />
        <meta
          name="keywords"
          content="Agenda FC, sobre nós, missão, visão, futebol, NFL, onde assistir, transmissão esportiva, canais de esporte"
        />
        <meta name="author" content="Agenda FC" />
      </Head>

      <div className="space-y-12">
        <div className="text-center py-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            ℹ️ Sobre o Agenda FC
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Mais do que um site, somos a sua bússola no mundo dos esportes.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Nova seção: Nossa História e Missão */}
          <div className="bg-gray-100 rounded-xl p-8 shadow-sm">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Nossa Missão</h2>
            <p className="text-lg text-gray-600 mb-4">
              O <strong>Agenda FC</strong> nasceu de uma necessidade comum: a dificuldade de saber, de forma rápida e confiável, onde e a que horas assistir aos principais jogos. Nossa missão é acabar com essa busca, compilando as informações mais importantes sobre transmissões de futebol, NFL e outros eventos esportivos em um só lugar.
            </p>
            <p className="text-lg text-gray-600">
              Queremos ser a primeira e única parada para o torcedor que não quer perder um único lance.
            </p>
          </div>

          {/* Nova seção: O que Oferecemos */}
          <div className="bg-gray-100 rounded-xl p-8 shadow-sm">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">O que Você Encontra Aqui</h2>
            <ul className="list-disc list-inside text-lg text-gray-600 space-y-3">
              <li>
                <strong>Grade de Jogos Atualizada:</strong> Informações diárias sobre partidas do Brasil, Europa e América, sempre com horários e canais de transmissão verificados.
              </li>
              <li>
               <strong>Cobertura de Ligas e Campeonatos:</strong> Foco nos campeonatos mais importantes como Brasileirão, Copa do Brasil, Libertadores, Champions League, Premier League, La Liga, além de conteúdo exclusivo sobre a NFL.
              </li>
              <li>
                <strong>Simplicidade e Facilidade:</strong> Um design limpo e intuitivo, feito para que você encontre a informação que precisa em poucos cliques, no celular ou no computador.
              </li>
            </ul>
          </div>

          {/* Nova seção: Por que Confiar em Nós */}
          <div className="bg-gray-100 rounded-xl p-8 col-span-full shadow-sm">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4 text-center">Por que Confiar no Agenda FC?</h2>
            <p className="text-lg text-gray-600 text-center max-w-3xl mx-auto">
              Nossa dedicação é total à <strong>precisão</strong>. As informações de transmissão são cuidadosamente compiladas a partir de fontes oficiais para garantir que você não perca nenhum jogo. O Agenda FC é feito por fãs, para fãs, com a certeza de que a melhor experiência de torcedor começa com a informação certa.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}