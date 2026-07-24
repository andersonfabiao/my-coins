"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Check, Heart, MapPin, Plus, Repeat2 } from "lucide-react";
import { familyNames } from "@/data/coins";
import { useCollection } from "@/context/CollectionContext";
import { formatMintage } from "@/lib/formatting";
import type { CatalogEntry, Condition } from "@/types";

export function CoinDetail({ entry }: { entry: CatalogEntry }) {
  const { coinIssue, coinType } = entry;
  const { items, save, toggle } = useCollection();
  const item = items.get(coinIssue.id);
  const owned = item?.owned ?? false;
  const duplicates = Math.max(0, (item?.quantity ?? 0) - 1);
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  const update = (values: Partial<NonNullable<typeof item>>) => void save({
    coinId: coinIssue.id,
    owned: true,
    quantity: 1,
    updatedAt: new Date().toISOString(),
    ...item,
    ...values,
  });

  return (
    <>
      <Link className="back" href={`/catalogo/?pais=brasil&padrao=${entry.monetarySystem.id}&familia=${coinType.family}&tipo=${coinType.id}`}><ArrowLeft /> Emissões</Link>
      <section className="detailHero">
        {coinType.obverseImage && coinType.reverseImage && coinType.obverseImage !== coinType.reverseImage ? (
          <div className="coinFaces">
            <figure><Image src={`${basePath}${coinType.obverseImage}`} alt={`Anverso de ${coinIssue.title}`} width={320} height={320} /><figcaption>Anverso</figcaption></figure>
            <figure><Image src={`${basePath}${coinType.reverseImage}`} alt={`Reverso de ${coinIssue.title}`} width={320} height={320} /><figcaption>Reverso</figcaption></figure>
          </div>
        ) : coinType.obverseImage || coinType.reverseImage ? (
          <div className="coinFaces">
            <figure><Image src={`${basePath}${coinType.obverseImage ?? coinType.reverseImage}`} alt={`Anverso e reverso de ${coinIssue.title}`} width={640} height={320} /><figcaption>Anverso e reverso</figcaption></figure>
          </div>
        ) : <div className="bigCoin"><strong>{coinType.denominationLabel}</strong></div>}
        <p>{familyNames[coinType.family] ?? coinType.family}</p>
        <h1>{coinIssue.title}</h1>
        <span>{coinIssue.subtitle}</span>
      </section>
      <button className={`collectionButton ${owned ? "owned" : ""}`} onClick={() => void toggle(coinIssue.id)}>
        {owned ? <><Check /> Na minha coleção</> : <><Plus /> Adicionar à coleção</>}
      </button>
      {owned && (
        <div className="collectionQuickActions" aria-label="Marcadores da coleção">
          <button
            className={item?.favorite ? "active" : ""}
            aria-pressed={item?.favorite ?? false}
            onClick={() => update({ favorite: !item?.favorite })}
          >
            <Heart /> {item?.favorite ? "Favorita" : "Favoritar"}
          </button>
          <button
            className={item?.wantedForTrade ? "active" : ""}
            aria-pressed={item?.wantedForTrade ?? false}
            onClick={() => update({ wantedForTrade: !item?.wantedForTrade })}
          >
            <Repeat2 /> {item?.wantedForTrade ? "Disponível para troca" : "Marcar para troca"}
          </button>
        </div>
      )}
      <section className="detailSection">
        <h2>Sobre esta moeda</h2>
        <dl>
          <div><dt>Valor</dt><dd>{coinType.denominationLabel}</dd></div>
          <div><dt>Ano</dt><dd>{coinIssue.year}</dd></div>
          <div><dt>Material</dt><dd>{coinIssue.material ?? "A confirmar"}</dd></div>
          <div><dt>Tiragem</dt><dd>{formatMintage(coinIssue.mintage)}</dd></div>
          <div><dt>Peso</dt><dd>{coinIssue.weightGrams ? `${coinIssue.weightGrams.toLocaleString("pt-BR")} g` : "A confirmar"}</dd></div>
          <div><dt>Diâmetro</dt><dd>{coinIssue.diameterMm ? `${coinIssue.diameterMm.toLocaleString("pt-BR")} mm` : "A confirmar"}</dd></div>
        </dl>
        {coinIssue.notes && <p>{coinIssue.notes}</p>}
      </section>
      {owned && (
        <section className="detailSection editor">
          <h2>Meu exemplar</h2>
          <p className="editorSummary">
            {duplicates > 0 ? `${duplicates} duplicata${duplicates > 1 ? "s" : ""}` : "Sem duplicatas"}
            {item?.storageLocation ? ` · ${item.storageLocation}` : ""}
          </p>
          <div className="formGrid">
            <label>Quantidade<input type="number" min="1" step="1" value={item?.quantity ?? 1} onChange={(event) => update({ quantity: Math.max(1, Math.trunc(Number(event.target.value) || 1)) })} /></label>
            <label>Conservação<select value={item?.condition ?? ""} onChange={(event) => update({ condition: event.target.value as Condition })}><option value="">Não informado</option><option value="FC">FC — Flor de Cunho</option><option value="SOB">SOB — Soberba</option><option value="MBC">MBC — Muito Bem Conservada</option><option value="BC">BC — Bem Conservada</option><option value="REGULAR">Regular</option></select></label>
            <label>Data de aquisição<input type="date" value={item?.acquisitionDate ?? ""} onChange={(event) => update({ acquisitionDate: event.target.value })} /></label>
            <label>Preço pago (R$)<input type="number" min="0" step="0.01" value={item?.acquisitionPrice ?? ""} onChange={(event) => update({ acquisitionPrice: event.target.value ? Number(event.target.value) : null })} /></label>
            <label className="locationField"><MapPin /> Localização<input type="text" value={item?.storageLocation ?? ""} onChange={(event) => update({ storageLocation: event.target.value })} placeholder="Álbum, gaveta, cápsula…" /></label>
          </div>
          <label>Observações pessoais<textarea value={item?.personalNotes ?? ""} onChange={(event) => update({ personalNotes: event.target.value })} placeholder="Onde encontrou, história da peça…" /></label>
        </section>
      )}
    </>
  );
}
