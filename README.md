# Minha Coleção de Moedas

PWA local para organizar moedas brasileiras do padrão Real. O catálogo fica em código e os dados pessoais são mantidos separadamente no IndexedDB do navegador.

## Executar

Requer Node.js 20 ou superior.

```bash
npm install
npm run dev
```

Abra `http://localhost:3000`. Para validar a versão estática, use `npm run build`; os arquivos finais serão gerados em `out/`.

## Instalar no iPhone

Hospede a pasta `out/` em um endereço HTTPS, abra o endereço no Safari, toque em **Compartilhar** e escolha **Adicionar à Tela de Início**. Abra o app uma vez com internet para que os arquivos principais sejam armazenados offline.

## Catálogo e imagens

- Edite `src/data/coins.ts` para revisar ou adicionar moedas.
- Não misture dados pessoais nesse arquivo: eles pertencem ao IndexedDB.
- Consulte `public/coins/README.md` para incluir imagens locais de anverso e reverso.
- Dados ainda não verificados aparecem como “A confirmar”.

## Backup

Em **Ajustes**, exporte a coleção em JSON. A importação permite mesclar ou substituir os dados locais. Limpar os dados do Safari também apaga a coleção, salvo se houver um backup.

## Hospedagem no GitHub Pages

O projeto usa exportação estática. Se for publicado em um subdiretório (por exemplo, `usuario.github.io/repositorio`), configure `basePath` e `assetPrefix` em `next.config.ts` e ajuste o escopo/caminhos do manifest e do service worker. Em domínio próprio ou Pages na raiz, nenhuma alteração é necessária.
