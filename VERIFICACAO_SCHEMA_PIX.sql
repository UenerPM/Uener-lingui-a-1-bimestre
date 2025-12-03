-- ============================================
-- VERIFICAÇÃO DO SCHEMA AVAP2 PARA PIX
-- ============================================
-- Execute estes comandos no psql conectado ao banco AVAP2
-- para validar a integridade do sistema de pagamento

-- 1. VERIFICAR TABELA formadepagamento
SELECT 'Verificando tabela formadepagamento...' AS status;
\d formadepagamento

-- 2. LISTAR FORMAS DE PAGAMENTO
SELECT 'Formas de Pagamento Cadastradas:' AS status;
SELECT idformapagamento, nomeformapagamento FROM formadepagamento ORDER BY idformapagamento;

-- 3. VERIFICAR TABELA pagamento
SELECT 'Verificando tabela pagamento...' AS status;
\d pagamento

-- 4. VERIFICAR TABELA pedido
SELECT 'Verificando tabela pedido...' AS status;
\d pedido

-- 5. LISTAR ÚLTIMOS PAGAMENTOS CRIADOS
SELECT 'Últimos 5 pagamentos criados:' AS status;
SELECT 
  p.pedidoidpedido,
  p.datapagamento,
  p.valortotalpagamento,
  p.forma_pagamento_id,
  f.nomeformapagamento
FROM pagamento p
LEFT JOIN formadepagamento f ON p.forma_pagamento_id = f.idformapagamento
ORDER BY p.datapagamento DESC
LIMIT 5;

-- 6. VERIFICAR INTEGRIDADE REFERENCIAL
SELECT 'Verificando referencial de pedidos...' AS status;
SELECT COUNT(*) AS total_pedidos FROM pedido;

SELECT 'Verificando referencial de pagamentos...' AS status;
SELECT COUNT(*) AS total_pagamentos FROM pagamento;

-- 7. VERIFICAR FK SEM PEDIDO ASSOCIADO
SELECT 'Pagamentos sem pedido correspondente (possível erro):' AS status;
SELECT p.pedidoidpedido, p.datapagamento 
FROM pagamento p
LEFT JOIN pedido ped ON p.pedidoidpedido = ped.idpedido
WHERE ped.idpedido IS NULL;

-- 8. VERIFICAR FK SEM FORMA ASSOCIADA
SELECT 'Pagamentos sem forma de pagamento correspondente (possível erro):' AS status;
SELECT p.pedidoidpedido, p.forma_pagamento_id 
FROM pagamento p
LEFT JOIN formadepagamento f ON p.forma_pagamento_id = f.idformapagamento
WHERE f.idformapagamento IS NULL;

-- 9. ESTATÍSTICAS POR FORMA
SELECT 'Pagamentos agrupados por forma:' AS status;
SELECT 
  f.nomeformapagamento,
  COUNT(p.pedidoidpedido) AS total,
  SUM(p.valortotalpagamento) AS total_valor
FROM pagamento p
RIGHT JOIN formadepagamento f ON p.forma_pagamento_id = f.idformapagamento
GROUP BY f.nomeformapagamento, f.idformapagamento
ORDER BY f.idformapagamento;

-- 10. INSERIR FORMAS SE NÃO EXISTIREM
INSERT INTO formadepagamento (nomeformapagamento) VALUES
  ('Cartão de Crédito'),
  ('PIX'),
  ('Dinheiro'),
  ('Cartão de Débito')
ON CONFLICT (nomeformapagamento) DO NOTHING;

SELECT 'Formas de pagamento confirmadas/atualizadas.' AS status;

-- 11. TESTE: QUERY EXATA USADA PELO BACKEND
SELECT 'Query usada pelo backend GET /api/formas-pagamento:' AS status;
SELECT idformapagamento, nomeformapagamento 
FROM formadepagamento 
ORDER BY idformapagamento ASC;

-- 12. RESUMO FINAL
SELECT 'RESUMO DO SISTEMA DE PAGAMENTO' AS titulo;
SELECT 
  (SELECT COUNT(*) FROM formadepagamento) AS formas_cadastradas,
  (SELECT COUNT(*) FROM pagamento) AS pagamentos_criados,
  (SELECT COUNT(*) FROM pedido) AS pedidos_totais;

-- ============================================
-- FIM DA VERIFICAÇÃO
-- ============================================
