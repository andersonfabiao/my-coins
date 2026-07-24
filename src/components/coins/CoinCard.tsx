"use client";

import Link from "next/link";
import Image from "next/image";
import { Check, ChevronRight, Plus } from "lucide-react";
import type { CatalogEntry } from "@/types";
import { familyNames } from "@/data/coins";
import { useCollection } from "@/context/CollectionContext";
import { formatMintage } from "@/lib/formatting";

export function CoinCard({ entry }: { entry: CatalogEntry }) {
  const { coinIssue, coinType } = entry;
  const { items, toggle } = useCollection();
  const collectionItem = items.get(coinIssue.id);
  const owned = collectionItem?.owned ?? false;
  const quantity = String(Math.max(1, collectionItem?.quantity ?? 1)).padStart(2, "0");
  const visualSize = Math.round(44 + (((coinIssue.diameterMm ?? 22) - 17) / 10) * 12);
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  const thumbnail = coinType.commemorative
    ? coinType.obverseImage
    : coinType.reverseImage ?? coinType.obverseImage;
  return (
    <article className={`coinCard ${owned ? "owned" : "missingCoin"}`}>
      <button
        className="coinToggle"
        onClick={() => void toggle(coinIssue.id)}
        aria-label={`${owned ? "Remover" : "Adicionar"} ${coinIssue.title} ${owned ? "da" : "à"} coleção`}
        aria-pressed={owned}
      >
        <div className="coinThumb">
          {thumbnail
            ? <Image className="coinPhoto" src={`${basePath}${thumbnail}`} alt="" width={visualSize} height={visualSize} />
            : <div className="coinVisual" aria-hidden="true" style={{ width: visualSize, height: visualSize }}><strong>{coinType.denominationLabel}</strong></div>}
          <span className="coinCheck" aria-hidden="true">
            {owned ? <Check /> : <Plus />}
          </span>
        </div>
      </button>
      <Link className="coinDetailLink" href={`/moeda/${coinIssue.id}/`}>
        <div className="coinInfo">
          <div className="coinMeta">
            <span>{familyNames[coinType.family] ?? coinType.family}</span>
            {coinType.commemorative && <b>Comemorativa</b>}
          </div>
          <h3>{coinIssue.title}</h3>
          <p>{coinIssue.subtitle ?? `${coinIssue.year} · Tiragem ${formatMintage(coinIssue.mintage)}`}</p>
          <span className={`statusBadge ${owned ? "have" : "missing"}`}>
            {owned ? `Tenho: ${quantity}` : "Falta"}
          </span>
        </div>
        <ChevronRight className="chevron" aria-hidden="true" />
      </Link>
    </article>
  );
}
