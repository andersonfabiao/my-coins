import type { Backup, CollectionItem, Condition, Settings } from "@/types";

const defaultSettings: Settings = { theme: "system", view: "list" };
const conditions: Condition[] = ["", "FC", "SOB", "MBC", "BC", "REGULAR"];

export const makeBackup = (items: CollectionItem[], settings: Settings): Backup => ({
  version: 1,
  exportedAt: new Date().toISOString(),
  items,
  settings,
});

function validSettings(value: unknown): value is Settings {
  if (!value || typeof value !== "object") return false;
  const settings = value as Partial<Settings>;
  return ["system", "light", "dark"].includes(settings.theme ?? "")
    && ["list", "grid"].includes(settings.view ?? "");
}

function migrateItem(value: unknown): CollectionItem | null {
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
    updatedAt: typeof item.updatedAt === "string" ? item.updatedAt : new Date(0).toISOString(),
  };
}

export function parseBackup(value: unknown): Backup {
  if (!value || typeof value !== "object") throw new Error("Arquivo inválido.");
  const backup = value as Partial<Backup>;
  if (backup.version !== 1 || !Array.isArray(backup.items)) {
    throw new Error("Formato de backup não reconhecido.");
  }
  const items = backup.items
    .map(migrateItem)
    .filter((item): item is CollectionItem => item !== null);
  if (backup.items.length > 0 && items.length === 0) {
    throw new Error("O backup não contém itens válidos.");
  }
  return {
    version: 1,
    exportedAt: typeof backup.exportedAt === "string" ? backup.exportedAt : new Date().toISOString(),
    items,
    settings: validSettings(backup.settings) ? backup.settings : defaultSettings,
  };
}
