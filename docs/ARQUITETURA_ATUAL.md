# Arquitetura atual

**Data do inventário:** 24/07/2026
**Escopo:** estado do projeto antes da expansão histórica.
**Linha de base:** 187 registros/rotas de moedas do Real.

## 1. Visão geral

O projeto é uma PWA local, mobile-first, sem backend. O catálogo do Real é
compilado junto com a aplicação; a coleção do usuário fica exclusivamente no
navegador.

```text
Catálogo estático (src/data/coins.ts)
              │
              ├── páginas, busca, filtros e estatísticas
              ├── imagens locais em public/coins/bcb
              └── Coin.id
                    │
                    └── CollectionItem.coinId
                          ├── IndexedDB
                          ├── fallback em localStorage
                          └── backup JSON
```

Stack:

- Next.js 15.2 com App Router;
- React 19;
- TypeScript 5.7 em modo estrito;
- exportação estática para `out/`;
- `next/image` sem otimizador de servidor;
- ícones `lucide-react`;
- service worker próprio;
- GitHub Pages via GitHub Actions;
- Node.js 20 no CI.

## 2. Árvore de pastas

Diretórios gerados (`node_modules`, `.next` e `out`) foram omitidos.

```text
my_coins/
├── .github/
│   └── workflows/
│       └── deploy-pages.yml
├── docs/
│   ├── ARQUITETURA_ATUAL.md
│   └── PLANO_DE_MIGRACAO.md
├── public/
│   ├── coins/
│   │   ├── bcb/
│   │   │   └── 76 arquivos WebP de anverso/reverso
│   │   └── README.md
│   ├── icons/
│   │   ├── apple-touch-icon.png
│   │   ├── icon-192.png
│   │   ├── icon-512.png
│   │   └── icon.svg
│   ├── manifest.webmanifest
│   ├── offline.html
│   └── sw.js
├── scripts/
│   └── fetch-coin-images.mjs
├── src/
│   ├── app/
│   │   ├── ajustes/page.tsx
│   │   ├── catalogo/page.tsx
│   │   ├── colecao/page.tsx
│   │   ├── faltantes/page.tsx
│   │   ├── moeda/[id]/page.tsx
│   │   ├── error.tsx
│   │   ├── global-error.tsx
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── coins/
│   │   │   ├── CoinCard.tsx
│   │   │   ├── CoinDetail.tsx
│   │   │   ├── CoinGroups.tsx
│   │   │   └── CoinList.tsx
│   │   ├── collection/
│   │   │   └── Summary.tsx
│   │   ├── layout/
│   │   │   └── AppShell.tsx
│   │   ├── ui/
│   │   │   └── Header.tsx
│   │   ├── ClientDiagnostics.tsx
│   │   └── ServiceWorker.tsx
│   ├── context/
│   │   └── CollectionContext.tsx
│   ├── data/
│   │   ├── coin-images.ts
│   │   └── coins.ts
│   ├── lib/
│   │   ├── backup.ts
│   │   ├── database.ts
│   │   └── formatting.ts
│   └── types/
│       └── index.ts
├── tests/
│   └── real-catalog.contract.test.mjs
├── .eslintrc.json
├── .gitignore
├── next-env.d.ts
├── next.config.ts
├── package.json
├── package-lock.json
├── README.md
├── RELATORIO_EXPANSAO_MOEDAS_BRASIL.md
└── tsconfig.json
```

## 3. Configuração, build e publicação

`next.config.ts` define:

- `output: "export"`;
- `trailingSlash: true`;
- `images.unoptimized: true`;
- `basePath` por `NEXT_PUBLIC_BASE_PATH`.

O workflow `.github/workflows/deploy-pages.yml` executa:

1. `npm ci`;
2. `npm run typecheck`;
3. `npm run lint`;
4. `npm run build` com base `/my-coins`;
5. publicação de `out/` no GitHub Pages.

Não existe servidor de aplicação, API, banco remoto ou segredo de runtime.

## 4. Rotas

| Rota | Tipo | Responsabilidade |
|---|---|---|
| `/` | cliente | início, progresso e atalhos por família |
| `/catalogo/` | cliente | pastas, busca, filtros e agrupamentos |
| `/colecao/` | cliente | moedas marcadas como possuídas |
| `/faltantes/` | cliente | moedas ausentes, busca e compartilhamento |
| `/ajustes/` | cliente | tema, backup, importação e limpeza |
| `/moeda/[id]/` | estática + cliente | detalhes e edição pessoal |

