"use client";

import Link from "next/link";
import { Check, ChevronRight, Plus } from "lucide-react";
import type { Coin } from "@/types";
import { familyNames } from "@/data/coins";
import { useCollection } from "@/context/CollectionContext";

export function CoinCard({ coin }: { coin: Coin }) {
  const { items, toggle } = useCollection();
  const owned = items.get(coin.id)?.owned ?? false;
  const displayValue =
    coin.denomination === 1 ? "1" : String(Math.round(coin.denomination * 100));

  return (
    <article className={`coinCard ${owned ? "owned" : "missingCoin"}`}>
      <Link href={`/moeda/${coin.id}/`}>
        <div className="coinThumb">
          <div className="coinVisual" aria-hidden="true">
            <span>R$</span>
            <strong>{displayValue}</strong>
          </div>
        </div>
        <div className="coinInfo">
          <div className="coinMeta">
            <span>{familyNames[coin.family]}</span>
            {coin.commemorative && <b>Comemorativa</b>}
          </div>
          <h3>{coin.title}</h3>
          <p>{coin.subtitle ?? `${coin.denominationLabel} · ${coin.year}`}</p>
          <span className={`statusBadge ${owned ? "have" : "missing"}`}>
            {owned ? "Tenho" : "Falta"}
          </span>
        </div>
        <ChevronRight className="chevron" aria-hidden="true" />
      </Link>
      <button
        className="coinCheck"
        onClick={() => void toggle(coin.id)}
        aria-label={`${owned ? "Remover" : "Adicionar"} ${coin.title} ${owned ? "da" : "à"} coleção`}
        aria-pressed={owned}
      >
        {owned ? <Check /> : <Plus />}
      </button>
    </article>
  );
}
