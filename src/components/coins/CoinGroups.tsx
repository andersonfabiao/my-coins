"use client";

import type { Coin } from "@/types";
import { CoinList } from "@/components/coins/CoinList";
import { formatFaceValue } from "@/lib/formatting";
import { useCollection } from "@/context/CollectionContext";

const denominationOrder: Coin["denomination"][] = [0.01, 0.05, 0.1, 0.25, 0.5, 1];

export function CoinGroups({ coins }: { coins: Coin[] }) {
  const { items } = useCollection();
  const groups = denominationOrder
    .map((denomination) => ({
      denomination,
      coins: coins.filter((coin) => coin.denomination === denomination),
    }))
    .filter((group) => group.coins.length > 0);

  if (!groups.length) {
    return <div className="empty"><div>◎</div><h2>Nenhuma moeda encontrada</h2></div>;
  }

  return (
    <div className="denominationGroups">
      {groups.map((group, index) => {
        const owned = group.coins.filter((coin) => items.get(coin.id)?.owned).length;
        const label = group.coins[0].denominationLabel;
        return (
          <details className="denominationGroup" key={group.denomination} open={index === 0}>
            <summary>
              <span className="denominationToken">{formatFaceValue(group.denomination)}</span>
              <span className="denominationSummary">
                <strong>{label}</strong>
                <small>{owned}/{group.coins.length} na coleção · toque para ver os anos</small>
              </span>
              <span className="disclosure" aria-hidden="true">⌄</span>
            </summary>
            <div className="denominationBody">
              <CoinList coins={group.coins} />
            </div>
          </details>
        );
      })}
    </div>
  );
}
