"use client";

import JogoCard from "./components/JogoCard";

export default function Home() {
  const jogos = [
    { id: 1, campeonato: "Brasileirão Série A", time1: "Flamengo", time2: "Palmeiras", hora: "20:00", canal: "Globo / Premiere" },
    { id: 2, campeonato: "Champions League", time1: "Real Madrid", time2: "Manchester City", hora: "16:00", canal: "HBO Max" },
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Jogos de Hoje</h2>
      <div className="grid gap-4">
        {jogos.map((jogo) => (
          <JogoCard
            key={jogo.id}
            campeonato={jogo.campeonato}
            time1={jogo.time1}
            time2={jogo.time2}
            hora={jogo.hora}
            canal={jogo.canal}
          />
        ))}
      </div>
    </div>
  );
}
