import React from "react";
import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import Header from "./components/Header";
import Footer from "./components/Footer";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import InstallPrompt from "./components/InstallPrompt";

// 🎯 CORREÇÃO DO NEXT.JS 15: O themeColor agora mora no viewport (acaba com os warnings!)
export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://agendafc.com.br"),

  title: {
    default: "Agenda FC - Onde Assistir Esportes Ao Vivo na TV",
    template: "%s | Agenda FC",
  },
  description:
    "Sua agenda de esportes na TV. Saiba os horários e canais para assistir ao vivo jogos de Futebol, NFL, corridas de Fórmula 1 e muito mais.",
  keywords:
    "futebol, nfl, fórmula 1, f1, jogos, corridas, agenda, programação, horários, canais, transmissão ao vivo, onde vai passar, classificação",

  authors: [{ name: "Agenda FC" }],
  creator: "Agenda FC",
  publisher: "Agenda FC",
  manifest: "/manifest.json",

  // Ícones oficiais mapeados
  icons: {
    icon: [
      { url: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512x512.png", sizes: "512x512", type: "image/png" },
      { url: "/icon.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }
    ],
    shortcut: "/favicon.ico",
  },

  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "https://agendafc.com.br",
    siteName: "Agenda FC",
    title: "Agenda FC - Onde Assistir Esportes Ao Vivo",
    description:
      "A agenda completa para saber onde assistir Futebol, NFL e Fórmula 1 na TV e no streaming. Não perca nenhum lance!",
    images: [
      {
        url: "/escudo.jpg",
        width: 800,
        height: 800,
        alt: "Agenda FC - Onde Assistir Esportes Ao Vivo",
        type: "image/jpeg",
      },
      {
        url: "/og-banner.jpg",
        width: 1200,
        height: 630,
        alt: "Agenda FC - Onde Assistir Esportes Ao Vivo",
        type: "image/jpeg",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Agenda FC - Onde Assistir Esportes Ao Vivo",
    description:
      "A agenda completa para saber onde assistir Futebol, NFL e Fórmula 1 na TV e no streaming.",
    images: ["/escudo.jpg"],
    creator: "@agendafc_br",
    site: "@agendafc_br",
  },

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
      <head>
        <link rel="apple-touch-startup-image" href="/splash.png" />
      </head>
      <body className="min-h-screen bg-gray-50 flex flex-col">
        {/* Google Analytics (Carrega apenas se a variável existir) */}
        {process.env.NEXT_PUBLIC_GA_ID && (
          <>
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
          </>
        )}

        {/* Google AdSense */}
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