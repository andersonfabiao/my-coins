export function DonutChart({ owned, missing, percent }: { owned: number; missing: number; percent: number }) {
  return (
    <section className="statsCard completionCard">
      <div className="statsDonut" style={{ "--progress": `${percent * 3.6}deg` } as React.CSSProperties}>
        <span><strong>{percent}%</strong> completo</span>
      </div>
      <div><h2>Visão geral</h2><p><strong>{owned}</strong> moedas na coleção</p><p><strong>{missing}</strong> moedas faltantes</p></div>
    </section>
  );
}
