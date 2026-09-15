// app/components/ads/AdSenseBlock.tsx
'use client';

import React, { useEffect, useRef } from 'react';

declare global {
  interface Window {
    adsbygoogle?: any[];
  }
}

type Props = {
  slotId?: string;
  className?: string;
  format?: 'auto' | 'fluid' | 'rectangle';
  responsive?: boolean;
};

export default function AdSenseBlock({
  slotId,
  className = '',
  format = 'auto',
  responsive = true,
}: Props) {
  const adRef = useRef<HTMLModElement | null>(null);
  const adPushed = useRef(false);

  const clientId = process.env.NEXT_PUBLIC_ADSENSE_ID;
  const activeSlotId = slotId || process.env.NEXT_PUBLIC_ADSENSE_DEFAULT_SLOT_ID;
  const hasValidSlot = Boolean(activeSlotId && /^\d+$/.test(activeSlotId));

  useEffect(() => {
    // Apenas faz push manual se houver cliente e slot numérico configurado
    if (!clientId || !hasValidSlot || adPushed.current) return;

    try {
      if (typeof window !== 'undefined') {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        adPushed.current = true;
      }
    } catch (err) {
      console.warn('Erro ao carregar bloco AdSense:', err);
    }
  }, [clientId, hasValidSlot]);

  // Se não houver cliente ou slot numérico configurado, não renderiza caixas vazias
  if (!clientId || !hasValidSlot) {
    return null;
  }

  return (
    <div
      className={`w-full my-6 flex flex-col items-center justify-center overflow-hidden rounded-2xl border border-slate-100 bg-slate-50/50 p-2 text-center transition-all ${className}`}
      style={{ minHeight: '260px' }}
      aria-label="Espaço de publicidade"
    >
      <span className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-slate-400">
        Publicidade
      </span>

      <ins
        ref={adRef}
        className="adsbygoogle block w-full"
        style={{ display: 'block', minHeight: '250px' }}
        data-ad-client={clientId}
        data-ad-slot={activeSlotId}
        data-ad-format={format}
        data-full-width-responsive={responsive ? 'true' : 'false'}
      />
    </div>
  );
}
