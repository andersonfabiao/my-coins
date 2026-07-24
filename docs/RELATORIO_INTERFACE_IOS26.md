# Relatório da interface iOS 26

Data: 24 de julho de 2026

## Escopo

A interface recebeu uma nova camada visual sem alterações em regras de negócio, componentes de domínio, IDs, rotas, armazenamento ou eventos.

## Sistema visual

- materiais translúcidos com blur e saturação;
- fundos atmosféricos adaptados a claro e escuro;
- cards com profundidade, bordas sutis e estados de interação;
- navegação inferior em formato de vidro flutuante;
- hierarquia tipográfica com espaçamento e pesos responsivos;
- ícones com superfícies e estados ativos;
- barras, indicadores, filtros e formulários harmonizados;
- estados de foco visíveis para teclado;
- transições spring, respostas táteis e animações de entrada;
- redução automática de movimento com `prefers-reduced-motion`.

## Dispositivos e orientação

- iPhone e Android: uma coluna, áreas seguras, navegação compacta e alvos de toque;
- telefones muito estreitos: rótulos da navegação são reduzidos para preservar espaço;
- landscape: cabeçalhos e navegação mais baixos, cards em duas colunas;
- iPad e tablets: espaçamento ampliado e grades em duas colunas;
- desktop: conteúdo até 1320 px, grades de duas e três colunas e efeitos de hover;
- dispositivos sem hover: efeitos dependentes de mouse são neutralizados.

## Dark Mode

O tema escuro usa superfícies, sombras, linhas, textos e cores próprias. Os modos `system`, `light` e `dark` existentes foram preservados e continuam controlando `data-theme`.

## PWA

- orientação alterada de `portrait-primary` para `any`;
- suporte a `window-controls-overlay`, `standalone` e `minimal-ui`;
- cores do shell atualizadas;
- cache atualizado para `v13-20260724-interface-ios26`;
- áreas seguras consideradas nos quatro lados.

## Compatibilidade

- 331 rotas de moedas preservadas;
- checkboxes e eventos preservados;
- IndexedDB e backups inalterados;
- busca, filtros, coleção e estatísticas inalterados;
- nenhuma dependência adicionada.

## Validação

- 35 testes aprovados;
- TypeScript aprovado;
- build de produção aprovado;
- 340 páginas estáticas geradas;
- inspeção visual real em desktop e Dark Mode;
- ausência de overflow horizontal e erros de runtime nas telas inspecionadas;
- testes contratuais para telefone, tablet, landscape, desktop, PWA, Dark Mode, foco e redução de movimento.
