"use client";

import Image from "next/image";
import Link from "next/link";
import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, ChevronRight, Folder, Search, SlidersHorizontal } from "lucide-react";
import { Header } from "@/components/ui/Header";
import { CoinList } from "@/components/coins/CoinList";
import { catalog, catalogEntries, familyNames } from "@/data/coins";
import { useCollection } from "@/context/CollectionContext";
import type { CoinType } from "@/types";

type Status = "all" | "owned" | "missing";
type Sort = "year-asc" | "year-desc";

const COUNTRY_ID = "brasil";
const familyDescriptions: Record<string, string> = {
  "primeira-familia": "Moedas emitidas a partir de 1994",
  "segunda-familia": "Moedas emitidas a partir de 1998",
  comemorativa: "Edições especiais de circulação",
  "cruzeiro-real-circulacao": "Moedas emitidas em 1993 e 1994",
};

function familiesFor(monetarySystemId: string) {
  return [...new Set(
    catalogEntries
      .filter(({ monetarySystem }) => monetarySystem.id === monetarySystemId)
      .map(({ coinType }) => coinType.family),
  )];
}

function isFamily(monetarySystemId: string | null, value: string | null) {
  return Boolean(monetarySystemId && value && familiesFor(monetarySystemId).includes(value));
}

function catalogHref(values: {
  country?: boolean;
  monetarySystemId?: string;
  family?: string;
  coinTypeId?: string;
}) {
  const params = new URLSearchParams();
  if (values.country) params.set("pais", COUNTRY_ID);
  if (values.monetarySystemId) params.set("padrao", values.monetarySystemId);
  if (values.family) params.set("familia", values.family);
  if (values.coinTypeId) params.set("tipo", values.coinTypeId);
  return `/catalogo/${params.size ? `?${params.toString()}` : ""}`;
}

function FolderCard({
  href,
  title,
  description,
  progress,
  image,
}: {
  href: string;
  title: string;
  description: string;
  progress: string;
  image?: string;
}) {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  return (
    <Link className="catalogFamilyCard" href={href}>
      <span className="catalogFamilyVisual">
        <Folder aria-hidden="true" />
        {image && <Image src={`${basePath}${image}`} alt="" width={48} height={48} />}
      </span>
      <span className="catalogFamilyInfo">
        <strong>{title}</strong>
        <small>{description}</small>
        <small>{progress}</small>
      </span>
      <ChevronRight aria-hidden="true" />
    </Link>
  );
}

function CountryFolders() {
  const { items } = useCollection();
  const owned = catalogEntries.filter(({ coinIssue }) => items.get(coinIssue.id)?.owned).length;
  const representative = catalogEntries.find(({ coinIssue }) => coinIssue.id === "real-30-2024");
  return (
    <>
      <Header title="Catálogo" subtitle="Escolha um país" />
      <div className="catalogStandard">
        <span>Países</span>
        <h2>Catálogo de moedas</h2>
      </div>
      <div className="catalogFamilyList">
        <FolderCard
          href={catalogHref({ country: true })}
          title="Brasil"
          description="Moedas brasileiras"
          progress={`${owned}/${catalogEntries.length} na coleção`}
          image={representative?.coinType.obverseImage}
        />
      </div>
    </>
  );
}

function MonetarySystemFolders() {
  const { items } = useCollection();

  return (
    <>
      <Link className="catalogBack" href="/catalogo/"><ArrowLeft /> Países</Link>
      <Header title="Brasil" subtitle="Escolha um padrão monetário" />
      <div className="catalogStandard">
        <span>Padrões monetários</span>
        <h2>Moedas brasileiras</h2>
      </div>
      <div className="catalogFamilyList">
        {catalog.monetarySystems.map((system) => {
          const entries = catalogEntries.filter(({ monetarySystem }) => monetarySystem.id === system.id);
          const owned = entries.filter(({ coinIssue }) => items.get(coinIssue.id)?.owned).length;
          const representative = entries[0];
          const period = system.validTo
            ? `${system.validFrom.slice(0, 4)}–${system.validTo.slice(0, 4)}`
            : `Desde ${system.validFrom.slice(0, 4)}`;
          return (
            <FolderCard
              key={system.id}
              href={catalogHref({ country: true, monetarySystemId: system.id })}
              title={system.name}
              description={period}
              progress={`${owned}/${entries.length} na coleção`}
              image={representative?.coinType.obverseImage}
            />
          );
        })}
      </div>
    </>
  );
}

