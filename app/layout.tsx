import React from "react";
import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import Header from "./components/Header";
import Footer from "./components/Footer";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import InstallPrompt from './components/InstallPrompt';

  export const metadata: Metadata = {
    metadataBase: new URL('https://agendafc.com.br'),

    // Título abrangente
    title: {
      default: "Agenda FC - Onde Assistir Esportes Ao Vivo na TV",
      template: "%s | Agenda FC",
    },
    // Descrição que inclui F1
    description:
      "Sua agenda de esportes na TV. Saiba os horários e canais para assistir ao vivo jogos de Futebol, NFL, corridas de Fórmula 1 e muito mais.",
    // Palavras-chave atualizadas
    keywords:
      "futebol, nfl, fórmula 1, f1, jogos, corridas, agenda, programação, horários, canais, transmissão ao vivo",

    authors: [{ name: "Agenda FC" }],
    creator: "Agenda FC",
    publisher: "Agenda FC",
    themeColor: "#ffffff",
    manifest: "/manifest.json",

    // Open Graph (para compartilhamento em redes sociais) atualizado
    openGraph: {
      type: "website",
      locale: "pt_BR",
      url: "https://agendafc.com.br",
      siteName: "Agenda FC",
      title: "Agenda FC - Onde Assistir Esportes Ao Vivo",
      description:
        "A agenda completa para saber onde assistir Futebol, NFL e Fórmula 1 na TV e no streaming. Não perca nenhum lance!",
      images: [ { url: "/logo.jpg", width: 1200, height: 630, alt: "Agenda FC" } ],
    },

    // Twitter Cards atualizado
    twitter: {
      card: "summary_large_image",
      title: "Agenda FC - Onde Assistir Esportes Ao Vivo",
      description:
        "A agenda completa para saber onde assistir Futebol, NFL e Fórmula 1 na TV e no streaming.",
      images: ["/logo.jpg"],
      creator: "@agendafc_br",
      site: "@agendafc_br",
    },

  // Configurações de indexação
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-gray-50 flex flex-col">
        {/* Google Analytics */}
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}');
          `}
        </Script>

        {/* Google AdSense*/}
        {process.env.NEXT_PUBLIC_ADSENSE_ID && (
          <Script
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${process.env.NEXT_PUBLIC_ADSENSE_ID}`}
            crossOrigin="anonymous"
            strategy="afterInteractive"
          />
        )}

        <Header />
        <main className="flex-grow pt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </div>
        </main>
        <Footer />
        <Analytics />
        <SpeedInsights />
        <InstallPrompt />
      </body>
    </html>
  );
}