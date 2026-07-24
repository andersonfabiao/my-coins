import type { Backup, BackupV4, CollectionItem, Settings } from "@/types";
import { COLLECTION_SCHEMA_VERSION, migrateBackup } from "@/lib/collection-migrations";

export const makeBackup = (items: CollectionItem[], settings: Settings): BackupV4 => ({
  version: 4,
  collectionSchemaVersion: COLLECTION_SCHEMA_VERSION,
  exportedAt: new Date().toISOString(),
  itemCount: items.length,
  items: [...items].sort((a, b) => a.coinId.localeCompare(b.coinId)),
  settings,
});

export function parseBackup(value: unknown): Backup {
  return migrateBackup(value);
}
