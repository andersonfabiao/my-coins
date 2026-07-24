# Importador independente do catálogo de moedas do BCB

Este diretório é uma ferramenta de produção de dados. Nada daqui é importado por
`src/`, e o aplicativo não precisa do importador nem de suas saídas.

O site do Banco Central entrega somente o shell da página no HTTP; o conteúdo é
renderizado por JavaScript. Por isso, a coleta ao vivo abre a página em Chrome,
Chromium ou Edge no modo headless e captura os dados já renderizados.

## Uso

```powershell
node scripts/import-bcb-coins.mjs
node scripts/import-bcb-coins.mjs --download-images
node scripts/import-bcb-coins.mjs --monetary-system "Cruzeiro Real"
node scripts/import-bcb-coins.mjs --browser "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
```

Por padrão, os arquivos são gravados em `scripts/bcb-import/output/`. A coleta
renderizada é preservada em `scripts/bcb-import/cache/`, permitindo repetir a
normalização sem acessar o site:

```powershell
node scripts/import-bcb-coins.mjs --offline
node scripts/import-bcb-coins.mjs --input caminho\captura.json --output-dir caminho\saida
```

Opções:

- `--download-images`: baixa imagens (desativado por padrão);
- `--browser <arquivo>`: executável Chrome/Chromium/Edge;
- `--input <json>`: usa uma captura estruturada em vez do site;
- `--offline`: usa a captura mais recente do cache;
- `--output-dir <diretório>` e `--cache-dir <diretório>`;
- `--timeout-ms <n>` e `--max-items <n>`;
- `--source-url <url>`;
- `--monetary-system <nome>`: limita a coleta a um padrão monetário;
- `--help`.

## Saídas

- `monetary-systems.json`
- `coin-types.json`
- `coin-issues.json`
- `image-manifest.json`
- `catalog-meta.json`
- `validation-report.json`
- `IMPORT_REPORT.md`
- `images/` (somente com `--download-images`)

Os IDs são determinísticos: derivam de chaves publicadas pelo BCB e de campos
normalizados, com sufixo SHA-256 curto para impedir colisões silenciosas. Dados
ambíguos permanecem em `source.raw`; o importador não inventa valores.

## Testes

```powershell
node --test scripts/bcb-import/tests/*.test.mjs
```

Os testes são offline e não usam arquivos nem dependências do aplicativo.
