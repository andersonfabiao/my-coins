# Relatório de recursos avançados da coleção

Data: 24 de julho de 2026

## Resultado

Os recursos avançados foram adicionados sem alterar IDs, rotas, dados do catálogo ou a unidade colecionável (`CoinIssue`). A coleção continua vinculada ao `coinId` de cada emissão.

## Recursos

- Quantidade: preservada e limitada a inteiros a partir de 1 para itens possuídos.
- Conservação: preservada com as opções existentes.
- Observações: preservadas no campo pessoal existente.
- Localização: novo campo opcional `storageLocation`.
- Valor pago: preservado no campo existente.
- Data de aquisição: preservada no campo existente.
- Duplicatas: calculadas como `quantidade - 1`, sem criar uma segunda fonte de verdade.
- Desejo de troca: novo marcador opcional `wantedForTrade`.
- Favoritas: novo marcador opcional `favorite`.

A tela da moeda permite editar os dados e alternar os marcadores. A tela da coleção exibe totais e filtros de favoritas, duplicatas e itens disponíveis para troca.

## Persistência e compatibilidade

- IndexedDB atualizado da versão 3 para a versão 4.
- Esquema lógico da coleção atualizado da versão 2 para a versão 3.
- A chave primária permanece `coinId`.
- Registros antigos recebem valores padrão seguros para os novos campos.
- Backup atual atualizado para V3.
- Backups V1, V2 e V3 permanecem legíveis.
- Checkbox, quantidade, conservação, data, valor pago e observações são preservados durante migração e restauração.
- O fallback em armazenamento local usa a mesma migração.
- Cache PWA atualizado para `v11-20260724-colecao-avancada`.

## Validação

- 29 testes automáticos aprovados.
- TypeScript aprovado sem erros.
- Build de produção aprovado.
- 339 páginas estáticas geradas.
- 331 rotas de moedas preservadas.
- 187 IDs históricos de referência do Real preservados.
- Contratos de checkbox e persistência aprovados.
- Busca, filtros, catálogo, PWA e shell offline preservados pelos contratos existentes.

## Decisões de compatibilidade

Os novos campos são opcionais no modelo TypeScript para aceitar registros legados. Ao salvar ou migrar, os marcadores ausentes são normalizados para `false`. Duplicatas não são armazenadas separadamente: essa informação é sempre derivada da quantidade, evitando inconsistências em backup, restore e sincronização da interface.
