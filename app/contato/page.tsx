import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { EnvelopeIcon, InformationCircleIcon } from '@heroicons/react/24/outline';

export const metadata: Metadata = {
  title: "Contato - Agenda FC",
  description: "Entre em contato com a equipe do Agenda FC. Tire suas dúvidas, envie sugestões ou feedbacks sobre o nosso site.",
  keywords: "Agenda FC, contato, suporte, feedback, sugestões, e-mail",
  authors: [{ name: "Agenda FC" }],
};

export default function Contato() {
  return (
    <div className="space-y-8 max-w-5xl mx-auto py-6">
      <div className="text-center py-6">
        <h1 className="text-4xl font-extrabold text-slate-900 mb-3">
          ✉️ Fale Conosco
        </h1>
        <p className="text-lg text-slate-600 max-w-xl mx-auto">
          Estamos sempre abertos para ouvir você.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Card E-mail */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-2xs flex items-start space-x-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl flex-shrink-0">
            <EnvelopeIcon className="h-7 w-7" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">E-mail para Contato</h2>
            <p className="text-slate-600 text-sm leading-relaxed">
              Para dúvidas, sugestões ou feedbacks, envie uma mensagem para o nosso e-mail. Responderemos o mais rápido possível.
            </p>
            <a 
              href="mailto:agendafc.brasil@gmail.com" 
              className="mt-4 inline-flex items-center text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors"
            >
              agendafc.brasil@gmail.com →
            </a>
          </div>
        </div>

        {/* Card Dúvidas Frequentes */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-2xs flex items-start space-x-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl flex-shrink-0">
            <InformationCircleIcon className="h-7 w-7" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Dúvidas Frequentes</h2>
            <p className="text-slate-600 text-sm leading-relaxed">
              Antes de entrar em contato, confira nossa página{' '}
              <Link href="/sobre" className="font-bold text-blue-600 hover:text-blue-700 transition-colors underline">
                Sobre o Agenda FC
              </Link>{' '}
              para saber mais sobre nossa missão e o tipo de conteúdo que oferecemos.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}