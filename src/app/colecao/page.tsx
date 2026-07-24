"use client";

import { Header } from "@/components/ui/Header";
import { Summary } from "@/components/collection/Summary";
import { CoinGroups } from "@/components/coins/CoinGroups";
import { catalog, catalogEntries, familyNames } from "@/data/coins";
import { useCollection } from "@/context/CollectionContext";

export default function Collection() {
  const { items } = useCollection();
  const owned = catalogEntries
    .filter(({ coinIssue }) => items.get(coinIssue.id)?.owned)
    .sort((a, b) => a.coinType.denomination - b.coinType.denomination || a.coinIssue.year - b.coinIssue.year);

  return (
    <>
      <Header title="Minha coleção" subtitle="As moedas que já fazem parte da sua história" />
      <Summary owned={owned.length} collections={catalog.monetarySystems.length} />
      <div className="miniStats">
        {Object.entries(familyNames).map(([key, name]) => (
          <div key={key}>
            <strong>{owned.filter(({ coinType }) => coinType.family === key).length}</strong>
            <span>{name}</span>
          </div>
        ))}
      </div>
      <div className="sectionTitle">
        <h2>{owned.length} moedas</h2>
      </div>
      <CoinGroups entries={owned} />
    </>
  );
}
