import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Política de Privacidade - Agenda FC",
  description: "Conheça a política de privacidade do Agenda FC. Saiba como seus dados são protegidos e como usamos cookies e ferramentas de estatísticas de forma transparente.",
};

export default function PoliticaDePrivacidade() {
  return (
    <div className="space-y-10 max-w-4xl mx-auto py-6">
      <div className="text-center py-6 space-y-3">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
          🔒 Política de Privacidade
        </h1>
        <p className="text-lg text-slate-600 max-w-xl mx-auto">
          A sua privacidade e a transparência são fundamentais para nós.
        </p>
      </div>

      <div className="space-y-6">
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-3">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <span>1.</span> Informações que Coletamos
          </h2>
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
            Coletamos dados de navegação de forma 100% anônima para entender como os torcedores interagem com nosso site e para aprimorar a sua experiência. Utilizamos ferramentas de análise como o Vercel Analytics e o Google Analytics para coletar métricas estatísticas como:
          </p>
          <ul className="list-disc list-inside text-sm sm:text-base text-slate-600 space-y-1.5 pl-2">
            <li>Páginas visitadas mais acessadas.</li>
            <li>Tempo aproximado de permanência nas páginas.</li>
            <li>Tipo de dispositivo utilizado (computador, celular ou tablet).</li>
            <li>Localização geográfica aproximada (país/estado) e idioma do navegador.</li>
          </ul>
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed pt-2">
            Esses dados têm finalidade estritamente estatística e de melhoria de desempenho, não permitindo a identificação pessoal do usuário.
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-3">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <span>2.</span> Uso de Cookies
          </h2>
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
            O Agenda FC utiliza cookies para garantir o correto funcionamento da plataforma e registrar preferências de navegação. Os cookies são pequenos arquivos de texto armazenados no seu navegador. Você pode desativá-los a qualquer momento através das opções de privacidade do seu navegador, embora algumas funcionalidades possam ter seu desempenho alterado.
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-3">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <span>3.</span> Publicidade e Provedores Terceirizados (Google AdSense)
          </h2>
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
            Podemos veicular anúncios publicitários de terceiros através de redes como o Google AdSense. O Google utiliza cookies (como o cookie DART) para veicular anúncios com base nas visitas que você faz a este e a outros sites na internet, garantindo anúncios mais relevantes aos seus interesses esportivos.
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-3">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <span>4.</span> Aviso Legal e Contato
          </h2>
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
            O Agenda FC é um portal informativo independente e <strong>não possui afiliação oficial, patrocínio ou endosso</strong> de nenhuma liga esportiva, clube de futebol, emissora de televisão ou plataforma de streaming mencionada. As marcas e nomes de terceiros pertencem aos seus respectivos titulares.
          </p>
          <div className="pt-3 border-t border-slate-100 text-sm text-slate-600">
            Dúvidas ou solicitações sobre seus dados? Fale conosco através do e-mail:{' '}
            <a href="mailto:agendafc.brasil@gmail.com" className="font-bold text-blue-600 hover:underline">
              agendafc.brasil@gmail.com
            </a>.
          </div>
        </div>
      </div>
    </div>
  );
}