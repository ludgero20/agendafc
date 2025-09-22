import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: "Instale o Agenda FC no seu Celular | Acesso Rápido",
  description: "Siga nosso guia passo a passo para adicionar o Agenda FC à tela inicial do seu iPhone ou Android e tenha acesso rápido à programação de jogos como se fosse um aplicativo.",
};

export default function InstalarPage() {
  return (
    <div className="bg-white p-8 rounded-xl shadow-md border max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-800">Instale o Agenda FC</h1>
        <p className="text-xl text-gray-600 mt-2">
          Tenha acesso rápido à agenda de jogos com um clique, como se fosse um aplicativo!
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Instruções para iPhone */}
        <div className="bg-gray-50 p-6 rounded-lg border">
          <h2 className="text-2xl font-bold mb-4 text-center">📱 Para iPhone (iOS)</h2>
          <ol className="list-decimal list-inside space-y-4 text-gray-700">
            <li>Abra o site <Link href="/" className="text-blue-600 font-semibold">AgendaFC.com.br</Link> no navegador <strong>Safari</strong>.</li>
            <li>Toque no ícone de <strong>Compartilhar</strong> (um quadrado com uma seta para cima) na barra inferior.</li>
            <li>Role para baixo e selecione a opção <strong>"Adicionar à Tela de Início"</strong>.</li>
            <li>Confirme o nome do atalho e toque em <strong>"Adicionar"</strong>. Pronto!</li>
          </ol>
        </div>

        {/* Instruções para Android */}
        <div className="bg-gray-50 p-6 rounded-lg border">
          <h2 className="text-2xl font-bold mb-4 text-center">🤖 Para Android</h2>
          <ol className="list-decimal list-inside space-y-4 text-gray-700">
            <li>Abra o site <Link href="/" className="text-blue-600 font-semibold">AgendaFC.com.br</Link> no navegador <strong>Google Chrome</strong>.</li>
            <li>Toque no ícone de <strong>menu</strong> (três pontinhos verticais) no canto superior direito.</li>
            <li>No menu que aparecer, selecione a opção <strong>"Instalar aplicativo"</strong> ou <strong>"Adicionar à tela inicial"</strong>.</li>
            <li>Siga as instruções para confirmar e pronto!</li>
          </ol>
        </div>
      </div>

      <p className="text-center text-gray-500 mt-8">
        Agora você pode acessar a programação de jogos diretamente da sua tela inicial, de forma rápida e prática.
      </p>
    </div>
  );
}