function FamilyFolders({ monetarySystemId }: { monetarySystemId: string }) {
  const { items } = useCollection();
  const system = catalog.monetarySystems.find(({ id }) => id === monetarySystemId);
  if (!system) return <MonetarySystemFolders />;
  const familyOrder = familiesFor(monetarySystemId);
  return (
    <>
      <Link className="catalogBack" href={catalogHref({ country: true })}><ArrowLeft /> Brasil</Link>
      <Header title={system.name} subtitle="Escolha uma família" />
      <div className="catalogStandard">
        <span>Padrão monetário</span>
        <h2>{system.name}</h2>
      </div>
      <div className="catalogFamilyList">
        {familyOrder.map((family) => {
          const entries = catalogEntries.filter(
            ({ monetarySystem, coinType }) =>
              monetarySystem.id === monetarySystemId && coinType.family === family,
          );
          const owned = entries.filter(({ coinIssue }) => items.get(coinIssue.id)?.owned).length;
          const representative = family === "comemorativa"
            ? entries.find(({ coinIssue }) => coinIssue.id === "real-30-2024") ?? entries[0]
            : entries.find(({ coinType }) => coinType.denomination === 1) ?? entries[0];
          const image = representative?.coinType.commemorative
            ? representative.coinType.obverseImage
            : representative?.coinType.reverseImage ?? representative?.coinType.obverseImage;

          return (
            <FolderCard
              key={family}
              href={catalogHref({ country: true, monetarySystemId, family })}
              title={familyNames[family] ?? family}
              description={familyDescriptions[family] ?? `Moedas do padrão ${system.name}`}
              progress={`${owned}/${entries.length} na coleção`}
              image={image}
            />
          );
        })}
      </div>
    </>
  );
}

function CoinTypeFolders({ monetarySystemId, family }: { monetarySystemId: string; family: string }) {
  const { items } = useCollection();
  const entries = catalogEntries.filter(
    ({ monetarySystem, coinType }) =>
      monetarySystem.id === monetarySystemId && coinType.family === family,
  );
  const system = catalog.monetarySystems.find(({ id }) => id === monetarySystemId);
  const coinTypes = entries.reduce<CoinType[]>((types, { coinType }) => (
    types.some(({ id }) => id === coinType.id) ? types : [...types, coinType]
  ), []);

  return (
    <>
      <Link className="catalogBack" href={catalogHref({ country: true, monetarySystemId })}>
        <ArrowLeft /> Famílias
      </Link>
      <Header title={familyNames[family] ?? family} subtitle="Escolha uma moeda" />
      <div className="catalogStandard">
        <span>Moedas</span>
        <h2>{coinTypes.length} tipos</h2>
      </div>
      <div className="catalogFamilyList">
        {coinTypes.map((coinType) => {
          const issues = entries.filter((entry) => entry.coinType.id === coinType.id);
          const owned = issues.filter(({ coinIssue }) => items.get(coinIssue.id)?.owned).length;
          const firstIssue = issues[0].coinIssue;
          const image = coinType.commemorative
            ? coinType.obverseImage
            : coinType.reverseImage ?? coinType.obverseImage;
          const title = coinType.commemorative ? firstIssue.title : coinType.denominationLabel;
          const description = coinType.commemorative
            ? firstIssue.subtitle ?? "Moeda comemorativa"
            : `${system?.name ?? ""} · ${coinType.denominationLabel}`;

          return (
            <FolderCard
              key={coinType.id}
              href={catalogHref({
                country: true,
                monetarySystemId,
                family,
                coinTypeId: coinType.id,
              })}
              title={title}
              description={description}
              progress={`${owned}/${issues.length} emissões na coleção`}
              image={image}
            />
          );
        })}
      </div>
    </>
  );
}