`generateStaticParams()` gera uma rota de detalhe para cada item de `coins`.
Na linha de base são 187 rotas.

`AppShell` fornece a navegação inferior entre Início, Catálogo, Coleção e
Ajustes. A página de faltantes é acessada por atalhos internos.

## 5. Tipos e arquivos de catálogo

`src/types/index.ts` concentra:

- `Family`: três grupos fixos do Real;
- `Coin`: catálogo e unidade colecionável;
- `CollectionItem`: posse e dados pessoais;
- `Settings`: tema e visualização;
- `BackupV1` e `BackupV2`: formatos JSON compatíveis.

`src/data/coins.ts` é a fonte de referência do catálogo:

- define tiragens regulares;
- gera moedas por ano com `regular()`;
- cria comemorativas com `commemorative()`;
- calcula especificações por família, valor e ano;
- acrescenta imagens com `officialImagesFor()`;
- gera `Catalog`, `CatalogEntry[]`, `familyNames` e `getCatalogEntry()`.

Granularidade atual:

```text
MonetarySystem → CoinType → CoinIssue → CollectionItem
```

O mesmo `CoinIssue.id` é:

- chave React;
- segmento da rota;
- argumento de `getCatalogEntry`;
- chave de `CollectionItem`;
- chave do object store IndexedDB.

Por isso, os 187 IDs existentes são um contrato de compatibilidade.

## 6. Imagens

`public/coins/bcb/` contém 76 WebP:

- 12 pares representativos das duas famílias regulares;
- 26 pares de emissões especiais/comemorativas.

As moedas regulares do mesmo valor/família reutilizam imagens. As
comemorativas usam pares próprios.

`src/data/coin-images.ts` resolve caminhos locais:

- regular: família + código da denominação;
- especial: lista fixa de IDs;
- resultado: `obverseImage` e `reverseImage`.

`scripts/fetch-coin-images.mjs`:

1. baixa imagens oficiais do BCB;
2. recorta as duas faces;
3. redimensiona para 320 × 320;
4. aplica máscara circular;
5. converte para WebP.

O script importa `sharp`, embora ele não esteja declarado diretamente em
`package.json`.

## 7. Contexto e fluxo de estado

`CollectionProvider`, em `src/context/CollectionContext.tsx`, expõe:

| Operação | Efeito |
|---|---|
| `toggle(id)` | alterna posse e ajusta quantidade |
| `save(item)` | persiste e atualiza o `Map` |
| `replace(items)` | substitui toda a coleção pessoal |
| `merge(items)` | mescla itens por `coinId` |
| `clear()` | apaga a coleção pessoal |
| `setSettings()` | persiste preferências |

Estado em memória:

```ts
Map<string, CollectionItem>
```

Inicialização:

1. lê coleção e configurações em paralelo;
2. indexa itens por `coinId`;
3. aplica o tema no elemento `<html>`;
4. expõe `loading`.

### Fluxo do checkbox

```text
CoinCard.coinToggle
    └── toggle(coinIssue.id)
          ├── consulta items.get(id)
          ├── inverte owned
          ├── define quantity >= 1 ou 0
          └── save(CollectionItem)
                ├── repository.save()
                └── atualiza Map por coinId
```

O detalhe usa a mesma cadeia e também permite editar quantidade, conservação,
data, preço e observações.

## 8. Armazenamento e IndexedDB

Implementação: `src/lib/database.ts`.

| Item | Valor |
|---|---|
| banco | `minha-colecao-moedas` |
| versão | `3` |
| store da coleção | `collection` |
| chave da coleção | `coinId` |
| store de configurações | `settings` |
| chave de configurações | `app` |
| store de metadados | `meta` |
| schema lógico | `2` |
| fallback localStorage | `minha-colecao-fallback-v1` |

O repositório abre uma conexão por operação e a fecha ao concluir a transação.
Se IndexedDB falhar, desativa seu uso durante a sessão e usa:

1. cópia em memória;
2. persistência serializada no `localStorage`.

`migrateCollectionItem()` normaliza registros lidos:

