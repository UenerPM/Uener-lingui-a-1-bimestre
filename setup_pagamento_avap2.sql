-- =====================================================
-- SCRIPT SQL PARA AVAP2 — SISTEMA DE PAGAMENTO 2025
-- =====================================================
-- Execute isto no PostgreSQL para o banco avap2

-- 1. Garantir que a tabela formadepagamento existe e tem dados
-- (Se já existe, não vai dar erro por causa do IF NOT EXISTS)

CREATE TABLE IF NOT EXISTS formadepagamento (
  idformapagamento SERIAL PRIMARY KEY,
  nomeformapagamento VARCHAR(100) NOT NULL UNIQUE
);

-- 2. Inserir as formas principais (ON CONFLICT para não duplicar)
INSERT INTO formadepagamento (nomeformapagamento) VALUES
  ('Cartão de Crédito'),
  ('PIX'),
  ('Dinheiro'),
  ('Cartão de Débito')
ON CONFLICT (nomeformapagamento) DO NOTHING;

-- 3. Verificar que as formas foram inseridas
SELECT 'Formas de Pagamento cadastradas:' as resultado;
SELECT idformapagamento, nomeformapagamento FROM formadepagamento ORDER BY idformapagamento;

-- 4. Garantir que a tabela pagamento tem a estrutura correta
-- (A tabela provavelmente já existe, mas verificaremos)

-- Se a tabela NÃO existir, criar:
-- CREATE TABLE IF NOT EXISTS pagamento (
--   pedidoidpedido INTEGER NOT NULL,
--   datapagamento TIMESTAMP,
--   valortotalpagamento NUMERIC,
--   forma_pagamento_id INTEGER,
--   PRIMARY KEY (pedidoidpedido),
--   FOREIGN KEY (pedidoidpedido) REFERENCES pedido(idpedido),
--   FOREIGN KEY (forma_pagamento_id) REFERENCES formadepagamento(idformapagamento)
-- );

-- 5. Se a coluna forma_pagamento_id NÃO existir, adicionar:
-- ALTER TABLE pagamento ADD COLUMN forma_pagamento_id INTEGER;
-- ALTER TABLE pagamento ADD CONSTRAINT fk_pagamento_forma 
--   FOREIGN KEY (forma_pagamento_id) REFERENCES formadepagamento(idformapagamento);

-- 6. Listar estrutura da tabela pagamento para verificação
SELECT 'Estrutura da tabela pagamento:' as resultado;
SELECT column_name, data_type, is_nullable FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'pagamento'
ORDER BY ordinal_position;

-- 7. Verificar que a tabela pagamento tem dados
SELECT 'Últimos 5 pagamentos:' as resultado;
SELECT * FROM pagamento ORDER BY datapagamento DESC LIMIT 5;

-- Fim do script
-- Se tudo correr bem, você verá as formas de pagamento listadas
-- e poderá começar a testar o sistema.
