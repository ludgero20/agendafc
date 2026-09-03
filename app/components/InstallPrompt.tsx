'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { XMarkIcon, ArrowDownTrayIcon } from '@heroicons/react/24/solid';

const InstallPrompt = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    try {
      // 1. Verifica se já foi dispensado pelo usuário
      const dismissed = localStorage.getItem('installPromptDismissed');

      // 2. 🎯 CORREÇÃO CRÍTICA: Se o usuário JÁ está usando o app instalado, não mostra o banner!
      const isStandalone = 
        window.matchMedia('(display-mode: standalone)').matches || 
        (navigator as any).standalone || 
        document.referrer.includes('android-app://');

      if (isStandalone) return;

      // 3. Detecta se é dispositivo móvel
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

      if (!dismissed && isMobile) {
        // Aparece suavemente após 3 segundos
        const timer = setTimeout(() => {
          setIsVisible(true);
        }, 3000);

        return () => clearTimeout(timer);
      }
    } catch {
      // Evita travamentos em navegadores com restrições rígidas de privacidade
    }
  }, []);

  const handleDismiss = () => {
    try {
      localStorage.setItem('installPromptDismissed', 'true');
    } catch {}
    setIsVisible(false);
  };

  if (!isVisible) {
    return null;
  }

  return (
    // 🎯 POSICIONAMENTO RESPONSIVO: Perfeito no mobile e elegante no desktop
    <div 
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-sm bg-white rounded-2xl shadow-xl p-4 border border-slate-200 z-50 animate-fade-in-up"
      role="alert"
    >
      <div className="flex items-start">
        <div className="flex-shrink-0 p-2 bg-blue-50 rounded-xl">
          <ArrowDownTrayIcon className="h-6 w-6 text-blue-600" />
        </div>
        <div className="ml-3 flex-1">
          <p className="text-sm font-bold text-slate-900">
            Acesso Rápido ao Agenda FC!
          </p>
          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
            Instale nosso app na sua tela inicial para conferir as transmissões com um único toque.
          </p>
          <div className="mt-2.5">
            <Link 
              href="/instalar" 
              onClick={handleDismiss}
              className="inline-flex items-center text-xs font-extrabold text-blue-600 hover:text-blue-700 hover:underline"
            >
              Saiba como instalar →
            </Link>
          </div>
        </div>
        <div className="ml-2 flex-shrink-0">
          <button 
            onClick={handleDismiss} 
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors focus:outline-hidden"
            aria-label="Fechar aviso de instalação"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default InstallPrompt;