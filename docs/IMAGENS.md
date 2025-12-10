# IMAGENS — Como o sistema serve imagens

O projeto tem várias fontes de imagens:
- `public/img/` — imagens locais do frontend
- `imagem` routes — rota que atua como proxy para imagens externas
- `imagens-produtos` — rota para servir imagens do CRUD de produtos

Padronizações recomendadas:
- Usar rota única para imagens no backend: `/api/imagem/:idProduto` ou `/imgs/:path`.
- Configurar cache (Cache-Control) e fallback (`no-image.png`).
- Em `app.js`, a rota `/imagens-produtos` é usada para proxy — mantenha e documente seu comportamento.

Teste de carregamento automático:
- Verifique `html/test-pix-console.html` e `public/js` para exemplos de uso.
