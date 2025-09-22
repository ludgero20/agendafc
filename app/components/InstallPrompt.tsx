'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { XMarkIcon, ArrowDownTrayIcon } from '@heroicons/react/24/solid';

const InstallPrompt = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Verifica se já foi dispensado pelo usuário
    const dismissed = localStorage.getItem('installPromptDismissed');

    // Detecta se é um dispositivo móvel (simplificado)
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    if (!dismissed && isMobile) {
      // Atraso para não mostrar o banner imediatamente
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 3000); // Aparece após 3 segundos

      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    // Marca como dispensado para não mostrar novamente
    localStorage.setItem('installPromptDismissed', 'true');
    setIsVisible(false);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 max-w-sm bg-white rounded-lg shadow-lg p-4 border z-50 animate-fade-in-up">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <ArrowDownTrayIcon className="h-6 w-6 text-blue-500" />
        </div>
        <div className="ml-3">
          <p className="text-sm font-semibold text-gray-900">
            Acesso Rápido ao Agenda FC!
          </p>
          <p className="text-sm text-gray-600 mt-1">
            Instale nosso site na sua tela inicial para acessar a agenda com um toque.
          </p>
          <div className="mt-2">
            <Link href="/instalar" className="text-sm font-bold text-blue-600 hover:underline">
              Saiba como
            </Link>
          </div>
        </div>
        <div className="ml-3 flex-shrink-0">
          <button onClick={handleDismiss} className="p-1 rounded-full hover:bg-gray-100 focus:outline-none">
            <XMarkIcon className="h-5 w-5 text-gray-400" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default InstallPrompt;