"use client";

import { useMemo, useState } from "react";
import { Copy, Search, Share2 } from "lucide-react";
import { Header } from "@/components/ui/Header";
import { CoinGroups } from "@/components/coins/CoinGroups";
import { catalogEntries } from "@/data/coins";
import { formatFaceValue } from "@/lib/formatting";
import { useCollection } from "@/context/CollectionContext";

export default function Missing() {
  const { items } = useCollection();
  const [notice, setNotice] = useState("");
  const [query, setQuery] = useState("");
  const missing = useMemo(() => catalogEntries.filter(({ coinIssue }) => !items.get(coinIssue.id)?.owned), [items]);
  const shown = missing.filter(({ coinIssue, coinType }) =>
    [coinIssue.title, coinIssue.subtitle, coinIssue.theme, coinIssue.year, coinType.denominationLabel]
      .join(" ").toLowerCase().includes(query.toLowerCase())
  );
  const text = `Moedas que faltam na minha coleção:\n${missing.map(({ coinIssue, coinType }) => `• ${formatFaceValue(coinType.denomination)} · ${coinIssue.title}`).join("\n")}`;

  async function copy() {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const area = document.createElement("textarea");
        area.value = text;
        area.style.position = "fixed";
        area.style.opacity = "0";
        document.body.appendChild(area);
        area.select();
        document.execCommand("copy");
        area.remove();
      }
      setNotice("Lista copiada!");
    } catch {
      setNotice("Não foi possível copiar. Tente novamente.");
    }
  }

  async function share() {
    try {
      if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
        await navigator.share({ title: "Moedas faltantes", text });
      } else {
        await copy();
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      await copy();
    }
  }

  return (
    <>
      <Header title="Moedas faltantes" subtitle={`${missing.length} moedas para completar o catálogo`} />
      <div className="missingToolbar">
        <label className="search">
          <Search />
          <span className="srOnly">Buscar nas moedas faltantes</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar nas faltantes" />
        </label>
        <div className="actionRow">
          <button onClick={() => void copy()}><Copy /> Copiar</button>
          <button className="primary" onClick={() => void share()}><Share2 /> Compartilhar</button>
        </div>
      </div>
      {notice && <p className="notice" role="status">{notice}</p>}
      <CoinGroups entries={shown} />
    </>
  );
}
