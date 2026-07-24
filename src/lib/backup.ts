import type { Backup, BackupV3, CollectionItem, Settings } from "@/types";
import { COLLECTION_SCHEMA_VERSION, migrateBackup } from "@/lib/collection-migrations";

export const makeBackup = (items: CollectionItem[], settings: Settings): BackupV3 => ({
  version: 3,
  collectionSchemaVersion: COLLECTION_SCHEMA_VERSION,
  exportedAt: new Date().toISOString(),
  items,
  settings,
});

export function parseBackup(value: unknown): Backup {
  return migrateBackup(value);
}
