import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import ts from "typescript";

const root = path.resolve(import.meta.dirname, "..");

async function loadStatistics() {
  const source = await readFile(path.join(root, "src", "lib", "statistics.ts"), "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  return import(`data:text/javascript;base64,${Buffer.from(output).toString("base64")}`);
}

const statistics = await loadStatistics();
const system = { id: "real", name: "Real", currencyName: "Real", symbol: "R$", validFrom: "1994-07-01" };
const entries = [
  { monetarySystem: system, coinType: { id: "t1", monetarySystemId: "real", family: "f1", denomination: 1, denominationLabel: "1 real", commemorative: false }, coinIssue: { id: "a", coinTypeId: "t1", year: 1994, title: "A" } },
  { monetarySystem: system, coinType: { id: "t2", monetarySystemId: "real", family: "f1", denomination: 2, denominationLabel: "2 reais", commemorative: false }, coinIssue: { id: "b", coinTypeId: "t2", year: 2004, title: "B" } },
  { monetarySystem: system, coinType: { id: "t3", monetarySystemId: "real", family: "f2", denomination: 1, denominationLabel: "1 real", commemorative: true }, coinIssue: { id: "c", coinTypeId: "t3", year: 2005, title: "C" } },
];

test("calcula quantidade, percentual, faltantes e duplicatas sem alterar o catálogo", () => {
  const items = new Map([
    ["a", { coinId: "a", owned: true, quantity: 3, updatedAt: "2026-01-01" }],
    ["b", { coinId: "b", owned: true, quantity: 1, updatedAt: "2026-01-01" }],
  ]);
  const stats = statistics.buildStatistics(entries, items, { f1: "Família 1", f2: "Família 2" });

  assert.equal(stats.total, 3);
  assert.equal(stats.owned, 2);
  assert.equal(stats.missing, 1);
  assert.equal(stats.totalQuantity, 4);
  assert.equal(stats.duplicates, 2);
  assert.equal(stats.percent, 67);
  assert.equal(stats.byQuantity.find((group) => group.id === "1").count, 1);
  assert.equal(stats.byQuantity.find((group) => group.id === "3-5").count, 1);
  assert.deepEqual(stats.byDecade.map((group) => group.id), ["1990", "2000"]);
  assert.equal(stats.byFamily.find((group) => group.id === "f1").percent, 100);
});

test("estima conclusão somente com histórico local suficiente", () => {
  const insufficient = new Map([
    ["a", { coinId: "a", owned: true, quantity: 1, acquisitionDate: "2026-06-01", updatedAt: "2026-06-01" }],
  ]);
  assert.equal(statistics.estimateCompletion(insufficient, 10, new Date("2026-07-24T12:00:00")).months, null);

  const enough = new Map([
    ["a", { coinId: "a", owned: true, quantity: 1, acquisitionDate: "2026-01-01", updatedAt: "2026-01-01" }],
    ["b", { coinId: "b", owned: true, quantity: 1, acquisitionDate: "2026-04-01", updatedAt: "2026-04-01" }],
  ]);
  const estimate = statistics.estimateCompletion(enough, 10, new Date("2026-07-01T12:00:00"));
  assert.ok(estimate.months > 0);
  assert.ok(estimate.ratePerMonth > 0);
});

test("painel é local, possui todos os agrupamentos e integra a navegação/PWA", async () => {
  const [page, shell, worker] = await Promise.all([
    readFile(path.join(root, "src", "app", "estatisticas", "page.tsx"), "utf8"),
    readFile(path.join(root, "src", "components", "layout", "AppShell.tsx"), "utf8"),
    readFile(path.join(root, "public", "sw.js"), "utf8"),
  ]);
  for (const title of ["Por padrão monetário", "Por família", "Por década", "Por valor", "Por anos", "Moedas faltantes", "Tempo estimado"]) {
    assert.match(page, new RegExp(title));
  }
  const quantityChart = await readFile(path.join(root, "src", "components", "statistics", "QuantityChart.tsx"), "utf8");
  assert.match(quantityChart, /Por quantidade/);
  assert.match(page, /Nenhum dado é enviado/);
  assert.match(shell, /\/estatisticas\//);
  assert.match(worker, /\/estatisticas\//);
  assert.match(worker, /v13-20260724-interface-ios26/);
});
