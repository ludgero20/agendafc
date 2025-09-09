import React from "react";
import type { Metadata } from "next";
import "./globals.css";
import Header from "./components/Header";
import Footer from "./components/Footer";
import { Analytics } from "@vercel/analytics/react";

export const metadata: Metadata = {
  metadataBase: new URL('https://agendafc.vercel.app'),

  title: "Agenda FC - Programação de Jogos",
  description:
    "Acompanhe a programação completa dos jogos de futebol com horários e canais de transmissão. Jogos de hoje, agenda da semana e muito mais!",
  keywords:
    "futebol, jogos, agenda, programação, horários, canais, transmissão, brasileirão, champions league",
  authors: [{ name: "Agenda FC" }],
  creator: "Agenda FC",
  publisher: "Agenda FC",

  // Open Graph (Facebook, WhatsApp, LinkedIn)
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "/",
    siteName: "Agenda FC",
    title: "Agenda FC - Programação Completa dos Jogos de Futebol",
    description:
      "Nunca mais perca um jogo! Veja horários, canais e a programação completa dos principais campeonatos de futebol.",
    // images serão adicionadas quando você criar as imagens
  },

  // Twitter Cards - configuração básica (sem imagens ainda)
  twitter: {
    card: "summary",
    title: "Agenda FC - Programação dos Jogos",
    description:
      "Programação completa dos jogos de futebol com horários e canais!",
    // site e creator serão adicionados quando você criar o Twitter
    // images serão adicionadas quando você criar as imagens
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

  // Verificação será adicionada quando você configurar o Search Console
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <main className="flex-grow pt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </div>
        </main>
        <Footer />
        <Analytics />
      </body>
    </html>
  );
}