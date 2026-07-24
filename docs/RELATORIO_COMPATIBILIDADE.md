# Relatório de compatibilidade — modelo híbrido definitivo

**Data:** 24/07/2026
**Escopo:** substituição definitiva do modelo `Coin`, sem inclusão de moedas
históricas e sem mudança perceptível para o usuário.

## 1. Resultado

O modelo plano `Coin` foi removido. Toda a aplicação usa agora:

```text
MonetarySystem
      ↓
CoinType
      ↓
CoinIssue
      ↓
CollectionItem
```

As telas recebem uma `CatalogEntry`, composição explícita que mantém juntas as
três entidades de catálogo sem duplicar seus campos:

```ts
interface CatalogEntry {
  monetarySystem: MonetarySystem;
  coinType: CoinType;
  coinIssue: CoinIssue;
}
```

Não existe mais visão `Coin[]`, `getCoin()` nem adaptador legado.

## 2. Responsabilidade de cada modelo

### MonetarySystem

Representa o padrão monetário:

```text
id: br-real-1994
nome: Real brasileiro
símbolo: R$
vigência inicial: 1994-07-01
```

### CoinType

Representa características compartilhadas do tipo:

- padrão monetário;
- família;
- denominação;
- rótulo do valor;
- classificação regular/comemorativa;
- imagens de anverso e reverso.

### CoinIssue

Representa a emissão colecionável:

- ID;
- vínculo com `CoinType`;
- ano;
- título;
- tiragem;
- material e especificações variáveis;
- tema, evento e notas.

O ID de cada emissão do Real é exatamente o ID usado anteriormente.

### CollectionItem

Representa os dados pessoais da emissão:

- `coinId`, tipado como `CoinIssue["id"]`;
- posse;
- quantidade;
- conservação;
- aquisição;
- observações;
- data de atualização.

O nome persistido `coinId` foi preservado para manter compatibilidade binária
com IndexedDB, `localStorage` e backups existentes. Seu valor é o ID da
`CoinIssue`.

## 3. Fluxo atual

```text
realCatalogSources
        │
        ▼
createCatalog()
        ├── monetarySystems
        ├── coinTypes
        └── coinIssues
                │
                ▼
createCatalogEntries()
                │
                ▼
páginas e componentes
                │
                ▼
CollectionItem por coinIssue.id
```

`CoinCatalogSource` existe somente como formato privado de entrada para
converter a base estática atual. Ele não é consumido pelas telas.

## 4. Aplicação migrada

Os seguintes fluxos usam diretamente `CatalogEntry`:

- página inicial;
- pastas do catálogo;
- busca;
- filtros;
- ordenação;
- agrupamentos;
- coleção;
- faltantes;
- resumo e estatísticas;
- geração de rotas;
- cartão;
- detalhe;
- resolução de imagens.

Uso dos campos:

```text
entry.monetarySystem  → padrão monetário
entry.coinType        → família, denominação e imagens
entry.coinIssue       → ID, ano, título, tiragem e detalhes
```

## 5. Compatibilidade de IDs e rotas

Antes e depois:

```text
IDs do Real: 187
IDs únicos: 187
CoinIssues: 187
rotas /moeda/[id]/: 187
```

Resultado:

```text
IDs removidos: 0
IDs renomeados: 0
IDs duplicados: 0
rotas removidas: 0
moedas históricas adicionadas: 0
```

`generateStaticParams()` usa diretamente `catalogEntries` e
`coinIssue.id`. `getCatalogEntry(id)` resolve o detalhe pelo mesmo ID.

## 6. Compatibilidade dos checkboxes

O fluxo atual é:

```text
CoinCard
  → toggle(coinIssue.id)
  → CollectionContext
  → save(CollectionItem)
  → repository.save()
  → IndexedDB store "collection", keyPath "coinId"
```

As regras permanecem:

- marcar define `owned = true`;
- quantidade mínima ao marcar é 1;
- desmarcar define quantidade 0;
- `aria-pressed` continua refletindo a posse;
- o estado continua indexado pelo mesmo ID.

Foi adicionada uma migração transacional e idempotente para os registros
existentes.

## 7. Persistência versionada e preservada

