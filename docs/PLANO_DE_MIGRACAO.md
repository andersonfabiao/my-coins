# Plano de migração do catálogo
## 1. Objetivo

Expandir o catálogo do Real para moedas brasileiras históricas sem:

- perder IDs, checkboxes ou dados pessoais atuais;
- misturar catálogo institucional e coleção pessoal;
- depender do BCB em tempo de execução;
- abandonar a exportação estática ou a experiência PWA;
- apresentar dados não verificados como oficiais.

## 2. Princípios obrigatórios

1. Os 187 IDs atuais são imutáveis.
2. Toda versão antiga de backup continua importável.
3. Atualizar o catálogo nunca limpa a coleção.
4. Itens pessoais órfãos são preservados e diagnosticados.
5. O catálogo é estático, versionado e validado.
6. Importação do BCB ocorre somente no desenvolvimento.
7. Toda informação histórica registra proveniência.
8. Campos ausentes permanecem ausentes; não são inventados.
9. Tipo, emissão/ano e exemplar físico são conceitos distintos.
10. Cada fase precisa passar pelos testes de regressão do Real.

## 3. Arquitetura-alvo

```text
MonetarySystem
      └── CoinType
            └── CoinIssue
                  └── CollectionItem
                        └── Specimen (evolução futura)
```

- `MonetarySystem`: padrão monetário e vigência.
- `CoinType`: desenho, denominação e características comuns.
- `CoinIssue`: ano, código, casa cunhadora, tiragem e variante.
- `CollectionItem`: posse agregada de uma emissão.
- `Specimen`: peça física individual, opcional em fase futura.

## 4. Etapa 0 — congelar a linha de base

- manter o teste dos 187 IDs;
- gerar build e confirmar 187 rotas;
- guardar backups de teste contendo:
  - item antigo apenas com `owned`;
  - quantidade;
  - conservação;
  - preço/data;
  - notas;
  - item desmarcado;
- documentar banco, versão, stores e chave atual;
- registrar tamanho atual do catálogo, imagens e build;
- bloquear merge se algum ID existente desaparecer.

**Critério de saída:** suíte atual verde e fixtures revisadas.

## 5. Etapa 1 — definir contratos novos

Criar contratos para:

- `MonetarySystem`;
- `CoinFamily`/`Series`;
- `CoinType`;
- `CoinIssue`;
- metadados de fonte;
- categoria da moeda;
- status de verificação;
- alias/ID legado.

Decisões:

- denominação textual é obrigatória;
- valor numérico é opcional;
- especificações físicas são opcionais;
- datas usam ISO quando completas;
- ano isolado é número;
- texto original da fonte pode ser preservado;
- `CoinIssue.id` é a unidade colecionável.

**Critério de saída:** esquema documentado e validadores testados.

## 6. Etapa 2 — adaptar o Real sem mudar comportamento

- converter cada `Coin` atual em uma emissão compatível;
- manter exatamente seu `id`;
- criar tipos compartilhados para anos do mesmo desenho;
- preservar títulos, imagens e especificações;
- expor um adaptador com a visão antiga enquanto os componentes migram;
- comparar contagens, ordenação e conteúdo antes/depois.

**Critério de saída:**

- 187 IDs e 187 rotas;
- mesmos checkboxes e dados pessoais;
- mesma interface;
- build visualmente equivalente.

## 7. Etapa 3 — separar arquivos do catálogo

Estrutura sugerida:

```text
src/data/catalog/
├── monetary-systems.json
├── coin-types.json
├── coin-issues.json
├── legacy-id-map.json
└── catalog-meta.json
```

- catálogo contém apenas referência;
- IndexedDB contém apenas dados pessoais;
- metadados registram versão, fonte e data;
- aliases ficam versionados;
- validação rejeita IDs duplicados e relações quebradas.

**Critério de saída:** atualização do catálogo não escreve no IndexedDB.

