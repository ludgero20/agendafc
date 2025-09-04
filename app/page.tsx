"use client";

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
          <div key={jogo.id} className="bg-white p-4 rounded-xl shadow">
            <h3 className="font-semibold">{jogo.campeonato}</h3>
            <p>{jogo.time1} x {jogo.time2}</p>
            <p>⏰ {jogo.hora} | 📺 {jogo.canal}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
