#!/usr/bin/env node
import { resolve, join } from "node:path";
import { captureRenderedPage } from "./bcb-import/lib/browser-capture.mjs";
import {
  SOURCE_URL,
  normalizeCapture,
  validateCatalog,
} from "./bcb-import/lib/core.mjs";
import {
  downloadImages,
  loadCapture,
  saveCapture,
  writeOutputs,
} from "./bcb-import/lib/output.mjs";

const root = resolve("scripts/bcb-import");
const defaults = {
  sourceUrl: SOURCE_URL,
  outputDir: join(root, "output"),
  cacheDir: join(root, "cache"),
  timeoutMs: 45000,
  maxItems: 0,
  downloadImages: false,
  offline: false,
};

function usage() {
  console.log(`Importador independente de moedas do Banco Central

Uso: node scripts/import-bcb-coins.mjs [opções]
  --download-images
  --browser <arquivo>
  --input <captura.json>
  --offline
  --output-dir <diretório>
  --cache-dir <diretório>
  --source-url <url>
  --monetary-system <nome>
  --timeout-ms <n>
  --max-items <n>
  --help`);
}

function parseArgs(argv) {
  const options = { ...defaults };
  const valued = new Map([
    ["--browser", "browser"],
    ["--input", "input"],
    ["--output-dir", "outputDir"],
    ["--cache-dir", "cacheDir"],
    ["--source-url", "sourceUrl"],
    ["--monetary-system", "monetarySystem"],
    ["--timeout-ms", "timeoutMs"],
    ["--max-items", "maxItems"],
  ]);
  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index];
    if (arg === "--help") options.help = true;
    else if (arg === "--download-images") options.downloadImages = true;
    else if (arg === "--offline") options.offline = true;
    else if (valued.has(arg)) {
      const value = argv[++index];
      if (!value) throw new Error(`${arg} exige um valor`);
      options[valued.get(arg)] = value;
    } else throw new Error(`Opção desconhecida: ${arg}`);
  }
  options.outputDir = resolve(options.outputDir);
  options.cacheDir = resolve(options.cacheDir);
  options.timeoutMs = Number(options.timeoutMs);
  options.maxItems = Number(options.maxItems);
  if (!Number.isInteger(options.timeoutMs) || options.timeoutMs < 1000)
    throw new Error("--timeout-ms deve ser um inteiro >= 1000");
  if (!Number.isInteger(options.maxItems) || options.maxItems < 0)
    throw new Error("--max-items deve ser um inteiro >= 0");
  return options;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) return usage();

  let capture;
  if (options.input) capture = await loadCapture(resolve(options.input));
  else if (options.offline)
    capture = await loadCapture(join(options.cacheDir, "latest.json"));
  else {
    capture = await captureRenderedPage(options);
    await saveCapture(options.cacheDir, capture);
  }
  if (!Array.isArray(capture.items))
    throw new Error("Captura inválida: items deve ser um array");

  const catalog = normalizeCapture(capture);
  if (options.downloadImages)
    await downloadImages(catalog, options.outputDir);
  const validation = validateCatalog(catalog);
  await writeOutputs({
    outputDir: options.outputDir,
    catalog,
    validation,
    capture,
    imagesRequested: options.downloadImages,
  });
  console.log(
    `${validation.valid ? "OK" : "FALHA"}: ${catalog.coinTypes.length} tipos, ` +
      `${catalog.coinIssues.length} emissões. Saída: ${options.outputDir}`,
  );
  if (!validation.valid) process.exitCode = 2;
}

main().catch((error) => {
  console.error(`Erro: ${error.message}`);
  process.exitCode = 1;
});
