# Relatório técnico — expansão do catálogo para moedas brasileiras desde 1942

**Data da análise:** 24/07/2026
**Escopo:** diagnóstico e proposta; nenhuma expansão ou alteração funcional foi implementada.
**Fonte institucional principal analisada:** [Moedas produzidas — Banco Central do Brasil](https://www.bcb.gov.br/cedulasemoedas/moedasemitidas).

## 1. Resumo executivo

A expansão é **tecnicamente viável, com ressalvas**, mantendo a aplicação, a identidade visual, o PWA e a mesma tecnologia. A estrutura atual, porém, não deve simplesmente receber centenas de registros históricos no formato existente: ela representa cada moeda do Real diretamente como uma combinação de família, valor e ano e usa o mesmo `coin.id` tanto para identificar o catálogo quanto para indexar a posse do usuário.

A recomendação é um **modelo híbrido**:

1. `CoinType`: o desenho/tipo da moeda, com padrão monetário, família, denominação, características e imagens;
2. `CoinIssue`: cada emissão/ano/código oficial/tiragem vinculada ao tipo;
3. `CollectionItem`: dados pessoais vinculados à emissão, permitindo posse, quantidade, conservação e observações.

Os IDs atuais do Real devem permanecer válidos. A primeira migração deve criar uma tabela explícita entre os IDs antigos e as novas emissões ou, preferencialmente, usar os IDs atuais como `legacyId`/ID da emissão do Real. Assim, as chaves já armazenadas no IndexedDB continuam sendo encontradas e nenhum checkbox é perdido.

A página do BCB é útil como catálogo institucional de tipos emitidos pelo próprio Banco Central, mas não é uma API estável nem um catálogo numismático completo. A inspeção encontrou 8 padrões monetários, 12 seções quando famílias internas são contadas e 78 fichas modais. O BCB declara expressamente que, para o Cruzeiro de 1942, mostra apenas as três últimas moedas daquele padrão, emitidas pelo Banco Central; as anteriores foram emitidas pelo Tesouro Nacional. Portanto, a página não basta, isoladamente, para prometer “todas as moedas brasileiras desde 1942”.

## 2. Situação atual do projeto

### 2.1 Stack e arquitetura

- Next.js 15.2, React 19 e TypeScript 5.7.
- App Router em `src/app`.
- Exportação estática (`output: "export"`) e imagens sem otimizador de servidor.
- PWA manual: `manifest.webmanifest`, service worker em `public/sw.js` e página offline.
- Sem backend e sem autenticação.
- Catálogo de referência compilado com a aplicação.
- Dados pessoais locais em IndexedDB, com fallback em `localStorage`.
- Componentes divididos entre moedas, coleção, layout e UI.
- Não há banco relacional, ORM nem API própria.

Organização relevante:

```text
src/
├── app/                  rotas e páginas
├── components/
│   ├── coins/            lista, grupos, cartão e detalhe
│   ├── collection/       resumo/progresso
│   ├── layout/           shell e navegação
│   └── ui/               cabeçalho
├── context/              estado da coleção
├── data/                 catálogo e resolução de imagens
├── lib/                  IndexedDB, backup e formatação
└── types/                contratos TypeScript
public/
├── coins/bcb/            imagens WebP locais
├── icons/
├── manifest.webmanifest
├── offline.html
└── sw.js
scripts/
└── fetch-coin-images.mjs
```

### 2.2 Fluxo de dados atual

```text
src/data/coins.ts (catálogo estático)
          │
          ├── páginas, filtros, grupos, estatísticas e detalhes
          │
          └── coin.id
                │
                └── CollectionItem.coinId
                      └── IndexedDB/localStorage/backup JSON
```

Essa separação entre catálogo e dados pessoais já existe conceitualmente e é um ponto forte. O acoplamento problemático está na granularidade e na identidade: um registro `Coin` atual é simultaneamente tipo, ano de emissão e unidade colecionável.

## 3. Estrutura atual dos dados

### 3.1 Catálogo do Real

O catálogo está em `src/data/coins.ts`. Ele é gerado em memória a partir de:

- tabelas de tiragem por família, ano e denominação;
- funções `regular()` e `commemorative()`;
- listas de anos;
- especificações técnicas;
- registros especiais e comemorativos declarados individualmente;
- associação final de imagens por `officialImagesFor()`.

O contrato atual em `src/types/index.ts` é:

```ts
interface Coin {
  id: string;
  family: "primeira-familia" | "segunda-familia" | "comemorativa";
  denomination: 0.01 | 0.05 | 0.1 | 0.25 | 0.5 | 1;
  denominationLabel: string;
  year: number;
  title: string;
  subtitle?: string;
  commemorative: boolean;
  theme?: string;
  event?: string;
  mintage?: number | null;
  material?: string;
  diameterMm?: number | null;
  weightGrams?: number | null;
  edge?: string;
  obverseImage?: string;
  reverseImage?: string;
  notes?: string;
}
```

### 3.2 Imagens

- Cópias locais otimizadas ficam em `public/coins/bcb/`.
- `src/data/coin-images.ts` converte o ID/família/denominação em caminhos de anverso e reverso.
- Moedas regulares da mesma família e denominação reutilizam uma fotografia representativa; comemorativas têm imagens próprias.
- `scripts/fetch-coin-images.mjs` registra URLs oficiais, baixa uma imagem combinada, separa as faces, aplica máscara circular e produz WebP de 320 × 320.
- `next/image` exibe os arquivos com `basePath`, importante para hospedagem estática em subdiretório.
- O service worker guarda recursos locais sob demanda com estratégia `cacheFirst`.

Observação técnica: o script importa `sharp`, mas `sharp` não aparece como dependência direta em `package.json`; atualmente ele pode estar disponível apenas como dependência transitiva do Next.js. Um futuro importador não deve depender implicitamente disso.

### 3.3 “Tenho/não tenho” e persistência

`CollectionContext` mantém um `Map<string, CollectionItem>` indexado por `coinId`.

- `toggle(id)` alterna `owned`;
- ao marcar, garante quantidade mínima 1;
- ao desmarcar, define quantidade 0;
- `CoinCard` e `CoinDetail` consultam `items.get(coin.id)`;
- o detalhe permite quantidade, conservação, data/preço de aquisição e notas.

`CollectionItem` já contém:

```ts
interface CollectionItem {
  coinId: string;
  owned: boolean;
  quantity: number;
  condition?: Condition;
  acquisitionDate?: string;
  acquisitionPrice?: number | null;
  personalNotes?: string;
  updatedAt: string;
}
```

O repositório usa IndexedDB:

- banco `minha-colecao-moedas`;
- versão 2;
- object store `collection`, chave `coinId`;
- object store `settings`;
- fallback `minha-colecao-fallback-v1` no `localStorage`;
- cópia em memória durante a sessão.

O backup JSON é versão 1 e contém `items` e `settings`. Importação pode mesclar ou substituir. Os validadores já normalizam campos antigos sem `quantity`, o que mostra um precedente útil para migrações aditivas.

### 3.4 Busca, filtros, agrupamentos e estatísticas

- Busca textual por título, subtítulo, tema, ano e rótulo da denominação.
- Filtro por situação: todas, tenho, faltam.
- Filtro por valor e por ano.
- Ordenação por ano, valor ou comemorativas primeiro.
- Navegação inicial por três famílias do Real.
- Agrupamento interno por uma lista fixa de denominações do Real.
- Totais e percentuais globais e por família.
- Página separada de faltantes, com busca, copiar e compartilhar.

Tudo é calculado em memória sobre o array estático `coins`. Para algumas centenas ou poucos milhares de emissões isso continua adequado no dispositivo; imagens, não o JSON, serão o principal impacto de tamanho.

## 4. Como funciona a página do Banco Central

### 4.1 Implementação observada

A página é uma aplicação Angular, carregada por módulos JavaScript com nomes versionados. O conteúdo aparece em elementos próprios, como:

- `bcbmainview`;
- `bcb-editorconteudo`;
- `bcb-modal`;
- `bcb-accordion`;
- `promise`.

O HTML montado no cliente contém as seções, imagens e links ocultos com o parâmetro `modalAberto`. Por exemplo:

```text
/cedulasemoedas/moedasemitidas
  ?modalAberto=moeda_primeiro_cruzeiro_CrS10_00
```

Ao abrir essa URL, o cliente monta uma ficha modal com uma tabela. Na amostra “10 cruzeiros” do Cruzeiro de 1942, foram observados:

- valor facial;
- período de circulação;
- diâmetro;
- peso;
- espessura;
- material;
- ano da produção, código oficial e tiragem;
- descrição do anverso;
- descrição do reverso.

Não foi identificada, na interface ou nos recursos diretamente expostos, uma API pública ou um arquivo JSON documentado para esse catálogo. O conteúdo parece ser administrado em CMS: o markup inclui uma URL editorial sob `/content/cedulasemoedas/Lists/.../AllItems.aspx`. Isso sugere fragmentos editoriais estruturados apenas parcialmente, não um contrato de dados público.

### 4.2 Organização e carregamento

- Uma única página carrega todos os grupos e 78 entradas de tipo.
- Não foi observada paginação.
- As fichas são modais abertas no cliente; links com `modalAberto` permitem endereçar uma ficha.
- Os detalhes têm tabelas sem um esquema formal e precisam ser normalizados.
- As imagens usam caminhos públicos relativos sob `/content/cedulasemoedas/cedulas_e_moedas/moedasemitidasbc/`.
- Os nomes variam em maiúsculas/minúsculas e padrão (`M75Fv.JPG`, `m40fv.jpg`, `001_Cr70-1-1.jpg`), o que impede inferência segura por convenção.
- As URLs parecem arquivos públicos permanentes do CMS, sem token ou expiração. Ainda assim, não são uma API com garantia contratual e podem mudar.

### 4.3 Qualidade e suficiência

A fonte é boa para:

- estrutura institucional dos padrões monetários;
- tipos reconhecidos pelo BCB;
- características físicas;
- períodos;
- imagens institucionais;
- código e tiragem por ano quando informados;
- notas sobre continuidade entre padrões e casas cunhadoras.

Ela não é suficiente, sozinha, para:

- todas as moedas do padrão Cruzeiro iniciado em 1942;
- catálogo numismático completo;
- provas, ensaios, erros, cunhos e variantes especializadas;
- garantia de todos os anos/casas cunhadoras em um formato uniforme;
- atualização automatizada confiável sem validação humana.

## 5. Cobertura identificada

Grupos confirmados diretamente na fonte:

| Padrão/seção | Vigência informada pelo BCB | Entradas visuais |
|---|---:|---:|
| Real — 2ª família | desde 01/07/1994 | 6 |
| Real — 1ª família | desde 01/07/1994 | 6 |
| Cruzeiro Real | 01/08/1993–30/06/1994 | 4 |
| Cruzeiro (1990) | 16/03/1990–31/07/1993 | 10 |
| Cruzado Novo | 16/01/1989–15/03/1990 | 6 |
| Cruzado | 28/02/1986–15/01/1989 | 11 |
| Cruzeiro (1970) — 2ª família | 15/05/1970–27/02/1986 | 11 |
| Cruzeiro (1970) — 1ª família | mesma vigência | 14 |
| Cruzeiro Novo | 13/12/1967–14/05/1970 | 6 |
| Cruzeiro (1942), somente emissões do BCB exibidas | 01/11/1942–12/12/1967 | 3 |
| **Total** | 8 padrões, com famílias internas | **77 imagens / 78 fichas** |

A diferença entre imagens e fichas decorre de uma entrada/variação adicional endereçada por modal.

Notas importantes da própria fonte:

- No Cruzeiro de 1942, o Banco Central “emitiu apenas as três últimas moedas desse padrão”; as anteriores foram emitidas pelo Tesouro Nacional.
- Moedas do Cruzeiro Novo continuaram circulando e tiveram novas cunhagens no Cruzeiro de 1970.
- O Cruzeiro de 1970 informa continuidade de moedas criadas em 1968, alterando apenas a data.
- Há denominações repetidas no mesmo padrão com fichas separadas, indicando mudança de tipo, desenho ou série.
- Há códigos sequenciais institucionais e notas específicas sobre letras de casas cunhadoras.

### 5.1 Comuns, comemorativas e variantes

A página principal analisada é “Moedas produzidas” e organiza principalmente moedas por padrão, família e tipo. Moedas comemorativas aparecem em área/página institucional própria e já são usadas pelo projeto atual, mas não formam uma taxonomia integrada e uniforme nesta página histórica.

A fonte mostra:

- mudanças de família e desenho;
- repetição de denominação com fichas diferentes;
- materiais e dimensões por ficha;
- produção/tiragem potencialmente com vários anos na mesma célula;
- continuidade de moedas entre padrões;
- casas cunhadoras em observações;
- tipos especiais de circulação.

Não se deve inferir que ela inclua provas, ensaios, erros ou todas as variantes numismáticas. A letra de casa cunhadora é um atributo de emissão/variante, não necessariamente um novo tipo visual.

## 6. Viabilidade técnica

### 6.1 O que pode ser reutilizado sem alteração conceitual

- Next.js/React/TypeScript e exportação estática.
- PWA, manifest, layout mobile-first e navegação inferior.
- `CollectionProvider` como ponto de acesso à coleção.
- IndexedDB com fallback local.
- backup/importação, desde que ganhe uma nova versão compatível.
- `Header`, estados vazios e componentes básicos de UI.
- `CoinCard`, `CoinList`, `CoinDetail` e `Summary` como desenho/experiência, após receberem tipos mais gerais.
- estratégia de imagens locais e uso de `basePath`.
- busca e filtros em memória.

### 6.2 Partes excessivamente ligadas ao Real

- `Family` é união fixa de três valores do Real.
- `denomination` aceita somente seis valores decimais do Real.
- `denominationOrder` é fixo em `[0.01, 0.05, 0.1, 0.25, 0.5, 1]`.
- `familyNames` e as três pastas visuais são específicas do Real.
- `technicalSpecs()` contém regras exclusivas das duas famílias do Real.
- IDs regulares derivam de `family-denomination-year`.
- `Coin.year` é obrigatório e único.
- `Coin.mintage` supõe uma tiragem por registro.
- `commemorative: boolean` não cobre bem “especial”, prova ou categoria futura.
- funções de formatação assumem reais/centavos.
- textos “Sua coleção do Real Brasileiro” e “Valor” pressupõem um único padrão.
- estatísticas são por família, não por padrão monetário.
- grupos e filtros usam igualdade numérica de denominação sem unidade monetária.
- imagens regulares são inferidas por família/denominação do Real.

### 6.3 Componentes a generalizar

| Área | Mudança necessária |
|---|---|
| Tipos | introduzir padrão, tipo e emissão |
| Catálogo | separar dados gerais dos dados por ano/código/tiragem |
| Formatação | usar moeda/padrão e rótulos, não somente número em reais |
| Navegação | padrão → família/série → denominação/tipos |
| Filtros | padrão, período, categoria, valor textual/normalizado, posse |
| Cartão/detalhe | receber `CoinType` + emissão selecionada/agregada |
| Agrupamento | deixar de usar lista fixa de seis denominações |
| Estatísticas | progresso por padrão e por escopo de emissão |
| Persistência | chavear coleção pela unidade colecionável (emissão) |
| Backup | versão 2 com leitura integral da versão 1 |
| Imagens | manifesto explícito por tipo; não inferir nomes |

## 7. Limitações da fonte

1. Aplicação dependente de JavaScript e componentes próprios.
2. Estrutura editorial pode mudar sem aviso.
3. Não há API pública/documentada identificada para este catálogo.
4. Campos estão em tabelas/HTML, não em um esquema garantido.
5. Nomes de arquivos e capitalização são inconsistentes.
6. Algumas informações aparecem em texto livre e notas de rodapé.
7. Anos, códigos e tiragens podem compartilhar uma célula e exigir parsing.
8. O conceito de ficha é “tipo institucional”, não necessariamente “moeda-ano”.
9. Moedas reaproveitadas atravessam padrões, exigindo relações explícitas.
10. A cobertura de 1942 é incompleta para o objetivo amplo.
11. Comemorativas estão separadas e podem seguir outra estrutura.
12. Não há garantia de provas, ensaios, variantes, erros ou raridades.
13. Imagens públicas não têm garantia de URL permanente.
14. Termos de uso, atribuição e licença específica das imagens devem ser verificados antes de redistribuição em escala.

**Distinção necessária:** o produto poderá ser um catálogo institucional das emissões documentadas pelo BCB. Para ser um catálogo numismático detalhado, precisará de fontes complementares claramente identificadas, revisão especializada e metadados de proveniência por campo.

## 8. Comparação dos modelos de catalogação

| Critério | A — um registro por tipo | B — um registro por ano | C — híbrido |
|---|---|---|---|
| Interface | simples e compacta | longa/repetitiva | compacta, com expansão por ano |
| Volume de registros | menor | maior | controlado |
| Dados físicos/desenho | sem duplicação | muito duplicados | sem duplicação |
| Tiragem/código por ano | arrays complexos | natural | natural em `CoinIssue` |
| Posse por ano | exige subestrutura | direta | direta |
| Quantidade/conservação | difícil sem coleção secundária | direta | direta e extensível |
| Filtros por ano | possível, mais complexo | simples | simples |
| Estatísticas | ambíguas: tipos ou anos? | claras por ano | permite ambas |
| Atualização do catálogo | simples, mas arrays frágeis | muitos registros | granular e idempotente |
| Compatibilidade BCB | próxima das fichas/tipos | exige explodir tabelas | preserva ficha e explode emissões |
| Manutenção | boa no início | duplicação crescente | melhor no longo prazo |
| Migração do Real | exige adaptação | próxima do modelo atual | permite mapear cada ID atual a uma emissão |

### Recomendação

Adotar o **Modelo C — híbrido**. Ele representa fielmente a fonte (ficha/tipo com várias linhas de produção), preserva a experiência de pastas e cartões, e mantém a posse na unidade que interessa ao colecionador: ano/emissão/variante.

As estatísticas devem declarar o denominador:

- “tipos conhecidos” para visão histórica;
- “emissões/anos no catálogo” para progresso da coleção;
- opcionalmente, “exemplares possuídos” para quantidade física.

## 9. Modelagem de dados recomendada

A interface sugerida no pedido é um bom ponto de partida, mas mistura tipo e emissão. Recomenda-se:

```ts
interface MonetarySystem {
  id: string;                    // ex.: "br-real-1994"
  name: string;
  symbol?: string;
  validFrom?: string;
  validTo?: string;
  notes?: string;
  sourceUrl: string;
}

interface CoinType {
  id: string;                    // estável, sem ano
  monetarySystemId: string;
  familyId?: string;
  seriesId?: string;

  denominationText: string;      // preserva "Cr$ 10,00"
  denominationMinorUnits?: number;
  currencyName: string;
  currencySymbol?: string;

  title: string;
  subtitle?: string;
  category: "circulation" | "commemorative" | "special";

  material?: string;
  composition?: string;
  weightGrams?: number;
  diameterMm?: number;
  thicknessMm?: number;
  edge?: string;
  shape?: string;

  obverseDescription?: string;
  reverseDescription?: string;
  obverseImage?: string;
  reverseImage?: string;

  sourceUrl: string;
  imageSourceUrl?: string;
  sourceRetrievedAt?: string;
  notes?: string;
}

interface CoinIssue {
  id: string;                    // unidade colecionável
  coinTypeId: string;
  year?: number;
  productionCode?: string;       // ex.: "Cr42-107"
  mintMark?: string;
  mintage?: number | null;
  circulationFrom?: string;
  circulationTo?: string;
  variantLabel?: string;
  legacyCoinId?: string;         // IDs atuais do Real
  notes?: string;
}

interface CollectionItemV2 {
  issueId: string;
  owned: boolean;
  quantity: number;
  condition?: Condition;
  acquisitionDate?: string;
  acquisitionPrice?: number | null;
  personalNotes?: string;
  updatedAt: string;
}
```

### 9.1 Campos atuais preserváveis

- `id`, mas com significado explícito e sem alterar IDs existentes na migração;
- título, subtítulo, tema/evento (tema pode virar tag);
- material, diâmetro, peso, bordo;
- imagens e notas;
- ano e tiragem, movidos para `CoinIssue`;
- todos os campos de `CollectionItem`.

### 9.2 Campos novos

- `monetarySystemId`;
- `familyId`/`seriesId` generalizados;
- denominação textual e moeda/símbolo;
- categoria com três ou mais valores;
- espessura, forma, composição;
- descrições das faces;
- código de produção e marca de casa cunhadora;
- período de circulação;
- proveniência, data de coleta e URL original da imagem;
- `legacyCoinId`;
- indicador de qualidade/verificação opcional.

### 9.3 Campos opcionais

Devem ser opcionais todos os campos não garantidos pela fonte: família, série, valor normalizado, símbolo, datas, ano, tiragem, código, marca, especificações físicas, descrições, imagens, variante e notas. `title`, `denominationText`, `currencyName`, padrão, categoria e proveniência devem ser obrigatórios no tipo.

### 9.4 IDs estáveis e duplicidades

- Usar slugs canônicos explícitos, versionados no catálogo, não hashes de títulos mutáveis.
- Exemplo de tipo: `br-cruzeiro-1942-cr42-107-type`.
- Exemplo de emissão: `br-cruzeiro-1942-cr42-107-1965`.
- Quando houver marca/variante: sufixo canônico, como `-mint-a`.
- Manter `productionCode` como dado, não como única chave: ele pode faltar ou mudar de grafia.
- Validar unicidade de `id`, combinação tipo/ano/código/marca e URLs de imagem.
- Gerar relatório de colisões; nunca resolver colisão silenciosamente com contador dependente da ordem.
- Manter arquivo de aliases/IDs legados para renomeações inevitáveis.

### 9.5 Vários anos e exemplares

- Um `CoinType` possui vários `CoinIssue`.
- Cada emissão representa um ano + código + marca/variante, quando a fonte permite distingui-los.
- A coleção referencia `issueId`.
- Quantidade atual continua válida para múltiplos exemplares equivalentes.
- Para conservação e observações diferentes por peça física, evolução futura:

```ts
interface Specimen {
  id: string;
  issueId: string;
  condition?: Condition;
  acquisitionDate?: string;
  acquisitionPrice?: number;
  personalNotes?: string;
}
```

Até essa fase, `CollectionItemV2.quantity` e uma conservação predominante mantêm a interface simples.

## 10. Estratégia para imagens

### Opção 1 — URLs diretas do BCB

**Vantagens:** repositório menor e atualização visual automática.
**Problemas:** dependência de rede, indisponibilidade futura, mudanças de caminho/capitalização, eventual bloqueio de hotlink, privacidade/requisições externas, cache menos previsível, PWA offline incompleto e necessidade de configurar domínios/CORS conforme o uso.

Mesmo quando `<img>` funciona sem CORS, processamento em canvas, conversão e certas validações exigem permissões adicionais. Não é a melhor opção para o app instalado no iPhone.

### Opção 2 — Baixar e versionar

**Vantagens:** funcionamento offline, desempenho previsível, ausência de hotlink e controle de dimensões/formato.
**Problemas:** crescimento do repositório, processo de atualização, obrigação de preservar créditos/proveniência e necessidade de confirmar condições de redistribuição.

AVIF tende a ser menor, mas WebP oferece compatibilidade e pipeline já estabelecido. Para moedas com texto e relevo fino, a qualidade deve ser validada visualmente; 320 px pode ser suficiente para cartões, mas talvez limitado no detalhe.

### Opção 3 — Híbrida

**Recomendada.**

- Importador registra URL e metadados oficiais.
- Em etapa separada e autorizada, baixa somente a lista aprovada.
- Gera cópias locais WebP/AVIF e miniaturas.
- Aplicação usa exclusivamente as cópias locais.
- Manifesto mantém URL original, data de coleta, checksum e atribuição.
- Falha de download não impede gerar o catálogo; o item fica com placeholder e inconsistência registrada.

Isso preserva o PWA offline, evita hotlink em tempo de execução e permite auditoria. Antes da coleta completa, revisar a [política de direitos autorais do BCB](https://www.bcb.gov.br/acessoinformacao/direitosautorais) e registrar a atribuição requerida.

## 11. Estratégia de importação

Criar futuramente `scripts/import-bcb-coins.mjs` ou `.ts`, de execução somente no desenvolvimento. Como o projeto não possui executor TypeScript de scripts, `.mjs` evita instalar dependência apenas para rodá-lo; `.ts` só faz sentido se o projeto adotar uma ferramenta já necessária.

Pipeline recomendado:

1. baixar a página oficial uma vez por execução, com timeout, identificação adequada e cache local de desenvolvimento;
2. localizar seções e links `modalAberto`;
3. coletar cada ficha com baixa concorrência e intervalo conservador, reutilizando cache;
4. salvar um snapshot bruto datado para auditoria, sem usá-lo diretamente no app;
5. normalizar espaços, acentos, datas e unidades brasileiras;
6. separar tipo das linhas de produção;
7. converter números sem perder o texto original;
8. gerar IDs determinísticos e aliases;
9. validar esquema e relações;
10. detectar duplicidades e diferenças em relação à versão anterior;
11. gerar catálogo estático e relatório de inconsistências;
12. baixar imagens somente mediante opção explícita;
13. registrar URL, data, checksum e versão do importador;
14. exigir revisão humana antes de substituir o catálogo versionado.

Saídas sugeridas:

```text
src/data/catalog/
├── monetary-systems.json
├── coin-types.json
├── coin-issues.json
├── legacy-id-map.json
└── catalog-meta.json
reports/
└── bcb-import-AAAA-MM-DD.md
```

O importador deve ser idempotente. Atualizações não devem apagar registros ausentes de uma coleta sem um estado explícito (`active`, `retired`, `sourceMissing`) e revisão.

Não se recomenda scraping no navegador do usuário nem dependência de rede do BCB em tempo de execução.

## 12. Estratégia de migração sem perda de dados

### 12.1 Princípio

```text
Catálogo de referência versionado (estático)
                     +
Coleção pessoal (IndexedDB/localStorage/backup)
```

Nunca copiar posse para o catálogo nem substituir o object store da coleção ao importar dados oficiais.

### 12.2 Plano seguro

1. Congelar uma lista dos IDs atuais do Real em teste/fixture.
2. Criar `CoinIssue` para cada registro atual.
3. Preservar exatamente o ID atual como `CoinIssue.id` na primeira versão **ou** criar `legacyCoinId` e mapa total, sem lacunas.
4. Adaptar as consultas para resolver primeiro ID atual/alias.
5. Fazer migração aditiva do IndexedDB em nova versão; não limpar o store.
6. Reescrever uma chave somente depois de gravar e verificar a nova, idealmente em uma transação.
7. Manter leitura do fallback `localStorage` versão 1.
8. Criar backup versão 2, mas continuar importando versão 1 indefinidamente.
9. Na importação de catálogo, nunca chamar `replace()` na coleção pessoal.
10. Testar automaticamente que todos os `CollectionItem.coinId` atuais resolvem para uma emissão.
11. Mostrar itens órfãos em diagnóstico, nunca descartá-los.

### 12.3 Estratégia preferida para o Real

O menor risco é manter os IDs atuais como IDs das emissões do Real, mesmo que não sigam o novo padrão de slug. IDs são chaves técnicas, não precisam ser esteticamente uniformes. Novas emissões históricas usam o novo padrão. Isso elimina uma migração destrutiva e preserva:

- IndexedDB;
- fallback local;
- backups existentes;
- links estáticos de detalhe;
- checkboxes;
- quantidades e notas.

Se no futuro URLs canônicas forem desejadas, uma camada de alias/redirect pode ser adicionada sem mudar a chave da coleção.

## 13. Impacto estimado nos componentes existentes

| Componente/arquivo | Impacto |
|---|---|
| `src/types/index.ts` | alto: novos tipos e compatibilidade V1/V2 |
| `src/data/coins.ts` | alto: dividir catálogo; manter adaptador temporário |
| `src/data/coin-images.ts` | médio/alto: manifesto explícito por tipo |
| `src/lib/formatting.ts` | médio: denominações e padrões variados |
| `src/context/CollectionContext.tsx` | médio: usar `issueId`/aliases |
| `src/lib/database.ts` | médio: migração aditiva e itens órfãos |
| `src/lib/backup.ts` | médio: backup V2 e importação V1 |
| `src/app/catalogo/page.tsx` | alto: seletor de padrão e filtros |
| `src/app/page.tsx` | médio: progresso por padrão |
| `src/app/colecao/page.tsx` | médio: agrupamento e estatísticas |
| `src/app/faltantes/page.tsx` | médio: escopo por padrão |
| `src/app/moeda/[id]/page.tsx` | médio: tipo + emissões e params |
| `CoinGroups` | alto: denominações dinâmicas |
| `CoinCard` | médio: cartão de tipo ou emissão |
| `CoinDetail` | alto: seletor/lista de anos |
| `Summary` | baixo/médio: denominador selecionado |
| `AppShell` e `Header` | baixo |
| `globals.css` | baixo/médio: novos controles preservando estilo |
| `public/sw.js` | médio: revisar cache/volume e versão |
| script de imagens | alto: transformar em pipeline com manifesto |

Uma camada adaptadora pode expor inicialmente `coins: CoinView[]` para reduzir a refatoração simultânea. Ela deve ser temporária e testada.

## 14. Organização visual proposta

A identidade atual pode ser mantida. A navegação sugerida é adequada, com duas decisões:

1. o nível principal deve ser **padrão monetário**, não país (enquanto só houver Brasil, “Brasil” pode ser título/contexto);
2. famílias e séries aparecem dentro do padrão somente quando existirem.

```text
Catálogo
└── Brasil
    ├── Cruzeiro — 1942–1967
    ├── Cruzeiro Novo
    ├── Cruzeiro — 1970–1986
    ├── Cruzado
    ├── Cruzado Novo
    ├── Cruzeiro — 1990–1993
    ├── Cruzeiro Real
    └── Real
        ├── 1ª família
        ├── 2ª família
        └── Comemorativas
```

Experiência mobile-first:

- seletor de padrão em uma lista de cartões/pastas;
- cabeçalho contextual com progresso;
- chips “Todas / Tenho / Faltam” preservados;
- filtros avançados recolhíveis por período, denominação e categoria;
- busca global por nome, valor, ano, código, tema e descrição;
- cartões de tipo com indicador “x de y anos”;
- ao abrir um tipo, lista compacta de emissões/anos com checkbox;
- estatísticas gerais e por padrão, sem carregar todos os controles na tela inicial;
- estado do último padrão/filtro opcionalmente em settings ou URL;
- alvos de toque, safe areas e navegação inferior mantidos.

Para não confundir o colecionador, a interface deve sempre mostrar se o progresso é por **emissões/anos** ou por **tipos**.

## 15. Riscos técnicos

| Risco | Severidade | Mitigação |
|---|---|---|
| Cobertura incompleta de 1942 | alta | limitar promessa; localizar fonte oficial complementar |
| Mudança no Angular/CMS do BCB | alta | importador isolado, snapshots e testes |
| Ausência de API documentada | alta | importação em desenvolvimento + revisão |
| Perda de IDs/posse atual | alta | preservar IDs e testes de migração |
| Tipo versus ano mal definido | alta | modelo híbrido |
| URLs/imagens externas mudarem | média/alta | cópia local com proveniência |
| Direitos/atribuição de imagens | média/alta | revisão de termos e créditos |
| HTML/tabelas inconsistentes | média | parser tolerante + relatório, nunca inventar |
| Anos/variantes ausentes | média | campos opcionais e status de verificação |
| Duplicidades por denominação | média | ID do tipo + código + variante |
| Moeda atravessar padrões | média | relação entre tipos/emissões, não duplicação cega |
| Crescimento das imagens | média | miniaturas, WebP/AVIF, orçamento de tamanho |
| Offline incompleto | média | assets locais e auditoria do service worker |
| Build estático com muitas rotas | baixa/média | medir após prova de conceito |
| Catálogo oficial confundido com numismático | alta | escopo e proveniência explícitos |

## 16. Plano de implementação por etapas

### Fase 0 — definição de escopo e preservação

- exportar/registrar todos os IDs atuais em fixture;
- definir “completo”: BCB apenas ou toda emissão desde 1942;
- confirmar direitos/atribuição das imagens;
- escolher um padrão pequeno para prova.

### Fase 1 — preparação estrutural

- adicionar `MonetarySystem`, `CoinType` e `CoinIssue`;
- criar adaptador para o catálogo atual;
- manter todos os IDs do Real;
- separar arquivos de referência;
- adicionar validação e testes de identidade;
- preparar backup V2 sem remover leitura V1.

### Fase 2 — prova de conceito

- importar somente Cruzeiro Real (4 tipos) ou outro lote pequeno;
- validar parser, IDs, imagens e campos ausentes;
- testar filtros e detalhe com anos;
- testar coleção V1 preenchida antes/depois da atualização;
- validar PWA offline no iPhone.

### Fase 3 — expansão progressiva

- adicionar um padrão por vez;
- revisar cada relatório de inconsistências;
- tratar continuidade entre Cruzeiro Novo e Cruzeiro de 1970;
- integrar comemorativas em fluxo próprio;
- bloquear publicação se houver colisões ou IDs legados não resolvidos.

### Fase 4 — estatísticas e refinamentos

- progresso por padrão e por emissão;
- filtros avançados;
- quantidades e conservação;
- opcionalmente, `Specimen` para peças individuais;
- auditoria de tamanho, acessibilidade e desempenho.

### Fase 5 — cobertura histórica complementar

- localizar fonte oficial para moedas do Tesouro Nacional não cobertas pelo BCB;
- manter proveniência por registro/campo;
- rotular claramente dados não confirmados;
- avaliar fontes numismáticas apenas como complementares, nunca como BCB.

## 17. Arquivos que provavelmente precisarão ser alterados

Quando a implementação for autorizada:

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
public/coins/README.md
scripts/fetch-coin-images.mjs
```

Prováveis arquivos novos:

```text
src/data/catalog/monetary-systems.json
src/data/catalog/coin-types.json
src/data/catalog/coin-issues.json
src/data/catalog/legacy-id-map.json
src/data/catalog/catalog-meta.json
src/lib/catalog.ts
src/lib/catalog-validation.ts
scripts/import-bcb-coins.mjs
```

## 18. Recomendação final

**Prosseguir com ressalvas.**

O projeto tem uma base adequada: catálogo estático, coleção pessoal separada, PWA local, imagens locais e backup. A expansão não exige trocar de stack nem criar servidor. Exige, contudo, generalizar a modelagem antes de importar dados e preservar os IDs atuais do Real.

O maior risco não é desempenho: é prometer cobertura histórica total com uma fonte que explicitamente não contém todas as moedas do Cruzeiro de 1942 e que não funciona como API pública estável. O produto deve começar como “catálogo institucional documentado pelo BCB”, com proveniência explícita, e só ampliar a promessa quando houver fonte oficial complementar validada.

O primeiro passo recomendado é **criar uma prova estrutural sem dados novos**: congelar os IDs atuais, modelar `CoinType`/`CoinIssue` e provar, em testes, que uma coleção existente do Real continua 100% intacta. Depois, importar um padrão pequeno — preferencialmente Cruzeiro Real — como prova de conceito.

## 19. Resumo para o terminal

```text
Viabilidade: prosseguir com ressalvas.
Arquitetura: catálogo estático versionado separado da coleção pessoal local.
Modelo: híbrido — CoinType + CoinIssue + CollectionItem por emissão.
Imagens: pipeline híbrido; cópias locais otimizadas com URL e crédito da fonte.
Risco principal: cobertura histórica incompleta e ausência de API estável do BCB.
Primeiro passo: congelar os IDs do Real e provar uma migração/adaptação sem perda.
```

## 20. Confirmação de integridade desta etapa

Nesta tarefa foi criado somente este relatório:

```text
RELATORIO_EXPANSAO_MOEDAS_BRASIL.md
```

Nenhum arquivo funcional, dado do catálogo, imagem, ID, banco, armazenamento ou configuração do projeto foi alterado. Nenhuma imagem em massa foi baixada e nenhuma dependência foi instalada.
