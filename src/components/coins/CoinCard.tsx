"use client";

import Link from "next/link";
import Image from "next/image";
import { Check, ChevronRight, Plus } from "lucide-react";
import type { Coin } from "@/types";
import { familyNames } from "@/data/coins";
import { useCollection } from "@/context/CollectionContext";
import { formatFaceValue, formatMintage } from "@/lib/formatting";

export function CoinCard({ coin }: { coin: Coin }) {
  const { items, toggle } = useCollection();
  const owned = items.get(coin.id)?.owned ?? false;
  const visualSize = Math.round(44 + (((coin.diameterMm ?? 22) - 17) / 10) * 12);
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  const thumbnail = coin.commemorative ? coin.obverseImage : coin.reverseImage;
  return (
    <article className={`coinCard ${owned ? "owned" : "missingCoin"}`}>
      <button
        className="coinToggle"
        onClick={() => void toggle(coin.id)}
        aria-label={`${owned ? "Remover" : "Adicionar"} ${coin.title} ${owned ? "da" : "à"} coleção`}
        aria-pressed={owned}
      >
        <div className="coinThumb">
          {thumbnail
            ? <Image className="coinPhoto" src={`${basePath}${thumbnail}`} alt="" width={visualSize} height={visualSize} />
            : <div className="coinVisual" aria-hidden="true" style={{ width: visualSize, height: visualSize }}><strong>{formatFaceValue(coin.denomination)}</strong></div>}
          <span className="coinCheck" aria-hidden="true">
            {owned ? <Check /> : <Plus />}
          </span>
        </div>
      </button>
      <Link className="coinDetailLink" href={`/moeda/${coin.id}/`}>
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
    </article>
  );
}
