-- ===== UENER LINGUÇO - DATABASE SCHEMA =====
-- PostgreSQL avap2 - Migrações iniciais

-- Drop tables if exist (cuidado em produção!)
-- DROP TABLE IF EXISTS itens_pedido CASCADE;
-- DROP TABLE IF EXISTS pedidos CASCADE;
-- DROP TABLE IF EXISTS formas_pagamento CASCADE;
-- DROP TABLE IF EXISTS pagamentos CASCADE;
-- DROP TABLE IF EXISTS clientes CASCADE;
-- DROP TABLE IF EXISTS funcionarios CASCADE;
-- DROP TABLE IF EXISTS produtos CASCADE;
-- DROP TABLE IF EXISTS linguicas CASCADE;
-- DROP TABLE IF EXISTS users CASCADE;

-- ===== TABELA: USERS (Autenticação) =====
CREATE TABLE IF NOT EXISTS users (
  username TEXT PRIMARY KEY,
  password_hash TEXT NOT NULL,
  email TEXT UNIQUE,
  is_admin BOOLEAN DEFAULT false,
  bloqueado BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===== TABELA: LINGUICAS (Produtos especiais) =====
CREATE TABLE IF NOT EXISTS linguicas (
  id SERIAL PRIMARY KEY,
  nome TEXT UNIQUE NOT NULL,
  descricao TEXT,
  preco NUMERIC(10, 2) NOT NULL,
  imagem TEXT,
  estoque INTEGER DEFAULT 0,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===== TABELA: PRODUTOS (Catálogo geral) =====
CREATE TABLE IF NOT EXISTS produtos (
  id SERIAL PRIMARY KEY,
  nome TEXT UNIQUE NOT NULL,
  descricao TEXT,
  categoria TEXT DEFAULT 'Linguiça',
  preco NUMERIC(10, 2) NOT NULL,
  estoque INTEGER DEFAULT 0,
  imagem TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===== TABELA: CLIENTES (Dados de compradores) =====
CREATE TABLE IF NOT EXISTS clientes (
  id SERIAL PRIMARY KEY,
  user_id TEXT UNIQUE REFERENCES users(username) ON DELETE CASCADE,
  nome_completo TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  telefone TEXT,
  cpf TEXT UNIQUE,
  endereco TEXT,
  numero TEXT,
  complemento TEXT,
  bairro TEXT,
  cidade TEXT,
  estado TEXT,
  cep TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===== TABELA: FUNCIONÁRIOS =====
CREATE TABLE IF NOT EXISTS funcionarios (
  id SERIAL PRIMARY KEY,
  user_id TEXT UNIQUE REFERENCES users(username) ON DELETE CASCADE,
  nome_completo TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  telefone TEXT,
  cpf TEXT UNIQUE,
  cargo TEXT NOT NULL,
  salario NUMERIC(10, 2),
  data_admissao DATE,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===== TABELA: FORMAS DE PAGAMENTO =====
CREATE TABLE IF NOT EXISTS formas_pagamento (
  id SERIAL PRIMARY KEY,
  nome TEXT UNIQUE NOT NULL,
  descricao TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===== TABELA: PAGAMENTOS =====
CREATE TABLE IF NOT EXISTS pagamentos (
  id SERIAL PRIMARY KEY,
  pedido_id INTEGER REFERENCES pedidos(id) ON DELETE CASCADE,
  forma_pagamento_id INTEGER REFERENCES formas_pagamento(id),
  valor NUMERIC(10, 2) NOT NULL,
  status TEXT DEFAULT 'pendente', -- pendente, aprovado, rejeitado
  descricao_pagamento TEXT,
  referencia_externa TEXT, -- PIX ID, número de transação, etc
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===== TABELA: PEDIDOS =====
CREATE TABLE IF NOT EXISTS pedidos (
  id SERIAL PRIMARY KEY,
  cliente_id INTEGER REFERENCES clientes(id) ON DELETE SET NULL,
  user_id TEXT REFERENCES users(username) ON DELETE SET NULL,
  numero_pedido TEXT UNIQUE,
  status TEXT DEFAULT 'pendente', -- pendente, confirmado, cancelado, entregue
  total NUMERIC(10, 2) DEFAULT 0,
  desconto NUMERIC(10, 2) DEFAULT 0,
  taxa_entrega NUMERIC(10, 2) DEFAULT 0,
  observacoes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===== TABELA: ITENS DO PEDIDO =====
CREATE TABLE IF NOT EXISTS itens_pedido (
  id SERIAL PRIMARY KEY,
  pedido_id INTEGER NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  produto_id INTEGER REFERENCES produtos(id) ON DELETE SET NULL,
  linguica_id INTEGER REFERENCES linguicas(id) ON DELETE SET NULL,
  quantidade INTEGER NOT NULL DEFAULT 1,
  preco_unitario NUMERIC(10, 2) NOT NULL,
  subtotal NUMERIC(10, 2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===== ÍNDICES PARA PERFORMANCE =====
CREATE INDEX IF NOT EXISTS idx_pedidos_cliente_id ON pedidos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_user_id ON pedidos(user_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_status ON pedidos(status);
CREATE INDEX IF NOT EXISTS idx_itens_pedido_pedido_id ON itens_pedido(pedido_id);
CREATE INDEX IF NOT EXISTS idx_clientes_user_id ON clientes(user_id);
CREATE INDEX IF NOT EXISTS idx_funcionarios_user_id ON funcionarios(user_id);
CREATE INDEX IF NOT EXISTS idx_pagamentos_pedido_id ON pagamentos(pedido_id);

-- ===== SEED INICIAL (dados padrão) =====

-- Usuário admin (senha: 123 → bcrypt hash)
INSERT INTO users (username, password_hash, email, is_admin) 
VALUES (
  'adm',
  '$2a$10$Ld8BhPLvvzKJEE3V9fNZa.q1SmGzJ.B8vXl3WqJZb2u3VGVDjHkJW', -- bcryptjs hash de '123'
  'admin@uener.com',
  true
)
ON CONFLICT (username) DO NOTHING;

-- Formas de pagamento
INSERT INTO formas_pagamento (nome, descricao) VALUES
  ('Cartão de Crédito', 'Parcelado em até 12x'),
  ('Cartão de Débito', 'Débito na hora'),
  ('PIX', 'Transferência instantânea PIX'),
  ('Dinheiro', 'Pagamento na entrega')
ON CONFLICT (nome) DO NOTHING;

-- Produtos exemplo
INSERT INTO produtos (nome, categoria, descricao, preco, estoque, ativo) VALUES
  ('Linguiça Calabresa', 'Linguiça', 'Linguiça calabresa fresca grelhada', 15.00, 50, true),
  ('Linguiça Toscana', 'Linguiça', 'Linguiça italiana tradicional', 18.00, 30, true),
  ('Refrigerante', 'Bebida', 'Refrigerante 2L', 8.00, 100, true),
  ('Água Mineral', 'Bebida', 'Água mineral 500ml', 2.00, 200, true)
ON CONFLICT (nome) DO NOTHING;

-- Linguiças especiais (podem ser diferentes de produtos)
INSERT INTO linguicas (nome, descricao, preco, estoque, ativo) VALUES
  ('Linguiça do Chefe', 'Receita especial única', 25.00, 20, true),
  ('Linguiça Apimentada', 'Para quem gosta de pimenta', 16.00, 40, true)
ON CONFLICT (nome) DO NOTHING;
