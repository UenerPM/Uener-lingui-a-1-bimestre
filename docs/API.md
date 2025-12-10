# API (endpoints)

Este documento descreve as rotas públicas e protegidas fornecidas pela API.

Formato de resposta padrão
```
{
  "success": true|false,
  "message": "mensagem humana",
  "data": {...}
}
```

Principais grupos de rotas (prefixo `/api`):
- Autenticação: `POST /api/login`, `POST /api/logout`, `GET /api/me`
- Pedidos: `POST /api/pedidos`, `GET /api/pedidos`, `GET /api/pedidos/:id`
- Pagamentos: `POST /api/pagamentos`, `GET /api/pagamentos/:idpagamento`
- Produtos e imagens: `GET /api/produtos`, `GET /api/produtos/:id`, `GET /api/imagem/:idProduto`
- Administração: `GET /api/funcionarios` (requer admin)

Notas:
- Muitas rotas existentes têm aliases e variantes; a documentação detalhada de cada rota (parâmetros, exemplos de request/response) pode ser gerada automaticamente a partir dos JSDoc nos controllers. Recomenda-se adicionar JSDoc aos controllers antes de gerar docs finais.
