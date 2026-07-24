import type { QuantityGroup } from "@/lib/statistics";

export function QuantityChart({ groups }: { groups: QuantityGroup[] }) {
  return (
    <section className="statsCard">
      <h2>Por quantidade</h2>
      <div className="barChart">
        {groups.map((group) => (
          <div className="chartRow" key={group.id}>
            <div className="chartLabel"><span>{group.label}</span><strong>{group.count} moedas · {group.percent}%</strong></div>
            <div className="chartTrack" aria-label={`${group.label}: ${group.count} moedas`}><i style={{ width: `${group.percent}%` }} /></div>
          </div>
        ))}
      </div>
    </section>
  );
}
