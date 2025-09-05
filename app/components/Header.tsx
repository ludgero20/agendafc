"use client";

import React, { useState } from 'react';
import Link from 'next/link';

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  const menuItems = [
    { href: '/', label: 'Início' },
    { href: '/semana', label: 'Agenda da semana' },
    { href: '/competicoes', label: 'Competições' },
    { href: '/canais', label: 'Canais' },
    { href: '/sobre', label: 'Sobre' }
  ];

  return (
    <>
      <header className="fixed top-0 left-0 right-0 bg-white shadow-md z-[60] border-b border-gray-200">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex-shrink-0">
              <Link href="/" className="text-2xl font-bold text-blue-600" onClick={closeMobileMenu}>
                ⚽ FutbolApp
              </Link>
            </div>

            {/* Desktop Navigation Links */}
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                {menuItems.map((item) => (
                  <Link 
                    key={item.href}
                    href={item.href} 
                    className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-100 transition-colors"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button 
                onClick={toggleMobileMenu}
                className="text-gray-700 hover:text-blue-600 focus:outline-none focus:text-blue-600 transition-colors"
                aria-label="Toggle mobile menu"
              >
                {mobileMenuOpen ? (
                  // X icon when menu is open
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  // Hamburger icon when menu is closed
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
      <div className={`
        fixed top-16 left-0 right-0 bg-white shadow-lg z-50 md:hidden border-b border-gray-200
        transform transition-all duration-300 ease-in-out
        ${mobileMenuOpen ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}
      `}>
        <nav className="px-4 py-2">
          <div className="space-y-1">
            {menuItems.map((item) => (
              <Link 
                key={item.href}
                href={item.href}
                onClick={closeMobileMenu}
                className="block px-4 py-3 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-100 rounded-md transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </nav>
      </div>
    </>
  );
}