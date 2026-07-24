import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const root = path.resolve(import.meta.dirname, "..");

test("snapshot histórico contém seis padrões novos sem duplicar Real e Cruzeiro Real", async () => {
  const snapshot = await readFile(
    path.join(root, "src", "data", "historical-import.ts"),
    "utf8",
  );
  for (const name of [
    "Cruzeiro (Cr$)",
    "Cruzeiro Novo (NCr$)",
    "Cruzado (Cz$)",
    "Cruzado Novo (NCz$)",
  ]) {
    assert.match(snapshot, new RegExp(name.replace(/[()$]/g, "\\$&")));
  }
  assert.doesNotMatch(snapshot, /"name": "Real brasileiro"/);
  assert.doesNotMatch(snapshot, /"name": "Cruzeiro Real"/);
  assert.equal((snapshot.match(/"validFrom":/g) ?? []).length, 6);
  assert.equal((snapshot.match(/"denominationLabel":/g) ?? []).length, 59);
  assert.equal((snapshot.match(/"mintage":/g) ?? []).length, 136);
  assert.doesNotMatch(snapshot, /"year": null/);
});

test("catálogo combinado possui 331 rotas e preserva as 195 anteriores", async () => {
  const routes = (await readdir(path.join(root, "out", "moeda"), {
    withFileTypes: true,
  })).filter((entry) => entry.isDirectory());
  assert.equal(routes.length, 331);

  const cruzeiroReal = routes.filter((entry) =>
    entry.name.startsWith("ci-ct-ms-cruzeiro-real-"),
  );
  assert.equal(cruzeiroReal.length, 8);
});

test("as 59 imagens históricas estão incorporadas localmente", async () => {
  const images = (await readdir(
    path.join(root, "public", "coins", "bcb", "historical"),
    { withFileTypes: true },
  )).filter((entry) => entry.isFile());
  assert.equal(images.length, 59);
  assert.ok(images.every((entry) => /\.(jpg|jpeg|png|webp)$/i.test(entry.name)));
});

test("gerador impede integração incompleta ou duplicação dos padrões existentes", async () => {
  const generator = await readFile(
    path.join(root, "scripts", "generate-historical-app-snapshot.mjs"),
    "utf8",
  );
  assert.match(generator, /includedSystems\.length !== 6/);
  assert.match(generator, /includedIssues\.some\(\(\{ year \}\) => year === null\)/);
  assert.match(generator, /ms-real-r-vigente/);
  assert.match(generator, /ms-cruzeiro-real-cr-vigente/);
});
