import type { BackupV4, CollectionItem, Condition, Settings } from "@/types";

export const COLLECTION_SCHEMA_VERSION = 3 as const;

const conditions: Condition[] = ["", "FC", "SOB", "MBC", "BC", "REGULAR"];
const defaultSettings: Settings = { theme: "system", view: "list" };

export function isSettings(value: unknown): value is Settings {
  if (!value || typeof value !== "object") return false;
  const settings = value as Partial<Settings>;
  return ["system", "light", "dark"].includes(settings.theme ?? "")
    && ["list", "grid"].includes(settings.view ?? "");
}

export function migrateCollectionItem(value: unknown): CollectionItem | null {
  if (!value || typeof value !== "object") return null;
  const item = value as Partial<CollectionItem>;
  if (typeof item.coinId !== "string" || !item.coinId) return null;

  const owned = item.owned === true;
  return {
    coinId: item.coinId,
    owned,
    quantity: Number.isFinite(item.quantity) && Number(item.quantity) >= 0
      ? Number(item.quantity)
      : owned ? 1 : 0,
    condition: conditions.includes(item.condition ?? "") ? item.condition : "",
    acquisitionDate: typeof item.acquisitionDate === "string" ? item.acquisitionDate : undefined,
    acquisitionPrice: typeof item.acquisitionPrice === "number" && Number.isFinite(item.acquisitionPrice)
      ? item.acquisitionPrice
      : null,
    personalNotes: typeof item.personalNotes === "string" ? item.personalNotes : undefined,
    storageLocation: typeof item.storageLocation === "string" ? item.storageLocation : undefined,
    favorite: item.favorite === true,
    wantedForTrade: item.wantedForTrade === true,
    updatedAt: typeof item.updatedAt === "string" ? item.updatedAt : new Date(0).toISOString(),
  };
}

export function migrateCollectionItems(values: unknown[]): CollectionItem[] {
  return values
    .map(migrateCollectionItem)
    .filter((item): item is CollectionItem => item !== null);
}

export function migrateBackup(value: unknown): BackupV4 {
  if (!value || typeof value !== "object") throw new Error("Arquivo inválido.");
  const backup = value as Record<string, unknown>;
  if (![1, 2, 3, 4].includes(Number(backup.version)) || !Array.isArray(backup.items)) {
    throw new Error("Formato de backup não reconhecido.");
  }
  if (backup.items.length > 100_000) throw new Error("Backup excede o limite de 100.000 itens.");

  const migrated = migrateCollectionItems(backup.items);
  const items = [...new Map(migrated.map((item) => [item.coinId, item])).values()];
  if (backup.items.length > 0 && items.length === 0) {
    throw new Error("O backup não contém itens válidos.");
  }

  return {
    version: 4,
    collectionSchemaVersion: COLLECTION_SCHEMA_VERSION,
    exportedAt: typeof backup.exportedAt === "string" ? backup.exportedAt : new Date().toISOString(),
    itemCount: items.length,
    items,
    settings: isSettings(backup.settings) ? backup.settings : defaultSettings,
  };
}
