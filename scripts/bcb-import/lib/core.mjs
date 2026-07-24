import { createHash } from "node:crypto";

export const SOURCE_URL =
  "https://www.bcb.gov.br/cedulasemoedas/moedasemitidas";

export function cleanText(value = "") {
  return String(value)
    .normalize("NFC")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function slug(value = "") {
  return cleanText(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "sem-identificador";
}

function digest(value) {
  return createHash("sha256").update(value).digest("hex").slice(0, 10);
}

export function stableId(prefix, ...parts) {
  const identity = parts.map(cleanText).join("|");
  return `${prefix}-${slug(parts.join("-")).slice(0, 72)}-${digest(identity)}`;
}

export function parseDecimal(value) {
  const text = cleanText(value).replace(/[^\d,.-]/g, "");
  if (!text) return null;
  const normalized = text.includes(",")
    ? text.replace(/\./g, "").replace(",", ".")
    : text;
  const number = Number(normalized);
  return Number.isFinite(number) ? number : null;
}

export function parseInteger(value) {
  const digits = cleanText(value).replace(/\D/g, "");
  return digits ? Number(digits) : null;
}

function field(fields, ...names) {
  const entries = Object.entries(fields || {});
  for (const name of names) {
    const wanted = slug(name);
    const found = entries.find(([key]) => slug(key).includes(wanted));
    if (found) return cleanText(found[1]);
  }
  return "";
}

function productionRows(raw) {
  const production = field(
    raw.fields,
    "ano da produção",
    "ano de produção",
    "data da moeda",
    "tiragem",
  );
  const years = [...production.matchAll(/(18|19|20)\d{2}(?=\s*\/)/g)].map(
    (match) => match[0],
  );
  return [...new Set(years)].map((year) => ({
    year: Number(year),
    raw: production,
  }));
}

export function normalizeCapture(capture) {
  const rawItems = Array.isArray(capture.items) ? capture.items : [];
  const systemsByName = new Map();
  const types = [];
  const issues = [];
  const images = [];

  for (const raw of rawItems) {
    const systemName = cleanText(raw.monetarySystem || "Não identificado");
    const systemId = stableId("ms", systemName);
    systemsByName.set(systemId, {
      id: systemId,
      country: "Brasil",
      name: systemName,
      source: { url: capture.sourceUrl || SOURCE_URL },
    });

    const sourceKey = cleanText(raw.modalKey || raw.url || raw.title);
    const title = cleanText(raw.title || sourceKey);
    const typeId = stableId("ct", systemId, sourceKey);
    const imageUrl = raw.imageUrl
      ? new URL(raw.imageUrl, capture.sourceUrl || SOURCE_URL).href
      : null;
    types.push({
      id: typeId,
      monetarySystemId: systemId,
      family: cleanText(raw.family || "") || null,
      name: title,
      faceValue: field(raw.fields, "valor facial") || null,
      circulationPeriod:
        field(raw.fields, "período de circulação", "periodo de circulação") ||
        null,
      diameterMm: parseDecimal(field(raw.fields, "diâmetro", "diametro")),
      weightG: parseDecimal(field(raw.fields, "peso")),
      thicknessMm: parseDecimal(field(raw.fields, "espessura")),
      material: field(raw.fields, "material") || null,
      obverse: cleanText(raw.obverse || "") || null,
      reverse: cleanText(raw.reverse || "") || null,
      imageUrl,
      source: {
        key: sourceKey,
        url: raw.url || capture.sourceUrl || SOURCE_URL,
        raw: raw.fields || {},
      },
    });

    const rows = productionRows(raw);
    if (rows.length === 0) {
      issues.push({
        id: stableId("ci", typeId, "sem-ano"),
        coinTypeId: typeId,
        year: null,
        mintage: null,
        source: { raw: field(raw.fields, "ano da produção", "tiragem") || null },
      });
    } else {
      for (const row of rows) {
        const nearby = row.raw.match(
          new RegExp(
            `${row.year}\\s*\\/\\s*[^/]+\\/\\s*(\\d{1,3}(?:\\.\\d{3})+)`,
          ),
        );
        issues.push({
          id: stableId("ci", typeId, String(row.year)),
          coinTypeId: typeId,
          year: row.year,
          mintage: nearby ? parseInteger(nearby[1]) : null,
          source: { raw: row.raw },
        });
      }
    }
    if (imageUrl) {
      images.push({
        coinTypeId: typeId,
        sourceUrl: imageUrl,
        file: null,
        status: "not-requested",
      });
    }
  }

  return {
    monetarySystems: [...systemsByName.values()].sort((a, b) =>
      a.id.localeCompare(b.id),
    ),
    coinTypes: types.sort((a, b) => a.id.localeCompare(b.id)),
    coinIssues: issues.sort((a, b) => a.id.localeCompare(b.id)),
    images: images.sort((a, b) => a.coinTypeId.localeCompare(b.coinTypeId)),
  };
}

export function validateCatalog(catalog) {
  const errors = [];
  const warnings = [];
  const duplicateIds = [];
  const seen = new Map();
  const all = [
    ...catalog.monetarySystems.map((item) => ["monetarySystem", item]),
    ...catalog.coinTypes.map((item) => ["coinType", item]),
    ...catalog.coinIssues.map((item) => ["coinIssue", item]),
  ];
  for (const [kind, item] of all) {
    if (seen.has(item.id)) duplicateIds.push(item.id);
    else seen.set(item.id, kind);
  }
  if (duplicateIds.length) errors.push(`IDs duplicados: ${duplicateIds.join(", ")}`);

  const systems = new Set(catalog.monetarySystems.map((item) => item.id));
  const types = new Set(catalog.coinTypes.map((item) => item.id));
  for (const type of catalog.coinTypes) {
    if (!systems.has(type.monetarySystemId))
      errors.push(`${type.id}: padrão monetário inexistente`);
    if (!type.faceValue)
      warnings.push(`${type.id}: valor facial não identificado`);
    if (!type.material)
      warnings.push(`${type.id}: material não identificado`);
  }
  for (const issue of catalog.coinIssues) {
    if (!types.has(issue.coinTypeId))
      errors.push(`${issue.id}: tipo de moeda inexistente`);
    if (issue.year === null) warnings.push(`${issue.id}: ano não identificado`);
  }
  const sourceKeys = new Map();
  for (const type of catalog.coinTypes) {
    const key = type.source.key;
    if (sourceKeys.has(key))
      errors.push(`Chave de origem duplicada: ${key}`);
    sourceKeys.set(key, type.id);
  }
  if (!catalog.coinTypes.length) errors.push("Nenhuma moeda foi extraída");

  return {
    valid: errors.length === 0,
    counts: {
      monetarySystems: catalog.monetarySystems.length,
      coinTypes: catalog.coinTypes.length,
      coinIssues: catalog.coinIssues.length,
      images: catalog.images.length,
    },
    errors,
    warnings,
    duplicateIds: [...new Set(duplicateIds)],
  };
}
