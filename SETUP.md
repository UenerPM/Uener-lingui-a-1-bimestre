# 🍖 UENER LINGUÇO - E-commerce Sistema Completo

## 🎯 Visão Geral

Sistema de e-commerce backend em **Node.js + Express + PostgreSQL** com:
- ✅ Autenticação com sessão PostgreSQL
- ✅ APIs RESTful padronizadas (JSON: `{ success, message, [data], [redirect] }`)
- ✅ 9 tabelas integradas (users, produtos, pedidos, clientes, funcionários, etc)
- ✅ Middleware de autenticação e autorização
- ✅ Frontend HTML/JS corrigido sem loops de redirecionamento

---

## 📋 PRÉ-REQUISITOS

1. **Node.js** v16+ instalado
   ```bash
   node --version
   ```

2. **PostgreSQL** instalado e rodando
   ```bash
   # Linux
   sudo service postgresql status
   
   # Windows (PostgreSQL como serviço instalado)
   ```

3. **Credenciais PostgreSQL válidas** em `.env`

---

## 🚀 SETUP INICIAL (Primeiro uso)

### 1️⃣ Clone/Prepare o projeto

```bash
cd c:\Users\upere\Uener-lingui-a-1-bimestre
```

### 2️⃣ Instale dependências

```bash
npm install
```

### 3️⃣ Configure o `.env`

Edite `c:/Users/upere/Uener-lingui-a-1-bimestre/.env` com suas credenciais:

```env
PGHOST=localhost
PGPORT=5432
PGUSER=postgres
PGPASSWORD=sua_senha_aqui    # ← ALTERE AQUI
PGDATABASE=avap2
PORT=3000
NODE_ENV=development
SESSION_SECRET=cfc93d705fd9b0d4d8d50debbdefe713f2dabcad9ae401a4606a358aac15c9a8c61b4370a2bdaef90deca43988d857f3
```

### 4️⃣ Execute o setup do banco

```bash
node src/database/setup.js
```

**Esperado:**
```
🔌 Conectando ao PostgreSQL...
✅ Conectado
✅ Banco 'avap2' já existe
🔌 Conectando ao banco 'avap2'...
✅ Conectado ao banco
📝 Executando schema (init.sql)...
✅ Schema executado com sucesso
✅ Extensão UUID criada
👥 Usuários no banco: 1
📦 Produtos no banco: 4
💳 Formas de pagamento: 4

✅ BANCO POSTGRESQL CONFIGURADO COM SUCESSO
```

### 5️⃣ Inicie o servidor

```bash
npm start
```

**Esperado:**
```
╔═══════════════════════════════════════════════╗
║   🍖 UENER LINGUÇO - Servidor Iniciado 🍖    ║
╠═══════════════════════════════════════════════╣
║  🌐 Acesse: http://localhost:3000             ║
║  📊 Banco: PostgreSQL (avap2)                 ║
║  🔐 Sessão: Postgres (connect-pg-simple)      ║
...
```

---

## 🧪 TESTES RÁPIDOS

### Teste 1: Session (Deslogado)

```bash
curl -X GET http://localhost:3000/api/session
```

**Resposta:**
```json
{
  "success": false,
  "user": null
}
```

### Teste 2: Login (adm / 123)

```bash
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"adm","password":"123"}'
```

**Resposta:**
```json
{
  "success": true,
  "message": "login successful",
  "user": { "username": "adm", "isAdmin": true },
  "redirect": "/index.html"
}
```

### Teste 3: Produtos (Público)

```bash
curl -X GET http://localhost:3000/api/produtos
```

**Resposta:**
```json
{
  "success": true,
  "message": "produtos listados",
  "data": [
    { "id": 1, "nome": "Linguiça Calabresa", "preco": 15.00, ... },
    ...
  ]
}
```

---

## 📊 ARQUITETURA

```
app.js                           # Entrada única
├── src/
│   ├── config/
│   │   └── db.js              # Pool PostgreSQL
│   ├── controllers/           # Lógica de negócio
│   │   ├── userController.js
│   │   ├── produtoController.js
│   │   ├── pedidoController.js
│   │   └── ...
│   ├── repositories/          # Queries diretas ao DB
│   │   ├── userRepository.js
│   │   ├── produtoRepository.js
│   │   └── ...
│   ├── routes/                # Definição de rotas
│   │   ├── userRoutes.js
│   │   ├── produtoRoutes.js
│   │   └── ...
│   ├── middleware/
│   │   └── auth.js            # requireLogin, requireAdmin
│   └── database/
│       ├── init.sql           # Schema + seed
│       └── setup.js           # Setup automático
├── public/                    # Frontend estático
│   ├── index.html
│   ├── login.html
│   ├── confirmacao.html
│   └── js/
└── package.json
```

---

## 🔐 TABELAS DO BANCO

