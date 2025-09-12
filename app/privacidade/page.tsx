import React from 'react'
import Head from 'next/head'

export default function PoliticaDePrivacidade() {
  return (
    <>
      <Head>
        <title>Política de Privacidade - Agenda FC</title>
        <meta
          name="description"
          content="Conheça a política de privacidade do Agenda FC, o seu guia para transmissões de futebol e NFL. Saiba como seus dados são usados e protegidos."
        />
      </Head>

      <div className="space-y-8">
        <div className="text-center py-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🔒 Política de Privacidade
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            A sua privacidade é a nossa prioridade.
          </p>
        </div>

        <div className="grid md:grid-cols-1 gap-8">
          <div className="bg-gray-100 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-3">1. Informações que Coletamos</h2>
            <p className="text-gray-600 mb-4">
              Coletamos dados de navegação de forma anônima para entender como os usuários interagem com nosso site e para melhorar sua experiência. Utilizamos o **Vercel Analytics** e, futuramente, o **Google Analytics** para isso. Essas ferramentas coletam dados como:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2">
              <li>Páginas que você visitou.</li>
              <li>Tempo de permanência em cada página.</li>
              <li>Tipo de dispositivo que você usa (computador, celular, etc.).</li>
              <li>Localização geográfica aproximada e idioma.</li>
            </ul>
            <p className="mt-4 text-gray-600">
              Esses dados são usados apenas para fins estatísticos e não nos permitem identificar você pessoalmente.
            </p>
          </div>

          <div className="bg-gray-100 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-3">2. Uso de Cookies</h2>
            <p className="text-gray-600">
              O Agenda FC utiliza cookies para funcionar de maneira eficiente e para coletar as informações de navegação mencionadas acima. Os cookies são pequenos arquivos de texto armazenados no seu navegador. Você pode desativar os cookies a qualquer momento nas configurações do seu navegador, mas isso pode afetar a funcionalidade de algumas partes do site.
            </p>
          </div>

          <div className="bg-gray-100 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-3">3. Publicidade (Google AdSense)</h2>
            <p className="text-gray-600">
              Pretendemos usar o Google AdSense para exibir anúncios em nosso site. O Google, como um provedor terceirizado, utiliza cookies para veicular anúncios com base nas suas visitas anteriores ao nosso ou a outros sites. Isso é feito para exibir anúncios que sejam relevantes para você.
            </p>
          </div>

          <div className="bg-gray-100 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-3">4. Aviso Legal e Contato</h2>
            <p className="text-gray-600 mb-4">
              O Agenda FC é um portal de informações independentes e **não é afiliado ou endossado** por nenhuma liga, clube de futebol, emissora de TV ou plataforma de streaming mencionada. As informações aqui contidas são compiladas a partir de fontes públicas e podem sofrer alterações.
            </p>
            <p className="text-gray-600">
              Ao utilizar nosso site, você concorda com os termos desta política. Caso tenha dúvidas, entre em contato através do e-mail **agenda.fc@gmail.com**.
            </p>
          </div>
        </div>
      </div>
    </>
  )
}