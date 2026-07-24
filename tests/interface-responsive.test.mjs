import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const root = path.resolve(import.meta.dirname, "..");

test("sistema visual oferece materiais, movimento e dark mode sem dependências externas", async () => {
  const css = await readFile(path.join(root, "src", "app", "globals.css"), "utf8");
  assert.match(css, /\/\* iOS 26 visual system \*\//);
  assert.match(css, /backdrop-filter:blur\(28px\)/);
  assert.match(css, /--spring:cubic-bezier/);
  assert.match(css, /html\[data-theme="dark"\]/);
  assert.match(css, /prefers-color-scheme:dark/);
  assert.match(css, /prefers-reduced-motion:reduce/);
  assert.match(css, /:focus-visible/);
});

test("layouts cobrem telefone, tablet, landscape e desktop sem mudar componentes funcionais", async () => {
  const css = await readFile(path.join(root, "src", "app", "globals.css"), "utf8");
  assert.match(css, /@media\(max-width:699px\)/);
  assert.match(css, /@media\(min-width:700px\) and \(max-width:1100px\)/);
  assert.match(css, /@media\(min-width:1280px\)/);
  assert.match(css, /@media\(orientation:landscape\) and \(max-height:560px\)/);
  assert.match(css, /env\(safe-area-inset-left\)/);
  assert.match(css, /env\(safe-area-inset-bottom\)/);
});

test("PWA aceita todas as orientações e atualiza o shell visual offline", async () => {
  const manifest = JSON.parse(await readFile(path.join(root, "public", "manifest.webmanifest"), "utf8"));
  const worker = await readFile(path.join(root, "public", "sw.js"), "utf8");
  assert.equal(manifest.orientation, "any");
  assert.ok(manifest.display_override.includes("standalone"));
  assert.equal(manifest.theme_color, "#f4f7fb");
  assert.match(worker, /v13-20260724-interface-ios26/);
});
