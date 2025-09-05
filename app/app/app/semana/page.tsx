"use client";

import JogoCard from "../components/JogoCard";

export default function JogosDaSemana() {
  const jogosSemana = [
    { id: 1, campeonato: "Brasileirão Série A", time1: "São Paulo", time2: "Corinthians", hora: "18:00", canal: "Globo" },
    { id: 2, campeonato: "Champions League", time1: "PSG", time2: "Bayern", hora: "17:00", canal: "TNT Sports" },
    { id: 3, campeonato: "Copa do Brasil", time1: "Grêmio", time2: "Internacional", hora: "21:30", canal: "Premiere" },
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Jogos da Semana</h2>
      <div className="grid gap-4">
        {jogosSemana.map((jogo) => (
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
