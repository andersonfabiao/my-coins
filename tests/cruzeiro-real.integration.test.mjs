import assert from "node:assert/strict";
import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const root = path.resolve(import.meta.dirname, "..");
const importedIssueIds = [
  "ci-ct-ms-cruzeiro-real-cr-vigente-de-1-8-1993-a-30-6-1994-1262fa9e07-moeda--b4aee9ca0e",
  "ci-ct-ms-cruzeiro-real-cr-vigente-de-1-8-1993-a-30-6-1994-1262fa9e07-moeda--d0c98510ef",
  "ci-ct-ms-cruzeiro-real-cr-vigente-de-1-8-1993-a-30-6-1994-1262fa9e07-moeda--ab820dd0e3",
  "ci-ct-ms-cruzeiro-real-cr-vigente-de-1-8-1993-a-30-6-1994-1262fa9e07-moeda--251217eb0b",
  "ci-ct-ms-cruzeiro-real-cr-vigente-de-1-8-1993-a-30-6-1994-1262fa9e07-moeda--e65e5c8dc7",
  "ci-ct-ms-cruzeiro-real-cr-vigente-de-1-8-1993-a-30-6-1994-1262fa9e07-moeda--c9fb0666ad",
  "ci-ct-ms-cruzeiro-real-cr-vigente-de-1-8-1993-a-30-6-1994-1262fa9e07-moeda--5967a3292b",
  "ci-ct-ms-cruzeiro-real-cr-vigente-de-1-8-1993-a-30-6-1994-1262fa9e07-moeda--2290eb745f",
];

test("snapshot importado contém somente Cruzeiro Real, quatro tipos e oito emissões", async () => {
  const data = await readFile(path.join(root, "src", "data", "cruzeiro-real.ts"), "utf8");
  assert.match(data, /name: "Cruzeiro Real"/);
  assert.doesNotMatch(data, /Cruzado|Cruzeiro Novo/);
  assert.equal((data.match(/denominationLabel: "CR\$/g) ?? []).length, 4);
  for (const id of importedIssueIds) assert.match(data, new RegExp(id));
});

test("todas as emissões importadas têm rota estática e imagem local", async () => {
  for (const id of importedIssueIds) {
    assert.equal((await stat(path.join(root, "out", "moeda", id, "index.html"))).isFile(), true);
  }
  const images = (await readdir(path.join(root, "public", "coins", "bcb")))
    .filter((name) => /^cruzeiro-real-(5|10|50|100)\.jpg$/.test(name));
  assert.equal(images.length, 4);
});

test("busca, situação, ano e ordenação continuam aplicados às emissões", async () => {
  const page = await readFile(path.join(root, "src", "app", "catalogo", "page.tsx"), "utf8");
  assert.match(page, /haystack\.includes\(query\.toLowerCase\(\)\)/);
  assert.match(page, /status === "owned"/);
  assert.match(page, /coinIssue\.year === Number\(year\)/);
  assert.match(page, /sort === "year-asc"/);
  assert.match(page, /catalog\.monetarySystems\.map/);
});

test("PWA inclui shell offline e versão de cache da expansão", async () => {
  const [serviceWorker, manifest, offline] = await Promise.all([
    readFile(path.join(root, "public", "sw.js"), "utf8"),
    readFile(path.join(root, "public", "manifest.webmanifest"), "utf8"),
    readFile(path.join(root, "public", "offline.html"), "utf8"),
  ]);
  assert.match(serviceWorker, /v11-20260724-colecao-avancada/);
  assert.match(serviceWorker, /networkFirst/);
  assert.match(serviceWorker, /cacheFirst/);
  assert.match(manifest, /moedas brasileiras/);
  assert.ok(offline.length > 100);
});
