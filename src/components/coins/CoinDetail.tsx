"use client";

import Link from "next/link";
import { ArrowLeft, Check, Plus } from "lucide-react";
import { familyNames } from "@/data/coins";
import { useCollection } from "@/context/CollectionContext";
import { formatFaceValue, formatMintage } from "@/lib/formatting";
import type { Coin, Condition } from "@/types";

export function CoinDetail({ coin }: { coin: Coin }) {
  const { items, save, toggle } = useCollection();
  const item = items.get(coin.id);
  const owned = item?.owned ?? false;
  const update = (values: Partial<NonNullable<typeof item>>) => void save({
    coinId: coin.id,
    owned: true,
    quantity: 1,
    updatedAt: new Date().toISOString(),
    ...item,
    ...values,
  });

  return (
    <>
      <Link className="back" href="/catalogo/"><ArrowLeft /> Catálogo</Link>
      <section className="detailHero">
        <div className="bigCoin"><strong>{formatFaceValue(coin.denomination)}</strong></div>
        <p>{familyNames[coin.family]}</p>
        <h1>{coin.title}</h1>
        <span>{coin.subtitle}</span>
      </section>
      <button className={`collectionButton ${owned ? "owned" : ""}`} onClick={() => void toggle(coin.id)}>
        {owned ? <><Check /> Na minha coleção</> : <><Plus /> Adicionar à coleção</>}
      </button>
      <section className="detailSection">
        <h2>Sobre esta moeda</h2>
        <dl>
          <div><dt>Valor</dt><dd>{formatFaceValue(coin.denomination)}</dd></div>
          <div><dt>Ano</dt><dd>{coin.year}</dd></div>
          <div><dt>Material</dt><dd>{coin.material ?? "A confirmar"}</dd></div>
          <div><dt>Tiragem</dt><dd>{formatMintage(coin.mintage)}</dd></div>
          <div><dt>Peso</dt><dd>{coin.weightGrams ? `${coin.weightGrams.toLocaleString("pt-BR")} g` : "A confirmar"}</dd></div>
          <div><dt>Diâmetro</dt><dd>{coin.diameterMm ? `${coin.diameterMm.toLocaleString("pt-BR")} mm` : "A confirmar"}</dd></div>
        </dl>
        {coin.notes && <p>{coin.notes}</p>}
      </section>
      {owned && (
        <section className="detailSection editor">
          <h2>Meu exemplar</h2>
          <div className="formGrid">
            <label>Quantidade<input type="number" min="1" value={item?.quantity ?? 1} onChange={(event) => update({ quantity: Number(event.target.value) })} /></label>
            <label>Conservação<select value={item?.condition ?? ""} onChange={(event) => update({ condition: event.target.value as Condition })}><option value="">Não informado</option><option value="FC">FC — Flor de Cunho</option><option value="SOB">SOB — Soberba</option><option value="MBC">MBC — Muito Bem Conservada</option><option value="BC">BC — Bem Conservada</option><option value="REGULAR">Regular</option></select></label>
            <label>Data de aquisição<input type="date" value={item?.acquisitionDate ?? ""} onChange={(event) => update({ acquisitionDate: event.target.value })} /></label>
            <label>Preço pago (R$)<input type="number" min="0" step="0.01" value={item?.acquisitionPrice ?? ""} onChange={(event) => update({ acquisitionPrice: event.target.value ? Number(event.target.value) : null })} /></label>
          </div>
          <label>Observações pessoais<textarea value={item?.personalNotes ?? ""} onChange={(event) => update({ personalNotes: event.target.value })} placeholder="Onde encontrou, história da peça…" /></label>
        </section>
      )}
    </>
  );
}
