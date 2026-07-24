# Relatório consolidado — padrões monetários do BCB

Data da validação: 24/07/2026

## Escopo

Foram importados todos os padrões disponíveis na página “Moedas produzidas” do
Banco Central do Brasil. O recorte oficial começa no Cruzeiro de 1942; padrões
anteriores que não constam nessa fonte não foram inventados ou complementados
por fontes externas.

## Catálogo final

| Padrão | Período | Emissões no aplicativo |
|---|---:|---:|
| Real | 1994–atual | 187 |
| Cruzeiro Real | 1993–1994 | 8 |
| Cruzeiro | 1990–1993 | 15 |
| Cruzado Novo | 1989–1990 | 8 |
| Cruzado | 1986–1989 | 26 |
| Cruzeiro | 1970–1986 | 73 |
| Cruzeiro Novo | 1967–1970 | 9 |
| Cruzeiro | 1942–1967 | 5 |
| **Total** |  | **331** |

O Real e o Cruzeiro Real mantêm suas bases previamente validadas. A importação
completa acrescentou 6 padrões, 59 tipos e 136 emissões históricas.

## Integridade

- IDs determinísticos gerados pelo importador
- Nenhum ID duplicado
- Nenhuma relação órfã entre padrão, tipo e emissão
- Nenhuma emissão histórica sem ano
- 59 imagens históricas armazenadas localmente
- Aproximadamente 2,69 MiB de imagens históricas
- Nenhuma dependência de rede durante o uso do aplicativo
- Snapshot gerado automaticamente, sem edição manual de registros

O gerador recusa o snapshot se o número de padrões divergir, se houver emissão
sem ano ou se uma imagem estiver ausente.

## Compatibilidade

- 187 IDs do Real preservados
- 8 IDs do Cruzeiro Real preservados
- IndexedDB e `coinId` inalterados
- Backups V1 e V2 continuam compatíveis
- Quantidade, conservação e observações continuam associadas à emissão
- Um item histórico foi marcado no navegador e coexistiu com os itens já
  armazenados do Real e do Cruzeiro Real

## Interface

Foram verificados:

- oito padrões exibidos em ordem cronológica inversa
- hierarquia Brasil → padrão → família → tipo → emissão
- contadores por padrão, família e coleção
- busca textual
- filtros por situação e ano
- ordenação por ano
- páginas de detalhe
- imagens históricas
- checkbox e coleção

## Build e performance

- Typecheck: aprovado
- Build estático: aprovado
- Páginas geradas: 339
- Rotas de moeda: 331
- JavaScript inicial do catálogo: 130 kB
- JavaScript compartilhado: 103 kB

O importador, o navegador headless, o cache bruto e os relatórios de coleta não
entram no bundle do aplicativo.

## PWA e offline

- Service worker versionado como `v10-20260724-todos-padroes`
- Shell principal preservado
- Estratégia `networkFirst` para navegação
- Estratégia `cacheFirst` para ativos locais
- Com o servidor desligado, o padrão Cruzeiro de 1942–1967 continuou
  acessível, incluindo seus três tipos e imagens

## Testes

Resultado final: **25 testes aprovados, nenhum reprovado**.

A cobertura inclui parser, normalização, IDs, duplicidades, migrações, backups,
rotas legadas, rotas históricas, imagens, busca, filtros, coleção, PWA e
comportamento offline.
