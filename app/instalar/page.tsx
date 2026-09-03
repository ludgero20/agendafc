import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: "Instale o Agenda FC no seu Celular | Acesso Rápido",
  description: "Siga nosso guia passo a passo para adicionar o Agenda FC à tela inicial do seu iPhone ou Android e tenha acesso rápido à programação de jogos como se fosse um aplicativo.",
};

export default function InstalarPage() {
  return (
    <div className="space-y-10 max-w-4xl mx-auto py-6">
      {/* HEADER */}
      <div className="text-center py-6 space-y-3">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200/60">
          📲 Aplicativo Web Leve (PWA)
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
          Instale o Agenda FC no Celular
        </h1>
        <p className="text-base sm:text-lg text-slate-600 max-w-xl mx-auto leading-relaxed">
          Tenha acesso instantâneo à programação de esportes na TV direto da sua tela de início, sem ocupar a memória do seu aparelho.
        </p>
      </div>

      {/* GRADE DE INSTRUÇÕES */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* iPhone (iOS) */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <span className="text-3xl">📱</span>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Para iPhone (iOS)</h2>
                <p className="text-xs text-slate-500 font-medium">Usando o navegador Safari</p>
              </div>
            </div>

            <ol className="space-y-4 text-sm text-slate-600">
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 text-slate-800 font-bold text-xs flex items-center justify-center mt-0.5">1</span>
                <span>Abra o site no <strong className="text-slate-900">Safari</strong> no seu iPhone.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 text-slate-800 font-bold text-xs flex items-center justify-center mt-0.5">2</span>
                <span>Toque no botão <strong className="text-slate-900">Compartilhar</strong> (o ícone de um quadrado com uma seta para cima, na barra inferior).</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 text-slate-800 font-bold text-xs flex items-center justify-center mt-0.5">3</span>
                <span>Role o menu para baixo e toque em <strong className="text-blue-600">"Adicionar à Tela de Início"</strong>.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 text-slate-800 font-bold text-xs flex items-center justify-center mt-0.5">4</span>
                <span>Confirme o nome e toque em <strong className="text-slate-900">"Adicionar"</strong> no topo. Pronto!</span>
              </li>
            </ol>
          </div>

          <div className="pt-4 border-t border-slate-100 text-center">
            <Link href="/" className="text-xs font-bold text-blue-600 hover:text-blue-700">
              ← Voltar para a Agenda
            </Link>
          </div>
        </div>

        {/* Android */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <span className="text-3xl">🤖</span>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Para Android</h2>
                <p className="text-xs text-slate-500 font-medium">Usando o Google Chrome</p>
              </div>
            </div>

            <ol className="space-y-4 text-sm text-slate-600">
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 text-slate-800 font-bold text-xs flex items-center justify-center mt-0.5">1</span>
                <span>Abra o site no <strong className="text-slate-900">Google Chrome</strong> no seu celular.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 text-slate-800 font-bold text-xs flex items-center justify-center mt-0.5">2</span>
                <span>Toque nos <strong className="text-slate-900">três pontinhos</strong> no canto superior direito.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 text-slate-800 font-bold text-xs flex items-center justify-center mt-0.5">3</span>
                <span>Selecione <strong className="text-blue-600">"Instalar aplicativo"</strong> ou <strong className="text-blue-600">"Adicionar à tela inicial"</strong>.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 text-slate-800 font-bold text-xs flex items-center justify-center mt-0.5">4</span>
                <span>Confirme a instalação e o app aparecerá na sua grade de aplicativos!</span>
              </li>
            </ol>
          </div>

          <div className="pt-4 border-t border-slate-100 text-center">
            <Link href="/" className="text-xs font-bold text-blue-600 hover:text-blue-700">
              ← Voltar para a Agenda
            </Link>
          </div>
        </div>

      </div>

      <div className="text-center bg-slate-100/60 p-5 rounded-2xl border border-slate-200 max-w-xl mx-auto">
        <p className="text-xs font-medium text-slate-600">
          ⚡ O Agenda FC é um Web App ultraleve: não gasta a bateria do seu celular e não ocupa o espaço da memória interna como apps tradicionais.
        </p>
      </div>
    </div>
  );
}