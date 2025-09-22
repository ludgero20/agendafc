'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation'; // NOVO: Hook para saber a página atual

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname(); // NOVO: Pega o caminho da URL atual (ex: "/campeonatos")

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  const menuItems = [
    { href: '/', label: 'Início' },
    { href: '/semana', label: 'Agenda da semana' },
    { href: '/campeonatos', label: 'Tabelas' }
  ];

  return (
    <>
      <header className="fixed top-0 left-0 right-0 bg-white shadow-md z-[60] border-b border-gray-200">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex-shrink-0">
              <Link 
                href="/" 
                className="text-2xl font-bold text-blue-600 whitespace-nowrap" // MUDANÇA: Adicionado whitespace-nowrap
                onClick={closeMobileMenu}
              >
                ⚽ Agenda FC 🏈
              </Link>
            </div>

            {/* Desktop Navigation Links */}
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                {menuItems.map((item) => {
                  const isActive = pathname === item.href; // NOVO: Verifica se o link é da página atual
                  return (
                    <Link 
                      key={item.href}
                      href={item.href} 
                      // MUDANÇA: Classes dinâmicas para destacar o link ativo
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                        isActive 
                          ? 'text-blue-600 bg-blue-50 font-semibold' 
                          : 'text-gray-700 hover:text-blue-600 hover:bg-gray-100'
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button 
                onClick={toggleMobileMenu}
                className="text-gray-700 hover:text-blue-600 focus:outline-none focus:text-blue-600 transition-colors"
                aria-label="Toggle mobile menu"
                aria-controls="mobile-menu"     // NOVO: Acessibilidade
                aria-expanded={mobileMenuOpen}  // NOVO: Acessibilidade
              >
                {mobileMenuOpen ? (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </nav>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={closeMobileMenu}
        ></div>
      )}

      {/* Mobile Menu */}
      <div 
        id="mobile-menu" // NOVO: Acessibilidade
        className={`
          fixed top-16 left-0 right-0 bg-white shadow-lg z-50 md:hidden border-b border-gray-200
          transform transition-all duration-300 ease-in-out
          ${mobileMenuOpen ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 pointer-events-none'}
        `} // MUDANÇA: Adicionado pointer-events-none quando fechado
      >
        <nav className="px-4 py-2">
          <div className="space-y-1">
            {menuItems.map((item) => {
              const isActive = pathname === item.href; // NOVO: Verifica se o link é da página atual
              return (
                <Link 
                  key={item.href}
                  href={item.href}
                  onClick={closeMobileMenu}
                  // MUDANÇA: Classes dinâmicas para destacar o link ativo
                  className={`block px-4 py-3 text-base font-medium rounded-md transition-colors duration-200 ${
                    isActive
                      ? 'text-blue-600 bg-blue-50 font-semibold'
                      : 'text-gray-700 hover:text-blue-600 hover:bg-gray-100'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </>
  );
}