## 8. Etapa 4 — compatibilidade de persistência

Opção preferida:

- manter IDs atuais como IDs das emissões do Real;
- novos registros usam a convenção nova;
- não reescrever chaves existentes.

Se uma troca de chave for inevitável:

1. aumentar `DB_VERSION`;
2. abrir transação de upgrade;
3. resolver cada ID pelo mapa legado;
4. gravar a nova chave;
5. verificar o registro;
6. remover a antiga apenas dentro da mesma transação;
7. manter itens não resolvidos;
8. registrar diagnóstico.

Adicionar testes para:

- IndexedDB versão 2 → nova versão;
- fallback `localStorage` V1;
- coleção vazia e preenchida;
- falha/interrupção de migração;
- item órfão;
- mesclagem de backup.

**Critério de saída:** zero perda em todos os cenários.

## 9. Etapa 5 — versionar o backup

- criar `BackupV2`;
- manter `parseBackup` compatível com V1;
- converter `coinId` antigo em `issueId` sem apagar o original até validar;
- exportar metadados de versão do catálogo;
- nunca exigir que o catálogo do backup seja igual ao instalado;
- oferecer relatório de itens não reconhecidos.

**Critério de saída:** backups V1 e V2 importam e reexportam corretamente.

## 10. Etapa 6 — generalizar formatação e navegação

- formatar denominação por padrão monetário;
- remover lista fixa de valores;
- incluir seletor de padrão;
- manter família/série como segundo nível;
- permitir período, categoria, valor, tenho e faltam;
- buscar por título, tema, ano, código e denominação;
- definir progresso por emissão e, opcionalmente, por tipo.

**Critério de saída:** Real permanece idêntico e padrão histórico piloto navega.

## 11. Etapa 7 — generalizar componentes

Ordem recomendada:

1. camada de consulta do catálogo;
2. `CoinGroups`;
3. `CoinCard`;
4. `CoinDetail`;
5. `Summary`;
6. páginas de catálogo, coleção e faltantes;
7. página inicial.

Manter contratos de apresentação simples:

- cartão recebe uma visão pronta;
- detalhe recebe tipo + emissões;
- componentes não conhecem o formato bruto importado;
- persistência recebe somente ID de emissão.

**Critério de saída:** componentes não contêm listas fixas do Real.

## 12. Etapa 8 — criar importador do BCB

Criar script separado, sem uso em runtime:

```text
scripts/import-bcb-coins.mjs
```

Pipeline:

1. obter página com timeout e cache;
2. detectar padrões e links de modal;
3. coletar com baixa concorrência;
4. preservar snapshot bruto;
5. extrair tabelas e descrições;
6. normalizar números, datas e unidades;
7. separar tipo e emissões;
8. gerar IDs determinísticos;
9. validar duplicidades;
10. gerar relatório de inconsistências;
11. comparar com catálogo anterior;
12. exigir revisão antes da publicação.

O script deve:

- ser idempotente;
- ter modo offline sobre snapshot;
- não apagar registros silenciosamente;
- registrar URL, data e checksum;
- não baixar imagens por padrão.

**Critério de saída:** duas execuções sobre a mesma fonte geram saída idêntntica.

## 13. Etapa 9 — estratégia de imagens

Adotar pipeline híbrido:

- URL oficial e crédito nos metadados;
- cópia local para o app;
- WebP ou AVIF com miniatura e versão de detalhe;
- checksum e dimensões;
- placeholder para imagem ausente;
- revisão de direitos e atribuição;
- orçamento máximo de assets por lote.

Não usar hotlink no app instalado.

**Critério de saída:** padrão piloto funciona completamente offline.

## 14. Etapa 10 — prova de conceito

Usar preferencialmente Cruzeiro Real:

- apenas quatro tipos na página do BCB;
- vigência curta;
- volume pequeno para revisar manualmente.

Validar:

