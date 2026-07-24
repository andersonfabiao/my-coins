"use client";

import { useState } from "react";
import { Heart, Layers3, Repeat2 } from "lucide-react";
import { Header } from "@/components/ui/Header";
import { Summary } from "@/components/collection/Summary";
import { CoinGroups } from "@/components/coins/CoinGroups";
import { catalog, catalogEntries, familyNames } from "@/data/coins";
import { useCollection } from "@/context/CollectionContext";

export default function Collection() {
  const { items } = useCollection();
  const [filter, setFilter] = useState<"all" | "favorites" | "duplicates" | "trade">("all");
  const allOwned = catalogEntries
    .filter(({ coinIssue }) => items.get(coinIssue.id)?.owned)
    .sort((a, b) => a.coinType.denomination - b.coinType.denomination || a.coinIssue.year - b.coinIssue.year);
  const owned = allOwned.filter(({ coinIssue }) => {
    const item = items.get(coinIssue.id);
    if (filter === "favorites") return item?.favorite;
    if (filter === "duplicates") return (item?.quantity ?? 0) > 1;
    if (filter === "trade") return item?.wantedForTrade;
    return true;
  });
  const favorites = allOwned.filter(({ coinIssue }) => items.get(coinIssue.id)?.favorite).length;
  const trade = allOwned.filter(({ coinIssue }) => items.get(coinIssue.id)?.wantedForTrade).length;
  const duplicates = allOwned.reduce(
    (total, { coinIssue }) => total + Math.max(0, (items.get(coinIssue.id)?.quantity ?? 0) - 1),
    0,
  );

  return (
    <>
      <Header title="Minha coleção" subtitle="As moedas que já fazem parte da sua história" />
      <Summary owned={allOwned.length} collections={catalog.monetarySystems.length} />
      <div className="advancedStats" aria-label="Resumo avançado">
        <span><Heart /> <strong>{favorites}</strong> favoritas</span>
        <span><Layers3 /> <strong>{duplicates}</strong> duplicatas</span>
        <span><Repeat2 /> <strong>{trade}</strong> para troca</span>
      </div>
      <div className="chips collectionFilters" aria-label="Filtrar coleção">
        {([
          ["all", "Todas"],
          ["favorites", "Favoritas"],
          ["duplicates", "Duplicatas"],
          ["trade", "Para troca"],
        ] as const).map(([value, label]) => (
          <button
            key={value}
            className={filter === value ? "selected" : ""}
            onClick={() => setFilter(value)}
          >
            {label}
          </button>
        ))}
      </div>
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
