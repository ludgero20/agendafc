import React from 'react';
import Head from 'next/head';
import { FaEnvelope, FaInfoCircle } from 'react-icons/fa'; // Importando ícones, se você os utiliza

export default function Contato() {
  return (
    <>
      <Head>
        <title>Contato - Agenda FC</title>
        <meta
          name="description"
          content="Entre em contato com a equipe do Agenda FC. Tire suas dúvidas, envie sugestões ou feedbacks sobre o nosso site."
        />
        <meta name="keywords" content="Agenda FC, contato, suporte, feedback, sugestões, e-mail" />
        <meta name="author" content="Agenda FC" />
      </Head>

      <div className="space-y-8">
        <div className="text-center py-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            ✉️ Fale Conosco
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Estamos sempre abertos para ouvir você.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-gray-100 rounded-xl p-6 flex items-start space-x-4">
            <FaEnvelope className="text-3xl text-gray-800 flex-shrink-0" />
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">E-mail para Contato</h2>
              <p className="text-gray-600">
                Para dúvidas, sugestões ou feedbacks, envie uma mensagem para o nosso e-mail. Responderemos o mais rápido possível.
              </p>
              <a 
                href="mailto:agendafc.brasil@gmail.com" 
                className="mt-4 inline-block text-blue-600 hover:text-blue-800 font-medium transition-colors"
              >
                agendafc.brasil@gmail.com
              </a>
            </div>
          </div>

          <div className="bg-gray-100 rounded-xl p-6 flex items-start space-x-4">
            <FaInfoCircle className="text-3xl text-gray-800 flex-shrink-0" />
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">Dúvidas Frequentes</h2>
              <p className="text-gray-600">
                Antes de entrar em contato, confira nossa página <a href="/sobre" className="font-medium text-blue-600 hover:text-blue-800 transition-colors">Sobre o Agenda FC</a> para saber mais sobre nossa missão e o tipo de conteúdo que oferecemos.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}