export interface ProgressListItem {
  id: string;
  label: string;
  value: string;
  percent: number;
  accessibleLabel: string;
}

export function ProgressList({ items }: { items: ProgressListItem[] }) {
  return (
    <div className="barChart">
      {items.map((item) => (
        <div className="chartRow" key={item.id}>
          <div className="chartLabel"><span>{item.label}</span><strong>{item.value}</strong></div>
          <div className="chartTrack" role="progressbar" aria-label={item.accessibleLabel} aria-valuemin={0} aria-valuemax={100} aria-valuenow={item.percent}>
            <i style={{ width: `${item.percent}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}
