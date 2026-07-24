# Auditoria completa

Data: 24 de julho de 2026

## Resumo executivo

A revisão preservou funcionalidades, IDs, rotas e dados. Foram eliminados código e marcação duplicados, reduzido o custo de persistência, endurecida a validação de backups, modernizado o cache PWA e convertido o acervo JPEG para WebP.

## Lighthouse

Auditoria executada com Lighthouse 12.8.2 e Microsoft Edge headless sobre o export estático de produção.

| Categoria | Antes | Depois |
| --- | ---: | ---: |
| Performance | 85 | 87 |
| Acessibilidade | 100 | 100 |
| Boas práticas | 100 | 100 |
| SEO | 100 | 100 |

Métricas principais:

| Métrica | Antes | Depois |
| --- | ---: | ---: |
| FCP | 1,1 s | 1,1 s |
| LCP | 4,2 s | 4,1 s |
| Speed Index | 1,1 s | 1,1 s |
| Total Blocking Time | 100 ms | 40 ms |
| CLS | 0 | 0 |
| Time to Interactive | 4,2 s | 4,1 s |

A medição local não usa Brotli/Gzip. O Lighthouse indicou aproximadamente 400 KiB de economia potencial com compressão HTTP, responsabilidade da hospedagem. Essa limitação foi mantida no resultado para não inflar artificialmente a nota.

## Acessibilidade

Auditorias Lighthouse finais:

- início: 100;
- catálogo: 100;
- ajustes: 100;
- estatísticas: 100.

Correções realizadas:

- nome acessível no input de importação de backup;
- barras estatísticas convertidas em `progressbar`, com mínimo, máximo e valor atual;
- nenhuma falha automática restante nas páginas auditadas.

Auditoria automática não substitui testes manuais com VoiceOver, TalkBack, NVDA e navegação completa por teclado.

## Código morto e duplicações

- removido `ClientDiagnostics` do bundle client-side;
- removido estado público `loading`, que não tinha consumidores;
- removido método `repository.remove`, que não era utilizado;
- extraído `ProgressList`, eliminando duplicação entre gráficos gerais e de quantidade;
- otimização de imports do `lucide-react` habilitada;
- Lightning CSS habilitado para consolidação e minificação do CSS de produção.

## IndexedDB

- conexão passou a ser reutilizada em vez de abrir/fechar a cada operação;
- `versionchange` fecha a conexão de forma segura;
- falhas limpam a conexão armazenada e preservam o fallback;
- restore e merge agora usam uma única transação por lote;
- replace não executa mais `clear` seguido de centenas de transações individuais;
- chave `coinId`, versão do banco e schema lógico permanecem compatíveis.

## Backup

- formato atual atualizado para V4;
- leitura de V1, V2, V3 e V4 preservada;
- itens exportados em ordem determinística;
- `itemCount` incluído para inspeção rápida;
- IDs duplicados são consolidados na importação;
- limite de 100.000 registros na estrutura;
- limite de 20 MB no arquivo selecionado;
- campos pessoais e configurações continuam preservados.

## Imagens

- 63 JPEGs convertidos para WebP;
- conjunto convertido: 3.015.749 bytes antes, 590.554 bytes depois;
- redução de 2.425.195 bytes, aproximadamente 80%;
- acervo completo em `public/coins`: 4.423.782 bytes antes, 1.998.587 bytes depois;
- scripts, snapshots, testes e referências foram atualizados;
- 331 rotas e 140 arquivos de imagem continuam disponíveis.

## PWA e cache

- caches separados para shell, runtime e imagens;
- shell precacheado durante instalação;
- navegação com network-first, navigation preload e fallback offline;
- assets com stale-while-revalidate;
- cache de imagens limitado a 180 entradas;
- caches antigos removidos por prefixo durante ativação;
- atualização imediata suportada por mensagem `SKIP_WAITING`;
- cache atual: `v14-20260724-auditoria`.

## Validação funcional

- 35 testes aprovados;
- TypeScript aprovado;
- build de produção aprovado;
- 340 páginas estáticas geradas;
- 331 rotas de moedas preservadas;
- contratos de IDs, checkbox, catálogo, migração, backup e PWA aprovados.

## Recomendações futuras

1. Habilitar Brotli ou Gzip e HTTP/2 ou HTTP/3 na hospedagem.
2. Adicionar um orçamento Lighthouse no CI para impedir regressões de performance e acessibilidade.
3. Dividir o CSS global por rota ou componente para reduzir os aproximadamente 29 KiB que o Lighthouse identifica como não utilizados na página inicial.
4. Considerar virtualização apenas nas listas realmente longas; hoje o custo e a complexidade não justificam aplicá-la indiscriminadamente.
5. Fazer testes manuais periódicos com VoiceOver, TalkBack e NVDA.
6. Avaliar criptografia opcional de backups, com aviso claro de que perder a senha torna o arquivo irrecuperável.
7. Configurar CSP, `Permissions-Policy` e demais cabeçalhos de segurança na plataforma de hospedagem.
