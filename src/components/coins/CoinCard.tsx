"use client";

import Link from "next/link";
import { Check, ChevronRight, Plus } from "lucide-react";
import type { Coin } from "@/types";
import { familyNames } from "@/data/coins";
import { useCollection } from "@/context/CollectionContext";
import { formatFaceValue, formatMintage } from "@/lib/formatting";

export function CoinCard({ coin }: { coin: Coin }) {
  const { items, toggle } = useCollection();
  const owned = items.get(coin.id)?.owned ?? false;
  const visualSize = Math.round(44 + (((coin.diameterMm ?? 22) - 17) / 10) * 12);
  return (
    <article className={`coinCard ${owned ? "owned" : "missingCoin"}`}>
      <Link href={`/moeda/${coin.id}/`}>
        <div className="coinThumb">
          <div className="coinVisual" aria-hidden="true" style={{ width: visualSize, height: visualSize }}>
            <strong>{formatFaceValue(coin.denomination)}</strong>
          </div>
        </div>
        <div className="coinInfo">
          <div className="coinMeta">
            <span>{familyNames[coin.family]}</span>
            {coin.commemorative && <b>Comemorativa</b>}
          </div>
          <h3>{coin.title}</h3>
          <p>{coin.subtitle ?? `${coin.year} · Tiragem ${formatMintage(coin.mintage)}`}</p>
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