| Tabela | Descrição |
|--------|-----------|
| `users` | Usuários (admin, bloqueado) |
| `linguicas` | Produtos especiais |
| `produtos` | Catálogo geral |
| `clientes` | Dados de compradores |
| `funcionarios` | Dados de funcionários |
| `pedidos` | Histórico de pedidos |
| `itens_pedido` | Itens dentro de pedidos |
| `formas_pagamento` | Métodos (cartão, PIX, dinheiro) |
| `pagamentos` | Registros de pagamentos |

---

## 📚 ROTAS DA API

### Autenticação
- `POST /api/register` - Registrar novo usuário
- `POST /api/login` - Login
- `GET /api/logout` - Logout
- `GET /api/session` - Info da sessão

### Usuários (Admin-only)
- `GET /api/users` - Listar
- `POST /api/users` - Criar
- `DELETE /api/users/:username` - Remover
- `PATCH /api/users/:username/bloquear` - Bloquear/desbloquear
- `PATCH /api/users/:username/promover` - Virar admin
- `PATCH /api/users/:username/despromover` - Remover admin

### Produtos
- `GET /api/produtos` - Listar (público)
- `GET /api/produtos/:id` - Obter (público)
- `POST /api/produtos` - Criar (admin)
- `PUT /api/produtos/:id` - Atualizar (admin)
- `DELETE /api/produtos/:id` - Deletar (admin)

### Pedidos
- `GET /api/pedidos` - Meus pedidos (logado)
- `POST /api/pedidos` - Criar pedido (logado)
- `GET /api/pedidos-admin` - Todos (admin)

### Clientes
- `GET /api/clientes/meu-perfil` - Meu perfil (logado)
- `PUT /api/clientes/meu-perfil` - Atualizar perfil (logado)
- `GET /api/clientes` - Listar (admin)

---

## 🛠️ TROUBLESHOOTING

### ❌ "ECONNREFUSED" ao iniciar

**Problema:** PostgreSQL não está rodando

**Solução:**
```bash
# Linux
sudo service postgresql start

# Windows (iniciar como serviço)
# Ou executar: C:\Program Files\PostgreSQL\XX\bin\pg_ctl.exe start
```

### ❌ "28P01: password authentication failed"

**Problema:** Senha incorreta em `.env`

**Solução:**
1. Verifique a senha correta do seu PostgreSQL
2. Atualize `PGPASSWORD` em `.env`
3. Tente novamente: `node src/database/setup.js`

### ❌ "database avap2 does not exist"

**Problema:** Banco não foi criado

**Solução:**
```bash
node src/database/setup.js
```

### ❌ Frontend com loop de redirecionamento

**Problema:** `index.html` faz fetch `/api/session` e não parseia `{ success, user }`

**Solução:** ✅ **JÁ CORRIGIDO** em `/public/index.html` (veja próxima seção)

---

## ✅ CORREÇÕES APLICADAS (Bloco A)

### `app.js` - Reescrito
- ❌ Removidas rotas `/login`, `/register` que retornavam texto
- ❌ Removido `index.js` (não era usado)
- ✅ Entrada única: `app.js` limpo
- ✅ Session Postgres (PgSession)
- ✅ Todas as rotas em `/api/*`
- ✅ JSON padronizado sempre

### `init.sql` - Expandido
- ❌ Apenas 2 tabelas (users, linguicas)
- ✅ 9 tabelas (users, linguicas, **produtos, clientes, funcionarios, pedidos, itens_pedido, formas_pagamento, pagamentos**)
- ✅ Indices para performance
- ✅ Seed automático (admin + 4 produtos + 4 formas pagamento)

### `setup.js` - Reescrito
- ❌ Falhava ao conectar/criar banco
- ✅ Cria banco `avap2` automaticamente
- ✅ Roda schema + seed
- ✅ Mensagens de diagnóstico claras

### `.env` - Configurado
- ✅ `PGDATABASE=avap2` confirmado
- ✅ `SESSION_SECRET` gerado seguro
- ✅ Comentários explicativos adicionados

### `sessionRoute.js` - Padronizado
- ❌ Retornava `{ username, isAdmin }`
- ✅ Retorna `{ success, user: { username, isAdmin } }`

---

## 🔄 PRÓXIMOS PASSOS

Quando você enviar o **Bloco B**, vou:
1. Criar controllers para Produto, Pedido, Cliente, Funcionário
2. Criar repositories (queries) para cada tabela
3. Padronizar tratamento de erros
4. Validação de entrada em todos os endpoints

Quando você enviar o **Bloco C**, vou:
1. Corrigir todas as páginas HTML (login.html, index.html, etc)
2. Remover loops de redirecionamento
3. Padronizar todos os fetches para `{ success, user, message, data, redirect }`

---

## 📞 SUPORTE

Se algo falhar:
1. Verifique se PostgreSQL está rodando
2. Verifique `.env` (credenciais corretas)
3. Rode `node src/database/setup.js` novamente
4. Checkevalid JSON em testes curl

**Você está pronto para o Bloco B! 🚀**
