"use client";

import { useMemo, useState } from "react";
import { Copy, Search, Share2 } from "lucide-react";
import { Header } from "@/components/ui/Header";
import { CoinGroups } from "@/components/coins/CoinGroups";
import { coins } from "@/data/coins";
import { formatFaceValue } from "@/lib/formatting";
import { useCollection } from "@/context/CollectionContext";

export default function Missing() {
  const { items } = useCollection();
  const [notice, setNotice] = useState("");
  const [query, setQuery] = useState("");
  const missing = useMemo(() => coins.filter((coin) => !items.get(coin.id)?.owned), [items]);
  const shown = missing.filter((coin) =>
    [coin.title, coin.subtitle, coin.theme, coin.year, coin.denominationLabel]
      .join(" ").toLowerCase().includes(query.toLowerCase())
  );
  const text = `Moedas que faltam na minha coleção:\n${missing.map((coin) => `• ${formatFaceValue(coin.denomination)} · ${coin.title}`).join("\n")}`;

  async function copy() {
    await navigator.clipboard.writeText(text);
    setNotice("Lista copiada!");
  }

  async function share() {
    if (navigator.share) await navigator.share({ title: "Moedas faltantes", text });
    else await copy();
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
      <CoinGroups coins={shown} />
    </>
  );
}
