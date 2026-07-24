import { readdir, stat, unlink } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = path.resolve(import.meta.dirname, "..", "public", "coins");

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  return (await Promise.all(entries.map((entry) => {
    const target = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(target) : [target];
  }))).flat();
}

let before = 0;
let after = 0;
let converted = 0;
for (const source of (await walk(root)).filter((file) => /\.jpe?g$/i.test(file))) {
  const target = source.replace(/\.jpe?g$/i, ".webp");
  const sourceSize = (await stat(source)).size;
  await sharp(source).rotate().webp({ quality: 82, smartSubsample: true }).toFile(target);
  const targetSize = (await stat(target)).size;
  before += sourceSize;
  if (targetSize < sourceSize) {
    await unlink(source);
    after += targetSize;
    converted += 1;
  } else {
    await unlink(target);
    after += sourceSize;
  }
}

console.log(`${converted} imagens convertidas; ${before} bytes → ${after} bytes.`);
