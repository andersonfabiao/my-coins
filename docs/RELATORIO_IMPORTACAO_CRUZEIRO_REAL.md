# Relatório de importação — Cruzeiro Real
Data da validação: 24/07/2026

## Resultado

A importação e a integração foram concluídas. O catálogo agora contém o Real e
o Cruzeiro Real, mantendo os 187 IDs anteriores e acrescentando 8 emissões.

Fonte: catálogo “Moedas produzidas” do Banco Central do Brasil.

## Dados importados

- Padrão monetário: Cruzeiro Real (CR$)
- Vigência: 01/08/1993 a 30/06/1994
- Tipos: CR$ 5, CR$ 10, CR$ 50 e CR$ 100
- Emissões: 1993 e 1994 para cada tipo
- Total: 4 tipos e 8 emissões
- Imagens oficiais locais: 4
- Duplicidades: nenhuma
- Erros ou avisos do importador: nenhum

Foram importados valor facial, período de circulação, diâmetro, peso,
espessura, material, descrição, ano e tiragem. O aplicativo utiliza o recorte
compatível com seu modelo atual e mantém a captura completa nos artefatos do
importador.

## Compatibilidade do Real

- 187 IDs anteriores preservados
- 187 rotas anteriores preservadas
- IndexedDB e chave `coinId` inalterados
- Backups V1 e V2 continuam aceitos
- Checkboxes, quantidades, conservação e observações permanecem associados ao
  ID da emissão

## Verificações funcionais

### Busca e filtros

- Busca textual atualiza a lista sem recarregar a página
- Busca sem correspondência retorna lista vazia
- Filtro por ano separa 1993 e 1994
- Filtros “Tenho” e “Faltam” usam o estado persistido da coleção
- Ordenação crescente e decrescente por ano permanece disponível

### Estatísticas

- Total geral: 195 moedas
- Padrões monetários: 2
- Cruzeiro Real: 8 emissões
- Contadores por família e padrão são calculados a partir do catálogo
- Progresso geral e faltantes incluem o novo padrão

### Coleção

Um checkbox do Cruzeiro Real foi acionado no build de produção. O item apareceu
na coleção sem remover o item preexistente do Real. A página exibiu 2 de 195
moedas e 2 coleções, comprovando coexistência e persistência.

### Performance

- Build estático: 203 páginas geradas
- Rotas de moeda: 195
- JavaScript inicial do catálogo informado pelo Next.js: 123 kB
- Imagens adicionadas: aproximadamente 190 kB no total
- Nenhuma chamada ao BCB ocorre durante o uso do aplicativo
- O importador e seu navegador headless não entram no bundle

### PWA e offline

- Manifesto atualizado para “moedas brasileiras”
- Cache do service worker versionado como `v9-20260724-cruzeiro-real`
- Shell principal continua pré-carregado
- Navegação e ativos locais continuam usando cache
- Com o servidor desligado, a página Brasil carregou e exibiu os dois padrões
- Ainda sem servidor, a família do Cruzeiro Real carregou os quatro tipos

## Testes automáticos

Resultado: 21 testes aprovados e nenhum reprovado.

A suíte cobre:

- parser e IDs do importador
- duplicidades
- migrações e backups
- 187 IDs legados do Real
- 8 novas rotas do Cruzeiro Real
- imagens locais
- busca, filtros e ordenação
- coleção e persistência
- manifesto, service worker e página offline

## Arquitetura

O importador permanece em `scripts/` e não é executado pelo aplicativo. A
integração usa um snapshot tipado em `src/data/cruzeiro-real.ts` e imagens
locais em `public/coins/bcb/`. Isso mantém a aplicação determinística,
exportável e totalmente funcional sem internet.
