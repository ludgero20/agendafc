'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  const menuItems = [
    { href: '/', label: 'Início' },
    { href: '/semana', label: 'Agenda da semana' },
    { href: '/campeonatos', label: 'Tabelas' },
    { href: '/time', label: 'Times' },
    { href: '/instalar', label: 'Baixe o App' }
  ];

  return (
    <>
      <header className="fixed top-0 left-0 right-0 bg-white shadow-xs z-[60] border-b border-slate-200">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex-shrink-0">
              <Link 
                href="/" 
                className="text-2xl font-black text-blue-600 tracking-tight whitespace-nowrap"
                onClick={closeMobileMenu}
              >
                 Agenda FC 
              </Link>
            </div>

            {/* Desktop Navigation Links */}
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-2">
                {menuItems.map((item) => {
                  // 🎯 DESTAQUE PERSISTENTE: Fica ativo na Home e também em subpáginas como /time/flamengo
                  const isActive = item.href === '/' 
                    ? pathname === '/' 
                    : pathname.startsWith(item.href);

                  return (
                    <Link 
                      key={item.href}
                      href={item.href} 
                      className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-all duration-150 ${
                        isActive 
                          ? 'text-blue-600 bg-blue-50/80 shadow-2xs' 
                          : 'text-slate-600 hover:text-blue-600 hover:bg-slate-50'
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
                className="p-2 rounded-xl text-slate-700 hover:text-blue-600 hover:bg-slate-50 focus:outline-hidden transition-colors"
                aria-label="Alternar menu mobile"
                aria-controls="mobile-menu"
                aria-expanded={mobileMenuOpen}
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
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 md:hidden animate-fade-in"
          onClick={closeMobileMenu}
        />
      )}

      {/* Mobile Menu Dropdown */}
      <div 
        id="mobile-menu"
        className={`
          fixed top-16 left-0 right-0 bg-white shadow-xl z-50 md:hidden border-b border-slate-200
          transform transition-all duration-200 ease-in-out
          ${mobileMenuOpen ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0 pointer-events-none'}
        `}
      >
        <nav className="px-4 py-3">
          <div className="space-y-1">
            {menuItems.map((item) => {
              const isActive = item.href === '/' 
                ? pathname === '/' 
                : pathname.startsWith(item.href);

              return (
                <Link 
                  key={item.href}
                  href={item.href}
                  onClick={closeMobileMenu}
                  className={`block px-4 py-3 text-base font-semibold rounded-xl transition-colors ${
                    isActive
                      ? 'text-blue-600 bg-blue-50 font-bold'
                      : 'text-slate-700 hover:text-blue-600 hover:bg-slate-50'
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