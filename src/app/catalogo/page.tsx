"use client";

import Image from "next/image";
import Link from "next/link";
import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, ChevronRight, Folder, Search, SlidersHorizontal } from "lucide-react";
import { Header } from "@/components/ui/Header";
import { CoinGroups } from "@/components/coins/CoinGroups";
import { coins, familyNames } from "@/data/coins";
import { formatFaceValue } from "@/lib/formatting";
import { useCollection } from "@/context/CollectionContext";
import type { Family } from "@/types";

type Status = "all" | "owned" | "missing";
type Sort = "value-asc" | "value-desc" | "year-asc" | "year-desc" | "special";

const familyOrder: Family[] = ["primeira-familia", "segunda-familia", "comemorativa"];
const familyDescriptions: Record<Family, string> = {
  "primeira-familia": "Moedas emitidas a partir de 1994",
  "segunda-familia": "Moedas emitidas a partir de 1998",
  comemorativa: "Edições especiais de circulação",
};

function isFamily(value: string | null): value is Family {
  return value !== null && familyOrder.includes(value as Family);
}

function FamilyFolders() {
  const { items } = useCollection();
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  return (
    <>
      <Header title="Catálogo" subtitle="Escolha uma família do Real brasileiro" />
      <div className="catalogStandard">
        <span>Padrão monetário</span>
        <h2>Real brasileiro</h2>
      </div>
      <div className="catalogFamilyList">
        {familyOrder.map((family) => {
          const familyCoins = coins.filter((coin) => coin.family === family);
          const owned = familyCoins.filter((coin) => items.get(coin.id)?.owned).length;
          const representative = family === "comemorativa"
            ? familyCoins.find((coin) => coin.id === "real-30-2024") ?? familyCoins[0]
            : familyCoins.find((coin) => coin.denomination === 1) ?? familyCoins[0];
          const image = representative.commemorative ? representative.obverseImage : representative.reverseImage;
          return (
            <Link className="catalogFamilyCard" href={`/catalogo/?familia=${family}`} key={family}>
              <span className="catalogFamilyVisual">
                <Folder aria-hidden="true" />
                {image && <Image src={`${basePath}${image}`} alt="" width={48} height={48} />}
              </span>
              <span className="catalogFamilyInfo">
                <strong>{familyNames[family]} do Real</strong>
                <small>{familyDescriptions[family]}</small>
                <small>{owned}/{familyCoins.length} na coleção</small>
              </span>
              <ChevronRight aria-hidden="true" />
            </Link>
          );
        })}
      </div>
    </>
  );
}

function FamilyCatalog({ family }: { family: Family }) {
  const { items } = useCollection();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<Status>("all");
  const [denomination, setDenomination] = useState("all");
  const [year, setYear] = useState("all");
  const [sort, setSort] = useState<Sort>("year-asc");
  const familyCoins = useMemo(() => coins.filter((coin) => coin.family === family), [family]);
  const years = [...new Set(familyCoins.map((coin) => coin.year))].sort();
  const hasAdvancedFilters = denomination !== "all" || year !== "all" || sort !== "year-asc";

  const shown = useMemo(() => familyCoins.filter((coin) => {
    const haystack = [coin.title, coin.subtitle, coin.theme, coin.event, coin.notes, coin.year, coin.denominationLabel].join(" ").toLowerCase();
    const owned = items.get(coin.id)?.owned ?? false;
    return haystack.includes(query.toLowerCase())
      && (status === "all" || (status === "owned" ? owned : !owned))
      && (denomination === "all" || coin.denomination === Number(denomination))
      && (year === "all" || coin.year === Number(year));
  }).sort((a, b) =>
    sort === "value-asc" ? a.denomination - b.denomination
      : sort === "value-desc" ? b.denomination - a.denomination
        : sort === "year-asc" ? a.year - b.year
          : sort === "year-desc" ? b.year - a.year
            : Number(b.commemorative) - Number(a.commemorative)
  ), [familyCoins, query, status, denomination, year, sort, items]);

  return (
    <>
      <Link className="catalogBack" href="/catalogo/"><ArrowLeft /> Famílias do Real</Link>
      <Header title={`${familyNames[family]} do Real`} subtitle={`${shown.length} moedas agrupadas por valor e ano`} />
      <label className="search">
        <Search />
        <span className="srOnly">Buscar moedas</span>
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Ano, valor, tema ou nome" />
      </label>
      <div className="catalogControls">
        <div className="chips" aria-label="Filtrar por situação">
          {([["all", "Todas"], ["owned", "Tenho"], ["missing", "Faltam"]] as const).map(([value, label]) => (
            <button className={status === value ? "selected" : ""} key={value} onClick={() => setStatus(value)}>{label}</button>
          ))}
        </div>
        <details className={`filters compactFilters ${hasAdvancedFilters ? "active" : ""}`}>
          <summary aria-label="Abrir filtros e ordenação"><SlidersHorizontal /> <span>Filtros</span></summary>
          <div className="filterGrid familyFilterGrid">
            <label>Valor<select value={denomination} onChange={(event) => setDenomination(event.target.value)}><option value="all">Todos</option>{[.01, .05, .1, .25, .5, 1].map((value) => <option key={value} value={value}>{formatFaceValue(value)}</option>)}</select></label>
            <label>Ano<select value={year} onChange={(event) => setYear(event.target.value)}><option value="all">Todos</option>{years.map((value) => <option key={value}>{value}</option>)}</select></label>
            <label>Ordenar<select value={sort} onChange={(event) => setSort(event.target.value as Sort)}><option value="year-asc">Ano mais antigo</option><option value="year-desc">Ano mais recente</option><option value="value-asc">Menor valor</option><option value="value-desc">Maior valor</option><option value="special">Comemorativas primeiro</option></select></label>
          </div>
        </details>
      </div>
      <CoinGroups coins={shown} />
    </>
  );
}

function Catalog() {
  const params = useSearchParams();
  const familyParam = params.get("familia");
  return isFamily(familyParam) ? <FamilyCatalog family={familyParam} /> : <FamilyFolders />;
}

export default function Page() {
  return <Suspense><Catalog /></Suspense>;
}
