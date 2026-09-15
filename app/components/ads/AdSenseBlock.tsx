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
  const hasValidSlot = Boolean(slotId && /^\d+$/.test(slotId));

  useEffect(() => {
    // Apenas faz push manual se houver um slot numérico configurado
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

  return (
    <div
      className={`w-full my-6 flex flex-col items-center justify-center overflow-hidden rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 p-2 text-center transition-all ${className}`}
      style={{ minHeight: '250px' }}
      aria-label="Espaço de publicidade"
    >
      <span className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-slate-400">
        Publicidade
      </span>

      {clientId && hasValidSlot ? (
        <ins
          ref={adRef}
          className="adsbygoogle block w-full"
          style={{ display: 'block', minHeight: '250px' }}
          data-ad-client={clientId}
          data-ad-slot={slotId}
          data-ad-format={format}
          data-full-width-responsive={responsive ? 'true' : 'false'}
        />
      ) : (
        <div className="flex h-full min-h-[220px] w-full flex-col items-center justify-center rounded-xl bg-slate-100/40 p-4 text-xs font-medium text-slate-400">
          <span>Espaço reservado para anúncio</span>
          <span className="mt-1 text-[11px] text-slate-400/80">
            (Preenchido automaticamente pelo Google AdSense)
          </span>
        </div>
      )}
    </div>
  );
}