function CoinIssues({ monetarySystemId, family, coinTypeId }: { monetarySystemId: string; family: string; coinTypeId: string }) {
  const { items } = useCollection();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<Status>("all");
  const [year, setYear] = useState("all");
  const [sort, setSort] = useState<Sort>("year-asc");
  const entries = useMemo(
    () => catalogEntries.filter(({ coinType }) => coinType.id === coinTypeId),
    [coinTypeId],
  );
  const coinType = entries[0]?.coinType;
  const years = [...new Set(entries.map(({ coinIssue }) => coinIssue.year))].sort();
  const shown = useMemo(() => entries.filter(({ coinIssue }) => {
    const haystack = [
      coinIssue.title,
      coinIssue.subtitle,
      coinIssue.theme,
      coinIssue.event,
      coinIssue.notes,
      coinIssue.year,
    ].join(" ").toLowerCase();
    const owned = items.get(coinIssue.id)?.owned ?? false;
    return haystack.includes(query.toLowerCase())
      && (status === "all" || (status === "owned" ? owned : !owned))
      && (year === "all" || coinIssue.year === Number(year));
  }).sort((a, b) => sort === "year-asc"
    ? a.coinIssue.year - b.coinIssue.year
    : b.coinIssue.year - a.coinIssue.year
  ), [entries, query, status, year, sort, items]);

  if (!coinType) return <CountryFolders />;
  const title = coinType.commemorative ? entries[0].coinIssue.title : coinType.denominationLabel;
  const hasAdvancedFilters = year !== "all" || sort !== "year-asc";

  return (
    <>
      <Link className="catalogBack" href={catalogHref({
        country: true,
        monetarySystemId,
        family,
      })}>
        <ArrowLeft /> Moedas
      </Link>
      <Header title={title} subtitle={`${shown.length} emissões`} />
      <div className="catalogStandard">
        <span>Emissões</span>
        <h2>{familyNames[family] ?? family}</h2>
      </div>
      <label className="search">
        <Search />
        <span className="srOnly">Buscar emissões</span>
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Ano, tema ou nome" />
      </label>
      <div className="catalogControls">
        <div className="chips" aria-label="Filtrar por situação">
          {([["all", "Todas"], ["owned", "Tenho"], ["missing", "Faltam"]] as const).map(([value, label]) => (
            <button className={status === value ? "selected" : ""} key={value} onClick={() => setStatus(value)}>{label}</button>
          ))}
        </div>
        <details className={`filters compactFilters ${hasAdvancedFilters ? "active" : ""}`}>
          <summary aria-label="Abrir filtros e ordenação"><SlidersHorizontal /> <span>Filtros</span></summary>
          <div className="filterGrid issueFilterGrid">
            <label>Ano<select value={year} onChange={(event) => setYear(event.target.value)}><option value="all">Todos</option>{years.map((value) => <option key={value}>{value}</option>)}</select></label>
            <label>Ordenar<select value={sort} onChange={(event) => setSort(event.target.value as Sort)}><option value="year-asc">Ano mais antigo</option><option value="year-desc">Ano mais recente</option></select></label>
          </div>
        </details>
      </div>
      <CoinList entries={shown} />
    </>
  );
}

function CatalogNavigation() {
  const params = useSearchParams();
  const country = params.get("pais");
  const monetarySystemId = params.get("padrao");
  const family = params.get("familia");
  const coinTypeId = params.get("tipo");

  if (coinTypeId && isFamily(monetarySystemId, family)) {
    return <CoinIssues monetarySystemId={monetarySystemId!} family={family!} coinTypeId={coinTypeId} />;
  }
  if (isFamily(monetarySystemId, family)) {
    return <CoinTypeFolders monetarySystemId={monetarySystemId!} family={family!} />;
  }
  if (monetarySystemId && catalog.monetarySystems.some(({ id }) => id === monetarySystemId)) {
    return <FamilyFolders monetarySystemId={monetarySystemId} />;
  }
  if (country === COUNTRY_ID) return <MonetarySystemFolders />;
  return <CountryFolders />;
}

export default function Page() {
  return <Suspense><CatalogNavigation /></Suspense>;
}
