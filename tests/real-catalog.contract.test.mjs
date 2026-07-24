import assert from "node:assert/strict";
import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const root = path.resolve(import.meta.dirname, "..");
const source = (...parts) => path.join(root, "src", ...parts);
const output = (...parts) => path.join(root, "out", ...parts);

const years = (from, to, excluded = []) =>
  Array.from({ length: to - from + 1 }, (_, index) => from + index)
    .filter((year) => !excluded.includes(year));

const regularIds = (family, denomination, coinYears) =>
  coinYears.map((year) => `${family}-${denomination}-${year}`);

const legacyRealIds = [
  ...regularIds("primeira-familia", 0.01, years(1994, 1997)),
  ...regularIds("primeira-familia", 0.05, years(1994, 1997)),
  ...regularIds("primeira-familia", 0.1, years(1994, 1997)),
  ...regularIds("primeira-familia", 0.25, years(1994, 1995)),
  ...regularIds("primeira-familia", 0.5, years(1994, 1995)),
  "primeira-familia-1-1994",
  ...regularIds("segunda-familia", 0.01, years(1998, 2004)),
  ...regularIds("segunda-familia", 0.05, years(1998, 2025)),
  "segunda-familia-0.05-2019-a",
  ...regularIds("segunda-familia", 0.1, years(1998, 2025)),
  ...regularIds("segunda-familia", 0.25, years(1998, 2025)),
  ...regularIds("segunda-familia", 0.5, years(1998, 2025, [1999, 2004])),
  "segunda-familia-0.5-2019-a",
  ...regularIds("segunda-familia", 1, years(1998, 2025, [2000, 2001, 2015])),
  "fao-10-1995",
  "fao-25-1995",
  "dh-1998",
  "jk-2002",
  "bcb-40-2005",
  "bandeira-2012",
  "rio-atletismo-2014",
  "rio-natacao-2014",
  "rio-paratriatlo-2014",
  "rio-golfe-2014",
  "rio-basquetebol-2015",
  "rio-vela-2015",
  "rio-rugby-2015",
  "rio-paracanoagem-2015",
  "bcb-50-2015",
  "rio-futebol-2015",
  "rio-voleibol-2015",
  "rio-judo-2015",
  "rio-atletismo-paralimpico-2015",
  "rio-boxe-2016",
  "rio-natacao-paralimpica-2016",
  "rio-vinicius-2016",
  "rio-tom-2016",
  "plano-real-2019",
  "real-30-2024",
  "bcb-60-2025",
].sort();

test("a linha de base contém 187 IDs únicos do Real", () => {
  assert.equal(legacyRealIds.length, 187);
  assert.equal(new Set(legacyRealIds).size, 187);
});

test("todos os IDs atuais continuam gerando páginas de detalhe", async () => {
  const routeRoot = output("moeda");
  const routeIds = (await readdir(routeRoot, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);

  const missing = legacyRealIds.filter((id) => !routeIds.includes(id));
  assert.deepEqual(
    missing,
    [],
    "Execute `npm run build`; IDs legados sem rota não podem ser removidos.",
  );
  assert.ok(routeIds.length >= 187, "A expansão não pode remover rotas existentes do Real.");

  for (const id of legacyRealIds) {
    const page = output("moeda", id, "index.html");
    assert.equal((await stat(page)).isFile(), true, `Rota inacessível: /moeda/${id}/`);
  }
});

test("toda a aplicação usa o modelo híbrido e preserva a emissão como unidade colecionável", async () => {
  const [types, domain, data] = await Promise.all([
    readFile(source("types", "index.ts"), "utf8"),
    readFile(source("domain", "catalog.ts"), "utf8"),
    readFile(source("data", "coins.ts"), "utf8"),
  ]);

  for (const model of ["Catalog", "Collection", "MonetarySystem", "CoinType", "CoinIssue"]) {
    assert.match(types, new RegExp(`export interface ${model}\\b`));
  }

  assert.doesNotMatch(types, /export interface Coin\b/);
  assert.match(types, /export interface CatalogEntry\b/);
  assert.match(types, /coinId:\s*CoinIssue\["id"\]/);
  assert.match(domain, /const\s*\{\s*id,[\s\S]*\}\s*=\s*source/);
  assert.match(domain, /return\s*\{\s*id,\s*coinTypeId:/);
  assert.match(domain, /export function createCatalogEntries\(catalog:\s*Catalog\)/);
  assert.match(domain, /return\s*\{\s*monetarySystem,\s*coinType,\s*coinIssue\s*\}/);
  assert.match(data, /mergeCatalogs\(createCatalog\(realCatalogSources\), cruzeiroRealCatalog\)/);
  assert.match(data, /export const catalogEntries = createCatalogEntries\(catalog\)/);
  assert.match(data, /export const getCatalogEntry = createCatalogEntryIndex\(catalogEntries\)/);
});

test("o catálogo continua expondo uma rota para cada moeda", async () => {
  const routeSource = await readFile(source("app", "moeda", "[id]", "page.tsx"), "utf8");
  assert.match(routeSource, /generateStaticParams\s*\(\)/);
  assert.match(routeSource, /catalogEntries\.map\s*\(\s*\(\{coinIssue\}\)\s*=>\s*\(\{id:coinIssue\.id\}\)/);
  assert.match(routeSource, /getCatalogEntry\s*\(\s*id\s*\)/);
});

test("a navegação visual percorre país, padrão, família, moeda e emissões", async () => {
  const catalogPage = await readFile(source("app", "catalogo", "page.tsx"), "utf8");
  assert.match(catalogPage, /function CountryFolders\(\)/);
  assert.match(catalogPage, /function MonetarySystemFolders\(\)/);
  assert.match(catalogPage, /function FamilyFolders\(/);
  assert.match(catalogPage, /function CoinTypeFolders\(/);
  assert.match(catalogPage, /function CoinIssues\(/);
  assert.match(catalogPage, /params\.get\("pais"\)/);
  assert.match(catalogPage, /params\.get\("padrao"\)/);
  assert.match(catalogPage, /params\.get\("familia"\)/);
  assert.match(catalogPage, /params\.get\("tipo"\)/);
  assert.match(catalogPage, /catalog\.monetarySystems\.some/);
});

test("o checkbox continua ligado ao ID e à persistência da coleção", async () => {
  const [card, context, database] = await Promise.all([
    readFile(source("components", "coins", "CoinCard.tsx"), "utf8"),
    readFile(source("context", "CollectionContext.tsx"), "utf8"),
    readFile(source("lib", "database.ts"), "utf8"),
  ]);

  assert.match(card, /className="coinToggle"/);
  assert.match(card, /onClick=\{\(\)\s*=>\s*void toggle\(coinIssue\.id\)\}/);
  assert.match(card, /aria-pressed=\{owned\}/);

  assert.match(context, /const owned\s*=\s*!old\?\.owned/);
  assert.match(context, /coinId:id,owned/);
  assert.match(context, /quantity:owned\?Math\.max\(1,old\?\.quantity\?\?1\):0/);
  assert.match(context, /await repository\.save\(item\)/);
  assert.match(context, /\.set\(item\.coinId,item\)/);

  assert.match(database, /createObjectStore\(COLLECTION_STORE,\s*\{\s*keyPath:\s*"coinId"\s*\}\)/);
  assert.match(database, /store\.put\(\{ \.\.\.migrated, schemaVersion: COLLECTION_SCHEMA_VERSION \}\)/);
  assert.match(database, /row\.coinId\s*!==\s*migrated\.coinId/);
});
