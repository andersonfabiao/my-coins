import { coins } from "@/data/coins";

export function Summary({ owned }: { owned: number }) {
  const missing = coins.length - owned;
  const percent = Math.round((owned / coins.length) * 100);
  return (
    <section className="summary progressSummary glass" aria-label="Progresso da coleção">
      <div className="progressHeading">
        <div>
          <span className="summaryLabel">Seu progresso</span>
          <h2><strong>{owned}</strong> de {coins.length} moedas</h2>
        </div>
        <span className="progressBadge">{percent}%</span>
      </div>
      <div className="bar progressBar" aria-hidden="true"><i style={{ width: `${percent}%` }} /></div>
      <div className="progressStats" aria-label="Resumo da coleção">
        <span><strong>{owned}</strong> Tenho</span>
        <span><strong>{missing}</strong> Faltam</span>
        <span><strong>3</strong> Coleções</span>
      </div>
    </section>
  );
}
