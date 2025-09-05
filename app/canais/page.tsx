"use client";

import React from 'react';

type Canal = {
  id: number;
  nome: string;
  tipo: 'TV Aberta' | 'TV Fechada' | 'Streaming' | 'YouTube';
  preco: string;
  descricao: string;
  competicoes: string[];
  disponibilidade: string;
};

export default function Canais() {
  const canais: Canal[] = [
    // TV Aberta
    {
      id: 1,
      nome: "Globo",
      tipo: "TV Aberta",
      preco: "Gratuito",
      descricao: "Principal emissora brasileira, transmite jogos do Brasileirão e Copa do Mundo",
      competicoes: ["Brasileirão", "Copa do Mundo", "Copa América"],
      disponibilidade: "Nacional"
    },
    {
      id: 2,
      nome: "SBT",
      tipo: "TV Aberta", 
      preco: "Gratuito",
      descricao: "Transmite jogos da Copa Sul-Americana e algumas partidas especiais",
      competicoes: ["Copa Sul-Americana", "Libertadores (finais)"],
      disponibilidade: "Nacional"
    },
    {
      id: 3,
      nome: "Band",
      tipo: "TV Aberta",
      preco: "Gratuito", 
      descricao: "Transmite Copa do Brasil e jogos da seleção brasileira",
      competicoes: ["Copa do Brasil", "Seleção Brasileira"],
      disponibilidade: "Nacional"
    },
    
    // TV Fechada
    {
      id: 4,
      nome: "SporTV",
      tipo: "TV Fechada",
      preco: "R$ 30-60/mês",
      descricao: "Canal especializado em esportes da Globo, com ampla cobertura do futebol",
      competicoes: ["Brasileirão", "Copa do Brasil", "Estaduais", "Futebol Internacional"],
      disponibilidade: "TV por assinatura"
    },
    {
      id: 5,
      nome: "Premiere",
      tipo: "TV Fechada",
      preco: "R$ 49,90/mês",
      descricao: "Canal pay-per-view do Brasileirão, todos os jogos ao vivo",
      competicoes: ["Brasileirão Série A", "Brasileirão Série B"],
      disponibilidade: "TV por assinatura + Globoplay"
    },
    {
      id: 6,
      nome: "ESPN Brasil",
      tipo: "TV Fechada", 
      preco: "R$ 25-50/mês",
      descricao: "Cobertura completa do futebol internacional e competições sul-americanas",
      competicoes: ["Libertadores", "Sul-Americana", "Liga dos Campeões", "Premier League"],
      disponibilidade: "TV por assinatura"
    },
    {
      id: 7,
      nome: "Fox Sports",
      tipo: "TV Fechada",
      preco: "R$ 20-40/mês", 
      descricao: "Transmite campeonatos internacionais e Copa do Brasil",
      competicoes: ["Copa do Brasil", "Campeonatos Europeus"],
      disponibilidade: "TV por assinatura"
    },
    
    // Streaming
    {
      id: 8,
      nome: "Amazon Prime Video",
      tipo: "Streaming",
      preco: "R$ 14,90/mês",
      descricao: "Transmite a Copa do Brasil e jogos da Champions League",
      competicoes: ["Copa do Brasil", "Champions League (algumas partidas)"],
      disponibilidade: "Streaming (Brasil)"
    },
    {
      id: 9,
      nome: "HBO Max",
      tipo: "Streaming", 
      preco: "R$ 29,90/mês",
      descricao: "Plataforma com direitos da Champions League e Europa League",
      competicoes: ["Champions League", "Europa League", "Conference League"],
      disponibilidade: "Streaming"
    },
    {
      id: 10,
      nome: "Star+",
      tipo: "Streaming",
      preco: "R$ 32,90/mês",
      descricao: "Plataforma da Disney com conteúdo da ESPN, futebol internacional",
      competicoes: ["Libertadores", "Sul-Americana", "Premier League", "La Liga"],
      disponibilidade: "Streaming"
    },
    {
      id: 11,
      nome: "Paramount+",
      tipo: "Streaming",
      preco: "R$ 19,90/mês",
      descricao: "Transmite jogos da Champions League e campeonatos internacionais",
      competicoes: ["Champions League", "Europa League", "Serie A"],
      disponibilidade: "Streaming"
    },
    {
      id: 12,
      nome: "Apple TV+",
      tipo: "Streaming",
      preco: "R$ 21,90/mês", 
      descricao: "Transmite a MLS e alguns jogos especiais",
      competicoes: ["MLS", "Liga dos Campeões da CONCACAF"],
      disponibilidade: "Streaming"
    },
    {
      id: 13,
      nome: "DAZN",
      tipo: "Streaming",
      preco: "R$ 29,90/mês",
      descricao: "Plataforma especializada em esportes, disponível em alguns países",
      competicoes: ["Serie A", "Ligue 1", "Boxing"],
      disponibilidade: "Streaming (internacional)"
    },
    
    // YouTube e Gratuitos
    {
      id: 14,
      nome: "CazéTV",
      tipo: "YouTube",
      preco: "Gratuito",
      descricao: "Canal do YouTube que transmite jogos gratuitos e tem grande audiência",
      competicoes: ["Jogos selecionados", "Copas", "Amistosos"],
      disponibilidade: "YouTube/Twitch"
    },
    {
      id: 15,
      nome: "FIFA+",
      tipo: "Streaming",
      preco: "Gratuito",
      descricao: "Plataforma oficial da FIFA com jogos e conteúdo exclusivo",
      competicoes: ["Competições FIFA", "Documentários", "Clássicos"],
      disponibilidade: "Streaming gratuito"
    },
    {
      id: 16,
      nome: "Globoplay",
      tipo: "Streaming",
      preco: "R$ 24,90/mês",
      descricao: "Plataforma da Globo com jogos ao vivo e replay",
      competicoes: ["Brasileirão", "Copa do Mundo", "Premiere"],
      disponibilidade: "Streaming"
    },
    {
      id: 17,
      nome: "Twitch",
      tipo: "Streaming",
      preco: "Gratuito",
      descricao: "Plataforma onde diversos streamers transmitem jogos",
      competicoes: ["Jogos variados", "Watch parties", "Reações"],
      disponibilidade: "Streaming gratuito"
    }
  ];

  const tiposOrdenados = ['TV Aberta', 'TV Fechada', 'Streaming', 'YouTube'] as const;
  
  const canaisPorTipo = tiposOrdenados.reduce((acc, tipo) => {
    acc[tipo] = canais.filter(canal => canal.tipo === tipo);
    return acc;
  }, {} as Record<string, Canal[]>);

  const getIcon = (tipo: string) => {
    switch (tipo) {
      case 'TV Aberta': return '📺';
      case 'TV Fechada': return '📡';
      case 'Streaming': return '🎬';
      case 'YouTube': return '📱';
      default: return '📺';
    }
  };

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'TV Aberta': return 'bg-green-100 text-green-800';
      case 'TV Fechada': return 'bg-blue-100 text-blue-800';
      case 'Streaming': return 'bg-purple-100 text-purple-800';
      case 'YouTube': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPrecoColor = (preco: string) => {
    if (preco === 'Gratuito') return 'bg-green-100 text-green-800';
    return 'bg-yellow-100 text-yellow-800';
  };

  return (
    <div className="space-y-8">
      <div className="text-center py-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          📺 Canais e Streaming
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Descubra onde assistir seus jogos favoritos. Encontre os melhores canais e plataformas de streaming para não perder nenhuma partida.
        </p>
      </div>
      
      <div className="space-y-10">
        {tiposOrdenados.map((tipo) => (
          canaisPorTipo[tipo].length > 0 && (
            <div key={tipo} className="">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                <span className="mr-3">{getIcon(tipo)}</span>
                {tipo}
              </h2>
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {canaisPorTipo[tipo].map((canal) => (
                  <div key={canal.id} className="bg-gray-100 hover:bg-gray-200 p-6 rounded-xl transition-all duration-200 border border-gray-200">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="font-bold text-xl text-gray-800">{canal.nome}</h3>
                      <div className="flex flex-col gap-1">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTipoColor(canal.tipo)}`}>
                          {canal.tipo}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPrecoColor(canal.preco)}`}>
                          {canal.preco}
                        </span>
                      </div>
                    </div>
                    
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">{canal.descricao}</p>
                    
                    <div className="mb-3">
                      <p className="text-xs font-semibold text-gray-700 mb-1">Principais Competições:</p>
                      <div className="flex flex-wrap gap-1">
                        {canal.competicoes.slice(0, 3).map((comp, index) => (
                          <span key={index} className="bg-white text-gray-700 px-2 py-1 rounded text-xs">
                            {comp}
                          </span>
                        ))}
                        {canal.competicoes.length > 3 && (
                          <span className="text-gray-500 text-xs">+{canal.competicoes.length - 3}</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center text-sm text-gray-500">
                      <span className="mr-2">📍</span>
                      <span>{canal.disponibilidade}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        ))}
      </div>
      
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mt-8">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">💡 Dica Importante</h3>
        <p className="text-blue-800 text-sm">
          Os preços e disponibilidade podem variar. Sempre verifique as condições atuais diretamente com o provedor. 
          Em breve, teremos links diretos para assinaturas com ofertas especiais.
        </p>
      </div>
    </div>
  );
}