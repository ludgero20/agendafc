export default function Competicoes() {
  const competicoes = ["Brasileirão", "Copa do Brasil", "Champions League", "Premier League"];

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Competições</h2>
      <ul className="list-disc ml-6">
        {competicoes.map((c, i) => (
          <li key={i}>{c}</li>
        ))}
      </ul>
    </div>
  );
}
