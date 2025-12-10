# DATABASE (avap2)

Este documento descreve o esquema do banco `avap2` usado pelo projeto.

Principais tabelas (resumo):
- `pessoa` / `pessoas` — tabelas de pessoas (clientes/funcionários)
- `funcionarios` / `funcionario` — funcionários (pode haver variação entre singular/plural)
- `pedido` — pedidos: colunas: `idpedido`, `datadopedido`, `clientepessoacpfpessoa`, `funcionariopessoacpfpessoa`, `total` (observação: `total` pode ser calculado)
- `pedidohasproduto` — itens do pedido (FK para `produto`)
- `produto` — produtos com `idproduto`, `nomeproduto`, `precounitario`, `id_imagem`, `estoque`
- `pagamento` — pagamentos ligados a pedidos
- `formadepagamento` — formas de pagamento (`ativo`)

Recomendações:
- Manter nomes de colunas consistentes. Este repositório apresenta variações; considere consolidar `funcionarios` vs `funcionario` e `pessoa` vs `pessoas`.
- Usar `deleted_at` para soft-delete e `ativo boolean` para disponibilidade.

Para documentação exata do schema (DDL), execute script de inspeção `scripts/describe_schema.js` (se existir) ou `inspect_schema_avap2.js`.
