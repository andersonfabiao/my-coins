import type { StatisticGroup } from "@/lib/statistics";

export function BarChart({ title, groups }: { title: string; groups: StatisticGroup[] }) {
  return (
    <section className="statsCard">
      <h2>{title}</h2>
      <div className="barChart">
        {groups.map((group) => (
          <div className="chartRow" key={group.id}>
            <div className="chartLabel"><span>{group.label}</span><strong>{group.owned}/{group.total} · {group.percent}%</strong></div>
            <div className="chartTrack" aria-label={`${group.label}: ${group.percent}% completo`}><i style={{ width: `${group.percent}%` }} /></div>
          </div>
        ))}
      </div>
    </section>
  );
}
