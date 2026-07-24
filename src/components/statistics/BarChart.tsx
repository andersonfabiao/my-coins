import type { StatisticGroup } from "@/lib/statistics";
import { ProgressList } from "@/components/statistics/ProgressList";

export function BarChart({ title, groups }: { title: string; groups: StatisticGroup[] }) {
  return (
    <section className="statsCard">
      <h2>{title}</h2>
      <ProgressList items={groups.map((group) => ({
        id: group.id,
        label: group.label,
        value: `${group.owned}/${group.total} · ${group.percent}%`,
        percent: group.percent,
        accessibleLabel: `${group.label}: ${group.percent}% completo`,
      }))} />
    </section>
  );
}
