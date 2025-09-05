"use client";

import React from 'react';
import { HeartIcon } from '@heroicons/react/24/solid';

export default function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          {/* Copyright */}
          <div className="flex items-center text-sm text-gray-600">
            <span>© 2024 FutbolApp</span>
            <span className="mx-2">•</span>
            <span className="flex items-center">
              Feito com <HeartIcon className="w-4 h-4 mx-1 text-red-500" /> para os amantes do futebol
            </span>
          </div>

          {/* Links */}
          <div className="flex space-x-6 mt-4 md:mt-0">
            <a href="/sobre" className="text-sm text-gray-600 hover:text-blue-600 transition-colors">
              Sobre
            </a>
            <a href="/contato" className="text-sm text-gray-600 hover:text-blue-600 transition-colors">
              Contato
            </a>
            <a href="/privacidade" className="text-sm text-gray-600 hover:text-blue-600 transition-colors">
              Privacidade
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}