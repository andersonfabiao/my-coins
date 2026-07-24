"use client";

import type { CatalogEntry } from "@/types";
import Image from "next/image";
import { CoinList } from "@/components/coins/CoinList";
import { useCollection } from "@/context/CollectionContext";

export function CoinGroups({ entries }: { entries: CatalogEntry[] }) {
  const { items } = useCollection();
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  const groups = [...new Set(entries.map((entry) => entry.coinType.denomination))]
    .sort((a, b) => a - b)
    .map((denomination) => ({
      denomination,
      entries: entries.filter((entry) => entry.coinType.denomination === denomination),
    }))
    .filter((group) => group.entries.length > 0);

  if (!groups.length) {
    return <div className="empty"><div>◎</div><h2>Nenhuma moeda encontrada</h2></div>;
  }

  return (
    <div className="denominationGroups">
      {groups.map((group) => {
        const owned = group.entries.filter((entry) => items.get(entry.coinIssue.id)?.owned).length;
        const label = group.entries[0].coinType.denominationLabel;
        const diameter = Math.max(...group.entries.map((entry) => entry.coinIssue.diameterMm ?? 22));
        const tokenSize = Math.round(44 + ((diameter - 17) / 10) * 14);
        const representative = group.entries[0];
        const thumbnail = representative.coinType.commemorative
          ? representative.coinType.obverseImage
          : representative.coinType.reverseImage ?? representative.coinType.obverseImage;
        return (
          <details className="denominationGroup" key={group.denomination}>
            <summary>
              {thumbnail
                ? <Image className="denominationPhoto" src={`${basePath}${thumbnail}`} alt="" width={tokenSize} height={tokenSize} />
                : <span className="denominationToken" style={{ width: tokenSize, height: tokenSize }}>{label}</span>}
              <span className="denominationSummary">
                <strong>{label}</strong>
                <small>{owned}/{group.entries.length} na coleção</small>
              </span>
              <span className="disclosure" aria-hidden="true">⌄</span>
            </summary>
            <div className="denominationBody">
              <CoinList entries={group.entries} />
            </div>
          </details>
        );
      })}
    </div>
  );
}
