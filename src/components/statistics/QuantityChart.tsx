import type { QuantityGroup } from "@/lib/statistics";
import { ProgressList } from "@/components/statistics/ProgressList";

export function QuantityChart({ groups }: { groups: QuantityGroup[] }) {
  return (
    <section className="statsCard">
      <h2>Por quantidade</h2>
      <ProgressList items={groups.map((group) => ({
        id: group.id,
        label: group.label,
        value: `${group.count} moedas · ${group.percent}%`,
        percent: group.percent,
        accessibleLabel: `${group.label}: ${group.count} moedas`,
      }))} />
    </section>
  );
}