- importação;
- tipo versus emissão;
- imagens;
- busca e filtros;
- rota estática;
- posse;
- backup;
- offline;
- desempenho no iPhone.

**Critério de saída:** lote revisado, testes verdes e nenhuma regressão do Real.

## 15. Etapa 11 — expansão progressiva

Ordem sugerida:

1. Cruzeiro Real;
2. Cruzeiro 1990;
3. Cruzado Novo;
4. Cruzado;
5. Cruzeiro 1970;
6. Cruzeiro Novo;
7. Cruzeiro 1942 conforme cobertura oficial disponível;
8. comemorativas em pipeline próprio.

Para cada lote:

- importar;
- revisar campos;
- comparar tipos repetidos;
- revisar continuidade entre padrões;
- validar imagens;
- rodar testes;
- gerar relatório de cobertura.

## 16. Etapa 12 — cobertura complementar

A página do BCB não contém todas as moedas de 1942. Antes de declarar cobertura
total:

- localizar fonte oficial para emissões do Tesouro Nacional;
- registrar fonte por item/campo;
- diferenciar dados oficiais de referências complementares;
- não misturar variantes numismáticas sem taxonomia;
- rotular escopo institucional versus numismático.

## 17. Etapa 13 — estatísticas e exemplares

Depois da base histórica:

- progresso por padrão;
- progresso por tipo;
- progresso por emissão/ano;
- quantidade total de exemplares;
- totais por período e categoria;
- filtros de conservação;
- modelo `Specimen` se peças individuais precisarem de condições/notas distintas.

## 18. Estratégia de testes

### Contratos permanentes

- todos os 187 IDs legados continuam presentes;
- cada ID legado gera rota;
- IDs novos são únicos;
- toda emissão referencia tipo existente;
- toda imagem local existe;
- todo item da coleção resolve ou é marcado como órfão;
- checkbox persiste pela mesma chave;
- backup V1 continua importável.

### Testes unitários

- normalização de unidades;
- parsing de datas/tiragens;
- geração de IDs;
- aliases;
- migração de backup;
- migração de IndexedDB;
- filtros e estatísticas.

### Testes de integração

- catálogo → rota;
- botão → contexto → repositório;
- reload → estado preservado;
- IndexedDB indisponível → fallback;
- importação mesclar/substituir;
- PWA offline.

### Testes visuais/manuais

- iPhone/Safari;
- tema claro/escuro;
- textos longos;
- imagens ausentes;
- detalhe com muitos anos;
- safe areas;
- catálogo grande.

## 19. Alterações futuras prováveis

Arquivos existentes:

```text
src/types/index.ts
src/data/coins.ts
src/data/coin-images.ts
src/lib/formatting.ts
src/lib/database.ts
src/lib/backup.ts
src/context/CollectionContext.tsx
src/app/page.tsx
src/app/catalogo/page.tsx
src/app/colecao/page.tsx
src/app/faltantes/page.tsx
src/app/moeda/[id]/page.tsx
src/components/coins/CoinGroups.tsx
src/components/coins/CoinCard.tsx
src/components/coins/CoinDetail.tsx
src/components/collection/Summary.tsx
src/app/globals.css
public/sw.js
```

Arquivos novos prováveis:

```text
src/data/catalog/*
src/lib/catalog.ts
src/lib/catalog-validation.ts
scripts/import-bcb-coins.mjs
tests/fixtures/*
tests/catalog/*
tests/migrations/*
```

## 20. Gates antes de cada entrega

```text
[ ] 187 IDs legados presentes
[ ] 187 rotas legadas acessíveis
[ ] checkbox marca e desmarca
[ ] estado persiste após reload
[ ] backup V1 importa
[ ] nenhum item pessoal é apagado
[ ] IDs novos são únicos
[ ] catálogo valida
[ ] imagens do lote existem
[ ] build estático conclui
[ ] PWA offline validada
[ ] relatório de fonte/cobertura atualizado
```
