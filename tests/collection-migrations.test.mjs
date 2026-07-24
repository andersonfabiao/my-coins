import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import ts from "typescript";

const root = path.resolve(import.meta.dirname, "..");
const migrationsPath = path.join(root, "src", "lib", "collection-migrations.ts");

async function loadMigrations() {
  const source = await readFile(migrationsPath, "utf8");
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  const url = `data:text/javascript;base64,${Buffer.from(transpiled).toString("base64")}`;
  return import(url);
}

const migrations = await loadMigrations();

test("migra item antigo preservando checkbox, quantidade, estado e observações", () => {
  const oldItem = {
    coinId: "segunda-familia-1-2024",
    owned: true,
    quantity: 3,
    condition: "SOB",
    acquisitionDate: "2025-03-10",
    acquisitionPrice: 12.5,
    personalNotes: "Encontrada em feira.",
    updatedAt: "2025-03-11T10:00:00.000Z",
  };

  assert.deepEqual(migrations.migrateCollectionItem(oldItem), oldItem);
});

test("recupera quantidade padrão de registros anteriores ao campo quantity", () => {
  const owned = migrations.migrateCollectionItem({ coinId: "fao-10-1995", owned: true });
  const missing = migrations.migrateCollectionItem({ coinId: "fao-25-1995", owned: false });

  assert.equal(owned.quantity, 1);
  assert.equal(owned.owned, true);
  assert.equal(missing.quantity, 0);
  assert.equal(missing.owned, false);
});

test("lê backup V1 e converte para V2 sem perder dados", () => {
  const backupV1 = {
    version: 1,
    exportedAt: "2025-01-02T03:04:05.000Z",
    settings: { theme: "dark", view: "grid" },
    items: [{
      coinId: "real-30-2024",
      owned: true,
      quantity: 2,
      condition: "MBC",
      personalNotes: "Backup antigo",
      updatedAt: "2025-01-01T00:00:00.000Z",
    }],
  };

  const migrated = migrations.migrateBackup(backupV1);
  assert.equal(migrated.version, 2);
  assert.equal(migrated.collectionSchemaVersion, 2);
  assert.equal(migrated.exportedAt, backupV1.exportedAt);
  assert.deepEqual(migrated.settings, backupV1.settings);
  assert.equal(migrated.items[0].coinId, "real-30-2024");
  assert.equal(migrated.items[0].owned, true);
  assert.equal(migrated.items[0].quantity, 2);
  assert.equal(migrated.items[0].condition, "MBC");
  assert.equal(migrated.items[0].personalNotes, "Backup antigo");
});

test("lê backup V2 preservando todos os campos pessoais", () => {
  const backupV2 = {
    version: 2,
    collectionSchemaVersion: 2,
    exportedAt: "2026-07-24T12:00:00.000Z",
    settings: { theme: "system", view: "list" },
    items: [{
      coinId: "bcb-60-2025",
      owned: true,
      quantity: 4,
      condition: "FC",
      acquisitionDate: "2026-07-01",
      acquisitionPrice: 42,
      personalNotes: "Sem marcas.",
      updatedAt: "2026-07-24T12:00:00.000Z",
    }],
  };

  const migrated = migrations.migrateBackup(backupV2);
  assert.deepEqual(migrated, backupV2);
});

test("rejeita versões desconhecidas e backups sem itens válidos", () => {
  assert.throws(
    () => migrations.migrateBackup({ version: 99, items: [] }),
    /Formato de backup não reconhecido/,
  );
  assert.throws(
    () => migrations.migrateBackup({ version: 1, items: [{}] }),
    /não contém itens válidos/,
  );
});

test("IndexedDB mantém keyPath e executa upgrade versionado", async () => {
  const database = await readFile(path.join(root, "src", "lib", "database.ts"), "utf8");
  assert.match(database, /const DB_VERSION = 3/);
  assert.match(database, /const META_STORE = "meta"/);
  assert.match(database, /keyPath: "coinId"/);
  assert.match(database, /openCursor\(\)/);
  assert.match(database, /cursor\.update\(\{ \.\.\.migrated, schemaVersion: COLLECTION_SCHEMA_VERSION \}\)/);
  assert.match(database, /meta\?\.put\(COLLECTION_SCHEMA_VERSION, "collectionSchemaVersion"\)/);
});

test("exportação usa V2 e restore delega à migração compatível", async () => {
  const backup = await readFile(path.join(root, "src", "lib", "backup.ts"), "utf8");
  assert.match(backup, /version: 2/);
  assert.match(backup, /collectionSchemaVersion: COLLECTION_SCHEMA_VERSION/);
  assert.match(backup, /return migrateBackup\(value\)/);
});
