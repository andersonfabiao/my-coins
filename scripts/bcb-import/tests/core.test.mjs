import test from "node:test";
import assert from "node:assert/strict";
import {
  normalizeCapture,
  parseDecimal,
  parseInteger,
  stableId,
  validateCatalog,
} from "../lib/core.mjs";

const capture = {
  schemaVersion: 1,
  sourceUrl: "https://www.bcb.gov.br/cedulasemoedas/moedasemitidas",
  capturedAt: "2026-07-24T12:00:00.000Z",
  items: [
    {
      modalKey: "moeda_real_1_real",
      url: "https://www.bcb.gov.br/cedulasemoedas/moedasemitidas?modalAberto=moeda_real_1_real",
      title: "1 Real",
      monetarySystem: "Real (1994 - atual)",
      family: "2ª Família",
      imageUrl: "/content/moeda.jpg",
      fields: {
        "Valor facial": "R$ 1,00",
        "Diâmetro(mm)": "27,0",
        "Peso(g)": "7,00",
        Material: "aço inoxidável",
        "Ano da produção /Código(*) /tiragem":
          "2019 / A / 46.057.000 2020 / A / 25.000.000",
      },
      obverse: "Efígie da República",
      reverse: "Valor e constelação",
    },
  ],
};

test("converte números brasileiros sem perder casas decimais", () => {
  assert.equal(parseDecimal("23,0 mm"), 23);
  assert.equal(parseDecimal("2,15 g"), 2.15);
  assert.equal(parseInteger("46.057.000"), 46057000);
});
test("gera IDs determinísticos", () => {
  assert.equal(stableId("ct", "Real", "1 Real"), stableId("ct", "Real", "1 Real"));
  assert.notEqual(stableId("ct", "Real", "1 Real"), stableId("ct", "Real", "50 centavos"));
});

test("normaliza captura em padrão, tipo e emissões", () => {
  const catalog = normalizeCapture(capture);
  assert.equal(catalog.monetarySystems.length, 1);
  assert.equal(catalog.coinTypes.length, 1);
  assert.deepEqual(catalog.coinIssues.map((item) => item.year), [2019, 2020]);
  assert.equal(catalog.coinIssues[0].mintage, 46057000);
  assert.equal(catalog.images[0].status, "not-requested");
  assert.equal(validateCatalog(catalog).valid, true);
});

test("detecta duplicidade de chave da origem", () => {
  const duplicated = normalizeCapture({
    ...capture,
    items: [...capture.items, { ...capture.items[0], title: "Cópia" }],
  });
  const report = validateCatalog(duplicated);
  assert.equal(report.valid, false);
  assert.match(report.errors.join("\n"), /duplicad/i);
});
