import React from "react";
import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import Header from "./components/Header";
import Footer from "./components/Footer";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

export const metadata: Metadata = {
  metadataBase: new URL('https://agendafc.com.br'),

  // Adicionar um template para os títulos das página
  title: {
    default: "Agenda FC - Jogos de Futebol e NFL ao Vivo | Onde Assistir Hoje",
    template: "%s | Agenda FC", // Ex: "Tabela do Brasileirão | Agenda FC"
  },
  description:
    "Confira a Agenda FC: horários e canais para assistir aos principais jogos de futebol do Brasil, Europa, Champions League e NFL ao vivo.",
  keywords:
    "futebol, jogos, agenda, programação, horários, canais, transmissão, brasileirão, champions league",
  authors: [{ name: "Agenda FC" }],
  creator: "Agenda FC",
  publisher: "Agenda FC",

  // Adicionar cor do tema para navegadores mobile
  themeColor: "#ffffff",

  // Adicionar o manifest para PWA
  manifest: "/manifest.json",

  // Open Graph (Facebook, WhatsApp, LinkedIn)
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "https://agendafc.com.br",
    siteName: "Agenda FC",
    title: "Agenda FC - Jogos de Futebol e NFL ao Vivo",
    description:
      "Horários e canais dos principais jogos de futebol do Brasil, Europa, Champions League e NFL ao vivo. Não perca nenhum lance!",
    images: [
      {
        url: "/logo.jpg",
        width: 1200,
        height: 630,
        alt: "Agenda FC - Programação de Jogos",
      },
    ],
  },

  // Twitter Cards
  twitter: {
    card: "summary_large_image",
    title: "Agenda FC - Jogos de Futebol e NFL ao Vivo",
    description:
      "Agenda FC mostra onde assistir os jogos de futebol e NFL hoje e amanhã, com horários e canais atualizados.",
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

        {/* Google AdSense (se você usar) */}
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
      </body>
    </html>
  );
}