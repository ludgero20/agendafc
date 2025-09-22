import Link from 'next/link';
import { ArrowDownTrayIcon } from '@heroicons/react/24/solid';

const Footer = () => {
  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center text-sm text-gray-500">
        <p className="mb-4 sm:mb-0 text-center sm:text-left">
          © {new Date().getFullYear()} Agenda FC • Feito com ❤️ para os amantes do esporte.
        </p>
        <div className="flex items-center space-x-6">
          <Link href="/sobre" className="hover:text-blue-600">Sobre</Link>
          <Link href="/contato" className="hover:text-blue-600">Contato</Link>
          <Link href="/privacidade" className="hover:text-blue-600">Privacidade</Link>
          <Link href="/instalar" className="flex items-center text-gray-700 font-semibold hover:text-blue-600 transition-colors">
            <ArrowDownTrayIcon className="h-5 w-5 mr-1" />
            <span>Instalar App</span>
          </Link>          
        </div>
      </div>
    </footer>
  );
};

export default Footer;