- valida `coinId`;
- recupera `quantity` ausente;
- limita condições aos valores conhecidos;
- valida preço, notas e datas;
- cria `updatedAt` padrão.

No upgrade para a versão 3, um cursor atualiza os registros dentro da própria
transação sem alterar `coinId`.

## 9. Backup

`src/lib/backup.ts` produz backup versão 2 e lê versões 1 e 2:

```ts
{
  version: 2,
  collectionSchemaVersion: 2,
  exportedAt: string,
  items: CollectionItem[],
  settings: Settings
}
```

A interface oferece:

- exportação JSON;
- importação com mesclagem;
- importação substitutiva;
- limpeza total com confirmação.

O catálogo não é incluído no backup; apenas dados pessoais e configurações.

## 10. Componentes principais

### Catálogo e moedas

- `CoinList`: lista de cartões e estado vazio.
- `CoinCard`: imagem, metadados, situação, botão de posse e link ao detalhe.
- `CoinGroups`: agrupa pelas seis denominações fixas do Real.
- `CoinDetail`: faces, ficha técnica e editor da coleção.

### Coleção

- `Summary`: totais, faltantes e percentual global.
- páginas `colecao` e `faltantes`: visões derivadas do catálogo + `Map`.

### Layout e infraestrutura

- `AppShell`: conteúdo e navegação inferior.
- `Header`: título e subtítulo.
- `ServiceWorker`: registro do service worker.
- `ClientDiagnostics`: diagnóstico de erros no cliente.
- `error.tsx` e `global-error.tsx`: limites de erro.

## 11. Busca, filtros, agrupamentos e estatísticas

Tudo é calculado em memória.

Busca:

- título;
- subtítulo;
- tema;
- ano;
- rótulo da denominação.

Filtros:

- todas, tenho, faltam;
- denominação;
- ano;
- família selecionada.

Ordenação:

- ano crescente/decrescente;
- valor crescente/decrescente;
- comemorativas primeiro.

Agrupamentos e estatísticas:

- três famílias fixas;
- seis denominações fixas;
- progresso global;
- progresso por família;
- contagem de moedas possuídas e faltantes.

## 12. PWA e funcionamento offline

`public/sw.js` usa:

- `networkFirst` para navegações;
- `cacheFirst` para recursos locais;
- cache principal versionado;
- pré-cache das rotas principais, manifesto e página offline;
- cache sob demanda das imagens e demais assets.

As rotas individuais de moeda não entram no `CORE`; ficam offline depois de
visitadas ou quando seus recursos já estiverem no cache.

## 13. Componentes reutilizáveis na expansão

Reutilizáveis sem mudança visual:

- `Header`;
- `AppShell`;
- estilos de cartões, chips, pastas e estados vazios;
- `ServiceWorker` e limites de erro;
- mecanismo de backup/importação;
- `CollectionProvider` como fachada;
- estratégias de busca/filtro em memória;
- `next/image` com `basePath`;
- padrões de `CoinList`, `CoinCard`, `CoinDetail` e `Summary`.

Reutilizáveis com generalização interna:

- `CoinGroups`: denominações dinâmicas;
- `CoinCard`: tipo versus emissão;
- `CoinDetail`: lista de anos/emissões;
- `Summary`: denominador por padrão;
- `formatting`: moedas anteriores ao Real;
- pastas do catálogo: padrão monetário antes da família;
- persistência: chave de emissão com compatibilidade de IDs antigos.

## 14. Acoplamentos ao Real

- união `Family` fixa;
- denominações numéricas limitadas;
- formatação sempre em `R$`;
- uma moeda por ano;
- tiragem única por registro;
- ano obrigatório;
- agrupamento fixo das seis denominações;
- textos e estatísticas do Real;
- imagens inferidas por família/valor;
- três coleções fixas no resumo;
- `coinId` usado simultaneamente para catálogo, rota e coleção.

## 15. Linha de base protegida por testes

A suíte `tests/real-catalog.contract.test.mjs` protege:

1. os 187 IDs atuais;
2. a geração de rota estática para cada ID;
3. a ligação do botão de posse ao `toggle(coin.id)`;
4. a persistência por `coinId` no IndexedDB;
5. as regras de quantidade ao marcar/desmarcar.

Execução:

```bash
npm run build
node --test tests/real-catalog.contract.test.mjs
```
