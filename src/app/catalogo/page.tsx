"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal } from "lucide-react";
import { Header } from "@/components/ui/Header";
import { CoinGroups } from "@/components/coins/CoinGroups";
import { coins } from "@/data/coins";
import { formatFaceValue } from "@/lib/formatting";
import { useCollection } from "@/context/CollectionContext";
import type { Family } from "@/types";

type Status = "all" | "owned" | "missing";
type Sort = "value-asc" | "value-desc" | "year-asc" | "year-desc" | "special";

function Catalog() {
  const params = useSearchParams();
  const { items } = useCollection();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<Status>("all");
  const [family, setFamily] = useState<Family | "all">((params.get("familia") as Family) || "all");
  const [denomination, setDenomination] = useState("all");
  const [year, setYear] = useState("all");
  const [sort, setSort] = useState<Sort>("year-asc");
  const years = [...new Set(coins.map((coin) => coin.year))].sort();

  const shown = useMemo(() => coins.filter((coin) => {
    const haystack = [coin.title, coin.subtitle, coin.theme, coin.event, coin.notes, coin.year, coin.denominationLabel, coin.family].join(" ").toLowerCase();
    const owned = items.get(coin.id)?.owned ?? false;
    return haystack.includes(query.toLowerCase())
      && (status === "all" || (status === "owned" ? owned : !owned))
      && (family === "all" || coin.family === family)
      && (denomination === "all" || coin.denomination === Number(denomination))
      && (year === "all" || coin.year === Number(year));
  }).sort((a, b) =>
    sort === "value-asc" ? a.denomination - b.denomination
      : sort === "value-desc" ? b.denomination - a.denomination
        : sort === "year-asc" ? a.year - b.year
          : sort === "year-desc" ? b.year - a.year
            : Number(b.commemorative) - Number(a.commemorative)
  ), [query, status, family, denomination, year, sort, items]);

  return (
    <>
      <Header title="Catálogo" subtitle={`${shown.length} moedas agrupadas por valor e ano`} />
      <label className="search">
        <Search />
        <span className="srOnly">Buscar moedas</span>
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Ano, valor, tema ou nome" />
      </label>
      <div className="chips" aria-label="Filtrar por situação">
        {([["all", "Todas"], ["owned", "Tenho"], ["missing", "Faltam"]] as const).map(([value, label]) => (
          <button className={status === value ? "selected" : ""} key={value} onClick={() => setStatus(value)}>{label}</button>
        ))}
      </div>
      <details className="filters glass">
        <summary><SlidersHorizontal /> Filtros e ordenação</summary>
        <div className="filterGrid">
          <label>Família<select value={family} onChange={(event) => setFamily(event.target.value as typeof family)}><option value="all">Todas</option><option value="primeira-familia">Primeira Família</option><option value="segunda-familia">Segunda Família</option><option value="comemorativa">Comemorativas</option></select></label>
          <label>Valor<select value={denomination} onChange={(event) => setDenomination(event.target.value)}><option value="all">Todos</option>{[.01, .05, .1, .25, .5, 1].map((value) => <option key={value} value={value}>{formatFaceValue(value)}</option>)}</select></label>
          <label>Ano<select value={year} onChange={(event) => setYear(event.target.value)}><option value="all">Todos</option>{years.map((value) => <option key={value}>{value}</option>)}</select></label>
          <label>Ordenar<select value={sort} onChange={(event) => setSort(event.target.value as Sort)}><option value="year-asc">Ano mais antigo</option><option value="year-desc">Ano mais recente</option><option value="value-asc">Menor valor</option><option value="value-desc">Maior valor</option><option value="special">Comemorativas primeiro</option></select></label>
        </div>
      </details>
      <CoinGroups coins={shown} />
    </>
  );
}

export default function Page() {
  return <Suspense><Catalog /></Suspense>;
}
