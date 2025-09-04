import "./globals.css";
import Link from "next/link";

export const metadata = {
  title: "Futebol na TV",
  description: "Jogos de hoje e da semana com horários e canais de transmissão",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="bg-gray-100 text-gray-900">
        {/* Header */}
        <header className="bg-green-700 text-white p-4 shadow-md">
          <nav className="flex justify-between items-center max-w-5xl mx-auto">
            <h1 className="text-xl font-bold">Futebol na TV</h1>
            <ul className="flex gap-4">
              <li><Link href="/">Jogos de Hoje</Link></li>
              <li><Link href="/semana">Jogos da Semana</Link></li>
              <li><Link href="/competicoes">Competições</Link></li>
              <li><Link href="/sobre">Sobre</Link></li>
            </ul>
          </nav>
        </header>

        {/* Main */}
        <main className="max-w-5xl mx-auto p-6">{children}</main>

        {/* Footer */}
        <footer className="bg-gray-900 text-white text-center p-4 text-sm mt-6">
          © {new Date().getFullYear()} Futebol na TV – Todos os direitos reservados
        </footer>
      </body>
    </html>
  );
}
