import { createHash } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { basename, extname, join } from "node:path";

async function atomicJson(file, value) {
  const temporary = `${file}.${process.pid}.tmp`;
  await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  await rename(temporary, file);
}
export async function saveCapture(cacheDir, capture) {
  await mkdir(cacheDir, { recursive: true });
  await atomicJson(join(cacheDir, "latest.json"), capture);
}

export async function loadCapture(file) {
  return JSON.parse(await readFile(file, "utf8"));
}

function safeImageName(entry, contentType) {
  const urlExt = extname(new URL(entry.sourceUrl).pathname).toLowerCase();
  const allowed = new Set([".webp", ".jpeg", ".png", ".webp", ".gif"]);
  const typeExt = {
    "image/jpeg": ".webp",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
  }[contentType];
  return `${entry.coinTypeId}${allowed.has(urlExt) ? urlExt : typeExt || ".bin"}`;
}

export async function downloadImages(catalog, outputDir) {
  const imageDir = join(outputDir, "images");
  await mkdir(imageDir, { recursive: true });
  for (const entry of catalog.images) {
    try {
      const response = await fetch(entry.sourceUrl, {
        headers: { "user-agent": "my-coins-bcb-importer/1.0" },
      });
      const contentType = (response.headers.get("content-type") || "").split(";")[0];
      if (!response.ok || !contentType.startsWith("image/"))
        throw new Error(`HTTP ${response.status}; tipo ${contentType || "ausente"}`);
      const bytes = new Uint8Array(await response.arrayBuffer());
      if (bytes.length > 15 * 1024 * 1024) throw new Error("imagem excede 15 MiB");
      const fileName = safeImageName(entry, contentType);
      await writeFile(join(imageDir, fileName), bytes);
      entry.file = `images/${fileName}`;
      entry.status = "downloaded";
      entry.sha256 = createHash("sha256").update(bytes).digest("hex");
    } catch (error) {
      entry.status = "failed";
      entry.error = error.message;
    }
  }
}

export async function writeOutputs({
  outputDir,
  catalog,
  validation,
  capture,
  imagesRequested,
}) {
  await mkdir(outputDir, { recursive: true });
  const metadata = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    sourceUrl: capture.sourceUrl,
    capturedAt: capture.capturedAt || null,
    captureSchemaVersion: capture.schemaVersion || null,
    imagesRequested,
    valid: validation.valid,
  };
  await Promise.all([
    atomicJson(join(outputDir, "monetary-systems.json"), catalog.monetarySystems),
    atomicJson(join(outputDir, "coin-types.json"), catalog.coinTypes),
    atomicJson(join(outputDir, "coin-issues.json"), catalog.coinIssues),
    atomicJson(join(outputDir, "image-manifest.json"), catalog.images),
    atomicJson(join(outputDir, "catalog-meta.json"), metadata),
    atomicJson(join(outputDir, "validation-report.json"), validation),
  ]);
  const report = `# Relatório da importação BCB

- Fonte: ${capture.sourceUrl}
- Captura: ${capture.capturedAt || "não informada"}
- Geração: ${metadata.generatedAt}
- Resultado: ${validation.valid ? "VÁLIDO" : "INVÁLIDO"}
- Padrões monetários: ${validation.counts.monetarySystems}
- Tipos de moeda: ${validation.counts.coinTypes}
- Emissões: ${validation.counts.coinIssues}
- Imagens catalogadas: ${validation.counts.images}
- Download de imagens: ${imagesRequested ? "solicitado" : "não solicitado"}

## Erros

${validation.errors.length ? validation.errors.map((item) => `- ${item}`).join("\n") : "Nenhum."}

## Avisos

${validation.warnings.length ? validation.warnings.map((item) => `- ${item}`).join("\n") : "Nenhum."}

## Arquivos

Os JSONs deste diretório são artefatos independentes. Eles não são consumidos
automaticamente pela aplicação.
`;
  await writeFile(join(outputDir, "IMPORT_REPORT.md"), report, "utf8");
}
