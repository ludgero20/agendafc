"use client";

import React from 'react';
import Link from 'next/link';
import { 
  HomeIcon, 
  CalendarDaysIcon, 
  TrophyIcon, 
  InformationCircleIcon 
} from '@heroicons/react/24/outline';

export default function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 bg-white shadow-md z-50 border-b border-gray-200">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/" className="text-2xl font-bold text-blue-600">
              ⚽ FutbolApp
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              <Link 
                href="/" 
                className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-100 transition-colors"
              >
                <HomeIcon className="w-4 h-4 mr-2" />
                Início
              </Link>
              <Link 
                href="/semana" 
                className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-100 transition-colors"
              >
                <CalendarDaysIcon className="w-4 h-4 mr-2" />
                Semana
              </Link>
              <Link 
                href="/competicoes" 
                className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-100 transition-colors"
              >
                <TrophyIcon className="w-4 h-4 mr-2" />
                Competições
              </Link>
              <Link 
                href="/sobre" 
                className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-100 transition-colors"
              >
                <InformationCircleIcon className="w-4 h-4 mr-2" />
                Sobre
              </Link>
            </div>
          </div>

          {/* Mobile menu button - for future implementation */}
          <div className="md:hidden">
            <button className="text-gray-700 hover:text-blue-600">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </nav>
    </header>
  );
}