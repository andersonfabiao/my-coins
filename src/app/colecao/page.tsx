"use client";

import { Header } from "@/components/ui/Header";
import { Summary } from "@/components/collection/Summary";
import { CoinGroups } from "@/components/coins/CoinGroups";
import { coins, familyNames } from "@/data/coins";
import { useCollection } from "@/context/CollectionContext";

export default function Collection() {
  const { items } = useCollection();
  const owned = coins
    .filter((coin) => items.get(coin.id)?.owned)
    .sort((a, b) => a.denomination - b.denomination || a.year - b.year);

  return (
    <>
      <Header title="Minha coleção" subtitle="As moedas que já fazem parte da sua história" />
      <Summary owned={owned.length} />
      <div className="miniStats">
        {Object.entries(familyNames).map(([key, name]) => (
          <div key={key}>
            <strong>{owned.filter((coin) => coin.family === key).length}</strong>
            <span>{name}</span>
          </div>
        ))}
      </div>
      <div className="sectionTitle">
        <h2>{owned.length} moedas</h2>
      </div>
      <CoinGroups coins={owned} />
    </>
  );
}
