import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const root = path.resolve(import.meta.dirname, "..");
const read = (...parts) => readFile(path.join(root, ...parts), "utf8");

test("modelo avançado mantém campos pessoais opcionais e compatíveis", async () => {
  const types = await read("src", "types", "index.ts");

  for (const field of [
    "quantity",
    "condition",
    "acquisitionDate",
    "acquisitionPrice",
    "personalNotes",
    "storageLocation",
    "favorite",
    "wantedForTrade",
  ]) {
    assert.match(types, new RegExp(`${field}\\??:`));
  }
});

test("detalhe permite editar todos os recursos e deriva duplicatas da quantidade", async () => {
  const detail = await read("src", "components", "coins", "CoinDetail.tsx");

  assert.match(detail, /Math\.max\(0, \(item\?\.quantity \?\? 0\) - 1\)/);
  assert.match(detail, /update\(\{ favorite: !item\?\.favorite \}\)/);
  assert.match(detail, /update\(\{ wantedForTrade: !item\?\.wantedForTrade \}\)/);
  assert.match(detail, /storageLocation/);
  assert.match(detail, /acquisitionPrice/);
  assert.match(detail, /acquisitionDate/);
  assert.match(detail, /personalNotes/);
  assert.match(detail, /condition/);
});

test("coleção oferece indicadores e filtros para favoritas, duplicatas e troca", async () => {
  const collection = await read("src", "app", "colecao", "page.tsx");

  assert.match(collection, /item\?\.favorite/);
  assert.match(collection, /\(item\?\.quantity \?\? 0\) > 1/);
  assert.match(collection, /item\?\.wantedForTrade/);
  assert.match(collection, /Math\.max\(0, \(items\.get\(coinIssue\.id\)\?\.quantity \?\? 0\) - 1\)/);
  assert.match(collection, /setFilter/);
});
