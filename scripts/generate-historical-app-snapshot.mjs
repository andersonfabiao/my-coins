#!/usr/bin/env node
import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { extname, resolve } from "node:path";

const inputDir = resolve(
  process.argv[2] ?? "scripts/bcb-import/output/todos-os-padroes",
);
const appFile = resolve("src/data/historical-import.ts");
const imageDir = resolve("public/coins/bcb/historical");
const excludedSystems = new Set([
  "ms-real-r-vigente-a-partir-de-01-07-1994-c6947936af",
  "ms-cruzeiro-real-cr-vigente-de-1-8-1993-a-30-6-1994-1262fa9e07",
]);

const readJson = async (file) =>
  JSON.parse(await readFile(resolve(inputDir, file), "utf8"));

const [systems, types, issues, images, validation] = await Promise.all([
  readJson("monetary-systems.json"),
  readJson("coin-types.json"),
  readJson("coin-issues.json"),
  readJson("image-manifest.json"),
  readJson("validation-report.json"),
]);

if (!validation.valid) throw new Error("A importação não passou na validação");

const includedSystems = systems.filter(({ id }) => !excludedSystems.has(id));
const includedSystemIds = new Set(includedSystems.map(({ id }) => id));
const includedTypes = types.filter(({ monetarySystemId }) =>
  includedSystemIds.has(monetarySystemId),
);
const includedTypeIds = new Set(includedTypes.map(({ id }) => id));
const includedIssues = issues.filter(({ coinTypeId }) =>
  includedTypeIds.has(coinTypeId),
);

if (includedSystems.length !== 6)
  throw new Error(`Esperados 6 padrões históricos; recebidos ${includedSystems.length}`);
if (includedIssues.some(({ year }) => year === null))
  throw new Error("Existem emissões históricas sem ano");

const clean = (value = "") => String(value).replace(/\s+/g, " ").trim();
const slug = (value = "") =>
  clean(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const isoDate = (day, month, year) =>
  `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

function datesFromName(name) {
  const dates = [...name.matchAll(/(\d{1,2})\/(\d{1,2})\/(\d{4})/g)].map(
    ([, day, month, year]) => isoDate(day, month, year),
  );
  return { validFrom: dates[0], validTo: dates[1] };
}

function numericFaceValue(value) {
  const match = clean(value).match(/([\d.]+(?:,\d+)?)/);
  if (!match) throw new Error(`Valor facial inválido: ${value}`);
  return Number(match[1].replace(/\./g, "").replace(",", "."));
}

const imageByType = new Map(images.map((image) => [image.coinTypeId, image]));
await mkdir(imageDir, { recursive: true });

const typeSpecs = {};
const appTypes = [];
const familyNames = {};
for (const type of includedTypes) {
  const system = includedSystems.find(({ id }) => id === type.monetarySystemId);
  const rawFamily = type.family || "Moedas de circulação";
  const family = `${system.id}--${slug(rawFamily)}`;
  familyNames[family] = rawFamily;
  const image = imageByType.get(type.id);
  if (!image || image.status !== "downloaded" || !image.file)
    throw new Error(`Imagem ausente para ${type.id}`);
  const extension = extname(image.file).toLowerCase() || ".jpg";
  const fileName = `${type.id.slice(-10)}${extension}`;
  await copyFile(resolve(inputDir, image.file), resolve(imageDir, fileName));
  const localImage = `/coins/bcb/historical/${fileName}`;
  appTypes.push({
    id: type.id,
    monetarySystemId: type.monetarySystemId,
    family,
    denomination: numericFaceValue(type.faceValue),
    denominationLabel: type.faceValue,
    commemorative: false,
    obverseImage: localImage,
    reverseImage: localImage,
  });
  typeSpecs[type.id] = {
    name: clean(type.name).replace(/^Moeda de\s+/i, ""),
    circulationPeriod: type.circulationPeriod,
    material: type.material,
    diameterMm: type.diameterMm,
    weightGrams: type.weightG,
    obverse: clean(type.obverse),
    reverse: clean(type.reverse).replace(/Fechar$/i, "").trim(),
  };
}

const appIssues = includedIssues.map((issue) => {
  const specs = typeSpecs[issue.coinTypeId];
  return {
    id: issue.id,
    coinTypeId: issue.coinTypeId,
    year: issue.year,
    title: `${specs.name} — ${issue.year}`,
    subtitle: specs.obverse || undefined,
    mintage: issue.mintage,
    material: specs.material,
    diameterMm: specs.diameterMm,
    weightGrams: specs.weightGrams,
    edge: undefined,
    notes: specs.circulationPeriod
      ? `Período de circulação: ${specs.circulationPeriod}.`
      : undefined,
  };
});

const appSystems = includedSystems
  .map((system) => {
    const symbol = system.name.match(/\(([^)]+)\)/)?.[1] ?? "";
    return {
      id: system.id,
      name: system.name.replace(/\s+vigente.*$/i, ""),
      currencyName: system.name.split("(")[0].trim(),
      symbol,
      ...datesFromName(system.name),
    };
  })
  .sort((a, b) => a.validFrom.localeCompare(b.validFrom));

const banner = `/* Arquivo gerado por scripts/generate-historical-app-snapshot.mjs.
 * Fonte: Banco Central do Brasil. Não editar manualmente.
 */`;
const source = `${banner}
import type { Catalog } from "@/types";

export const historicalFamilyNames: Record<string, string> = ${JSON.stringify(familyNames, null, 2)};

export const historicalCatalog: Catalog = {
  monetarySystems: ${JSON.stringify(appSystems, null, 2)},
  coinTypes: ${JSON.stringify(appTypes, null, 2)},
  coinIssues: ${JSON.stringify(appIssues, null, 2)},
};
`;

await writeFile(appFile, source, "utf8");
console.log(
  `Snapshot gerado: ${includedSystems.length} padrões, ${includedTypes.length} tipos, ` +
    `${includedIssues.length} emissões e ${includedTypes.length} imagens.`,
);
