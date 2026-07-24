# Relatório do painel estatístico

Data: 24 de julho de 2026

## Resultado

Foi criada a rota local `/estatisticas/`, integrada à navegação principal e ao cache PWA. O painel não usa APIs, telemetria, bibliotecas externas de gráficos ou armazenamento adicional.

## Indicadores

- progresso geral em quantidade e percentual;
- moedas possuídas e faltantes;
- total de exemplares e duplicatas;
- padrão monetário;
- família;
- valor dentro do respectivo padrão monetário;
- década;
- ano;
- distribuição por quantidade de exemplares;
- faltantes por padrão monetário;
- tempo estimado para completar.

## Estimativa de conclusão

A estimativa utiliza somente datas de aquisição preenchidas. Ela exige pelo menos duas aquisições datadas e sete dias de histórico. Sem essa amostra mínima, o painel informa que os dados são insuficientes. Uma coleção completa retorna previsão zero.

## Gráficos

Os gráficos de barras e rosca são componentes React com CSS local. Todos exibem também valores textuais, preservando leitura sem depender exclusivamente de cor.

## Compatibilidade

- nenhum ID foi alterado;
- nenhuma estrutura do IndexedDB foi alterada;
- nenhum dado da coleção foi modificado;
- todas as 331 rotas de moedas foram preservadas;
- a rota foi adicionada ao shell offline;
- o cache PWA foi atualizado para `v12-20260724-painel-estatistico`.

## Validação

- 32 testes aprovados;
- TypeScript aprovado;
- build de produção aprovado;
- 340 páginas estáticas geradas;
- página estatística com 3,35 kB e 120 kB de carga inicial;
- contratos de catálogo, checkbox, backup, migração e PWA preservados.
