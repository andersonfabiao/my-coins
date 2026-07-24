export type Family = string;
export type Condition = "FC" | "SOB" | "MBC" | "BC" | "REGULAR" | "";
export type Denomination = number;

export interface MonetarySystem {
  id: string;
  name: string;
  currencyName: string;
  symbol: string;
  validFrom: string;
  validTo?: string;
}

export interface CoinType {
  id: string;
  monetarySystemId: MonetarySystem["id"];
  family: Family;
  denomination: Denomination;
  denominationLabel: string;
  commemorative: boolean;
  obverseImage?: string;
  reverseImage?: string;
}

export interface CoinIssue {
  /**
   * É a unidade colecionável. Para o Real, preserva exatamente o ID existente
   * e, portanto, as chaves já salvas no navegador.
   */
  id: string;
  coinTypeId: CoinType["id"];
  year: number;
  title: string;
  subtitle?: string;
  theme?: string;
  event?: string;
  mintage?: number | null;
  material?: string;
  diameterMm?: number | null;
  weightGrams?: number | null;
  edge?: string;
  notes?: string;
}

export interface Catalog {
  monetarySystems: readonly MonetarySystem[];
  coinTypes: readonly CoinType[];
  coinIssues: readonly CoinIssue[];
}

/**
 * Composição explícita consumida pela interface. Não duplica campos entre
 * tipo e emissão e mantém visível a hierarquia completa do domínio.
 */
export interface CatalogEntry {
  monetarySystem: MonetarySystem;
  coinType: CoinType;
  coinIssue: CoinIssue;
}

export interface CollectionItem {
  coinId: CoinIssue["id"];
  owned: boolean;
  quantity: number;
  condition?: Condition;
  acquisitionDate?: string;
  acquisitionPrice?: number | null;
  personalNotes?: string;
  storageLocation?: string;
  favorite?: boolean;
  wantedForTrade?: boolean;
  updatedAt: string;
}

export interface Settings {
  theme: "system" | "light" | "dark";
  view: "list" | "grid";
}

export interface Collection {
  items: Map<CoinIssue["id"], CollectionItem>;
  settings: Settings;
}

export interface BackupV1 {
  version: 1;
  exportedAt: string;
  items: CollectionItem[];
  settings: Settings;
}

export interface BackupV2 {
  version: 2;
  collectionSchemaVersion: 2;
  exportedAt: string;
  items: CollectionItem[];
  settings: Settings;
}

export interface BackupV3 {
  version: 3;
  collectionSchemaVersion: 3;
  exportedAt: string;
  items: CollectionItem[];
  settings: Settings;
}

export interface BackupV4 {
  version: 4;
  collectionSchemaVersion: 3;
  exportedAt: string;
  itemCount: number;
  items: CollectionItem[];
  settings: Settings;
}

export type Backup = BackupV1 | BackupV2 | BackupV3 | BackupV4;
