import type {
  Catalog,
  CatalogEntry,
  CoinIssue,
  CoinType,
  Family,
  MonetarySystem,
} from "@/types";

export type RealDenomination = 0.01 | 0.05 | 0.1 | 0.25 | 0.5 | 1;

/**
 * Formato de entrada do catálogo estático atual. É restrito à camada de dados:
 * a aplicação consome exclusivamente CatalogEntry.
 */
export interface CoinCatalogSource {
  id: string;
  family: Family;
  denomination: RealDenomination;
  denominationLabel: string;
  year: number;
  title: string;
  subtitle?: string;
  commemorative: boolean;
  theme?: string;
  event?: string;
  mintage?: number | null;
  material?: string;
  diameterMm?: number | null;
  weightGrams?: number | null;
  edge?: string;
  obverseImage?: string;
  reverseImage?: string;
  notes?: string;
}

export const REAL_MONETARY_SYSTEM: MonetarySystem = {
  id: "br-real-1994",
  name: "Real brasileiro",
  currencyName: "Real",
  symbol: "R$",
  validFrom: "1994-07-01",
};

function coinTypeId(source: CoinCatalogSource): string {
  if (source.commemorative) return `br-real-1994-type-${source.id}`;
  return `br-real-1994-type-${source.family}-${source.denomination}`;
}

function toCoinType(source: CoinCatalogSource): CoinType {
  return {
    id: coinTypeId(source),
    monetarySystemId: REAL_MONETARY_SYSTEM.id,
    family: source.family,
    denomination: source.denomination,
    denominationLabel: source.denominationLabel,
    commemorative: source.commemorative,
    ...(source.obverseImage ? { obverseImage: source.obverseImage } : {}),
    ...(source.reverseImage ? { reverseImage: source.reverseImage } : {}),
  };
}

function toCoinIssue(source: CoinCatalogSource): CoinIssue {
  const {
    id,
    year,
    title,
    subtitle,
    theme,
    event,
    mintage,
    material,
    diameterMm,
    weightGrams,
    edge,
    notes,
  } = source;

  return {
    id,
    coinTypeId: coinTypeId(source),
    year,
    title,
    ...(subtitle !== undefined ? { subtitle } : {}),
    ...(theme !== undefined ? { theme } : {}),
    ...(event !== undefined ? { event } : {}),
    ...(mintage !== undefined ? { mintage } : {}),
    ...(material !== undefined ? { material } : {}),
    ...(diameterMm !== undefined ? { diameterMm } : {}),
    ...(weightGrams !== undefined ? { weightGrams } : {}),
    ...(edge !== undefined ? { edge } : {}),
    ...(notes !== undefined ? { notes } : {}),
  };
}

export function createCatalog(sources: readonly CoinCatalogSource[]): Catalog {
  const typesById = new Map<string, CoinType>();
  const coinIssues = sources.map((source) => {
    const type = toCoinType(source);
    const existing = typesById.get(type.id);

    if (existing && JSON.stringify(existing) !== JSON.stringify(type)) {
      throw new Error(`CoinType incompatível para ${type.id}`);
    }

    typesById.set(type.id, type);
    return toCoinIssue(source);
  });

  return {
    monetarySystems: [REAL_MONETARY_SYSTEM],
    coinTypes: [...typesById.values()],
    coinIssues,
  };
}

export function mergeCatalogs(...catalogs: readonly Catalog[]): Catalog {
  const monetarySystems = catalogs.flatMap((catalog) => catalog.monetarySystems);
  const coinTypes = catalogs.flatMap((catalog) => catalog.coinTypes);
  const coinIssues = catalogs.flatMap((catalog) => catalog.coinIssues);
  for (const [label, items] of [
    ["MonetarySystem", monetarySystems],
    ["CoinType", coinTypes],
    ["CoinIssue", coinIssues],
  ] as const) {
    const ids = new Set(items.map((item) => item.id));
    if (ids.size !== items.length) throw new Error(`${label} duplicado ao combinar catálogos`);
  }
  return { monetarySystems, coinTypes, coinIssues };
}

export function createCatalogEntries(catalog: Catalog): CatalogEntry[] {
  const systemsById = new Map(catalog.monetarySystems.map((system) => [system.id, system]));
  const typesById = new Map(catalog.coinTypes.map((type) => [type.id, type]));

  return catalog.coinIssues.map((coinIssue) => {
    const coinType = typesById.get(coinIssue.coinTypeId);
    if (!coinType) throw new Error(`CoinType ausente para a emissão ${coinIssue.id}`);

    const monetarySystem = systemsById.get(coinType.monetarySystemId);
    if (!monetarySystem) throw new Error(`MonetarySystem ausente para o tipo ${coinType.id}`);

    return { monetarySystem, coinType, coinIssue };
  });
}

export function createCatalogEntryIndex(entries: readonly CatalogEntry[]) {
  const entriesByIssueId = new Map(entries.map((entry) => [entry.coinIssue.id, entry]));
  return (issueId: string) => entriesByIssueId.get(issueId);
}