Versões atuais:

```text
DB_NAME: minha-colecao-moedas
DB_VERSION: 3
store: collection
keyPath: coinId
fallback: minha-colecao-fallback-v1
schema lógico da coleção: 2
backup exportado: versão 2
backups aceitos: versões 1 e 2
```

No upgrade para o IndexedDB 3:

1. o store `collection` mantém `keyPath: "coinId"`;
2. cada registro é lido por cursor na transação de upgrade;
3. checkbox, quantidade, conservação, aquisição e observações são
   normalizados e preservados;
4. o registro recebe `schemaVersion: 2`;
5. o novo store `meta` registra `collectionSchemaVersion`;
6. a transação só conclui após o cursor terminar.

O fallback mantém a chave histórica no `localStorage`, lê o formato anterior e
passa a persistir `schemaVersion: 2`.

O backup V2 acrescenta `collectionSchemaVersion`. `parseBackup()` aceita V1 e
V2 e sempre converte para o contrato atual antes de mesclar ou substituir.

## 8. Compatibilidade visual e navegação

A identidade visual iOS foi mantida e a navegação do catálogo passou a
refletir o domínio:

```text
Brasil
  → Real brasileiro
    → Família
      → Moeda (CoinType)
        → Emissões (CoinIssue)
```

Foram mantidos:

- mesmos textos;
- mesma estrutura visual;
- mesmas classes CSS;
- mesmos caminhos de imagem;
- mesmas famílias;
- filtros e ordenação no nível de emissões;
- mesmos totais;
- mesmos links;
- mesmos estados de posse;
- mesmo editor do exemplar;
- mesmo PWA.

Não foram alterados CSS, manifest, service worker ou imagens. IndexedDB e
backup receberam apenas versionamento e migração compatível.

## 9. Arquivos principais da migração

Modelos:

```text
src/types/index.ts
```

Construção e consulta do domínio:

```text
src/domain/catalog.ts
src/data/coins.ts
src/data/coin-images.ts
```

Consumidores migrados:

```text
src/app/page.tsx
src/app/catalogo/page.tsx
src/app/colecao/page.tsx
src/app/faltantes/page.tsx
src/app/moeda/[id]/page.tsx
src/components/coins/CoinCard.tsx
src/components/coins/CoinDetail.tsx
src/components/coins/CoinGroups.tsx
src/components/coins/CoinList.tsx
src/components/collection/Summary.tsx
src/context/CollectionContext.tsx
src/lib/collection-migrations.ts
src/lib/database.ts
src/lib/backup.ts
```

## 10. Validações executadas

```text
npm.cmd run typecheck
npm.cmd run build
node --test tests/real-catalog.contract.test.mjs
```

Resultados:

```text
TypeScript: aprovado
build Next.js: aprovado
páginas estáticas: 195
rotas de moedas: 187
testes: 13 aprovados, 0 falhas
```

Os testes verificam:

1. os 187 IDs legados;
2. as 187 rotas;
3. ausência do modelo `Coin`;
4. presença do modelo híbrido;
5. composição de `CatalogEntry`;
6. emissão como unidade colecionável;
7. rota baseada em `coinIssue.id`;
8. checkbox baseado em `coinIssue.id`;
9. persistência pelo mesmo `coinId`.
10. migração de registros sem `quantity`;
11. preservação de checkbox, quantidade, estado e observações;
12. leitura e conversão de backups V1;
13. leitura de backups V2;
14. rejeição segura de versões desconhecidas;
15. upgrade transacional do IndexedDB.
16. presença dos cinco níveis da navegação visual.

## 11. Garantias finais

| Garantia | Resultado |
|---|---|
| modelo `Coin` removido | confirmado |
| aplicação usa modelo híbrido | confirmado |
| nenhuma moeda histórica incluída | confirmado |
| IDs preservados | 187/187 |
| rotas preservadas | 187/187 |
| checkboxes preservados | confirmado |
| coleção local preservada | confirmada pelo upgrade V2 → V3 |
| backup antigo preservado | leitura V1 confirmada |
| novo backup versionado | V2 confirmado |
| comportamento visual preservado | confirmado |
