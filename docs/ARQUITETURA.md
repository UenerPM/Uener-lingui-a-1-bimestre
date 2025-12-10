# 🏗️ Arquitetura de Projeto

## Visão Geral

Sistema moderno de e-commerce de linguiças com:
- **Backend**: Node.js + Express + PostgreSQL
- **Frontend**: HTML/CSS/JS modular com API client
- **Padrão**: Clean Architecture (Services → Controllers → Routes)

---

## 📁 Estrutura de Diretórios

```
project/
├── src/
│   ├── config/              # Configuração centralizada
│   │   └── index.js
│   ├── constants/           # Constantes de schema
│   │   └── schemaConstants.js
│   ├── controllers/         # HTTP Request Handlers
│   │   ├── authController.js
│   │   ├── produtoController.js
│   │   ├── pedidoController.js
│   │   ├── pagamentoController.js
│   │   ├── imagemController.js
│   │   ├── funcionarioController.js
│   │   ├── clienteController.js
│   │   └── linguicasPublicController.js
│   ├── services/            # Lógica de Negócio
│   │   ├── authService.js
│   │   ├── produtoService.js
│   │   ├── pedidoService.js
│   │   ├── pagamentoService.js
│   │   ├── imagemService.js
│   │   ├── funcionarioService.js
│   │   ├── clienteService.js
│   │   └── linguicaService.js
│   ├── repositories/        # Data Access Layer
│   │   ├── authRepository-avap2.js
│   │   ├── produtoRepository-avap2.js
│   │   ├── pedidoRepository-avap2.js
│   │   ├── pagamentoRepository-avap2.js
│   │   ├── funcionarioRepository.js
│   │   ├── clienteRepository.js
│   │   └── linguicaRepository.js
│   ├── routes/              # Route Definitions
│   │   ├── api-avap2.js     # ⭐ ROTA PRINCIPAL
│   │   ├── payment.js
│   │   └── (outras rotas)
│   ├── middleware/          # Express Middleware
│   │   └── auth.js
│   └── utils/               # Funções utilitárias
│       └── logger.js
├── public/                  # Frontend Estático
│   ├── index.html
│   ├── login.html
│   ├── pagamento.html
│   ├── src/                 # Módulos JavaScript ES6
│   │   ├── api.js          # API Client
│   │   ├── session.js      # Session Manager
│   │   ├── dom.js          # DOM Utils
│   │   ├── validators.js   # Validadores
│   │   └── utils.js        # Utilitários
│   ├── css/                 # Estilos
│   │   └── style.css
│   ├── js/                  # Scripts legados (a deprecar)
│   │   └── (antigos)
│   └── img/                 # Imagens
├── docs/                    # Documentação
│   ├── README.md
│   ├── API.md
│   ├── DATABASE.md
│   ├── BACKEND.md
│   ├── FRONTEND.md
│   ├── IMAGENS.md
│   └── DEPLOY.md
├── scripts/                 # Scripts utilitários
│   ├── check_requires.js   # Análise de imports
│   └── report_structure.js # Gera REPO_STRUCTURE.json
├── app.js                   # Entry point
├── package.json
└── .env.example
```

---

## 🏛️ Padrão de Arquitetura

### 1️⃣ **HTTP Layer** (Routes)
```javascript
// src/routes/api-avap2.js
router.post('/pedidos', requireLogin, pedidoCtrl.createPedido);
```
Responsabilidade: **Apenas parsing HTTP**, validar autenticação

---

### 2️⃣ **Controller Layer**
```javascript
// src/controllers/pedidoController.js
async createPedido(req, res) {
  try {
    const pedido = await pedidoService.createPedidoWithItems(
      req.session.user.cpfpessoa,
      req.body.itens
    );
    return jsonSuccess(res, { data: pedido });
  } catch (err) {
    return jsonError(res, err.message, 500);
  }
}
```
Responsabilidade: **HTTP handling**, desserializar request, serializar response

---

### 3️⃣ **Service Layer** ⭐
```javascript
// src/services/pedidoService.js
async createPedidoWithItems(cpf, itens, total, funcionarioCpf) {
  // Validação de regra de negócio
  const funcionario = await funcionarioRepository.getFuncionarioByCpf(
    funcionarioCpf || await getRandomActiveFuncionario()
  );
  
  if (!funcionario || !isActive(funcionario)) {
    throw new Error('Nenhum atendente disponível');
  }
  
  // Chamada ao repository
  const pedido = await pedidoRepository.createPedido(cpf, funcionario.cpf);
  
  // Adicionar itens
  for (const item of itens) {
    await pedidoRepository.addItem(pedido.id, item.produtoId, item.quantidade);
  }
  
  return pedido;
}
```
Responsabilidade: **Lógica de negócio**, orquestração, validações

---

### 4️⃣ **Repository Layer**
```javascript
// src/repositories/pedidoRepository-avap2.js
async createPedido(cpfCliente, cpfFuncionario) {
  const result = await pool.query(
    'INSERT INTO pedido (datadopedido, clientepessoacpfpessoa, funcionariopessoacpfpessoa) ' +
    'VALUES (NOW()::date, $1, $2) RETURNING *',
    [cpfCliente, cpfFuncionario]
  );
  return result.rows[0];
}
```
Responsabilidade: **Data access only**, SQL queries

---

## 🔄 Fluxo de Requisição (Exemplo)

```
1. Cliente HTTP: POST /api/pedidos
   ↓
2. Route (api-avap2.js): Valida requireLogin, passa para controller
   ↓
3. Controller (pedidoController): Parse req.body, chama service
   ↓
4. Service (pedidoService): Valida regras, seleciona funcionário, chama repo
   ↓
5. Repository (pedidoRepository): INSERT INTO pedido, retorna resultado
   ↓
6. Service: Adiciona itens (chama repo novamente)
   ↓
7. Controller: Serializa resposta em JSON
   ↓
8. Route: Envia res.json() ao cliente
```

---

## 📦 Services Disponíveis

### authService
- `login(email, senha)` - Autentica usuário
- `getUserByEmail(email)` - Busca usuário
- `createUser(email, senha, nome, cpf)` - Cria novo usuário
- `isAdmin(email)` - Verifica se é admin
- `updatePassword(email, senhaAtual, senhaNova)` - Atualiza senha

### produtoService
- `getAllProdutos()` - Lista todos
- `getProdutoById(id)` - Busca por ID
- `getProdutoByNome(nome)` - Busca por nome
- `createProduto(nome, preco, imagem)` - Cria novo
- `updateProduto(id, nome, preco, imagem)` - Atualiza
- `deleteProduto(id)` - Deleta
- `verificarStock(idProduto, quantidade)` - Verifica estoque

### pedidoService
- `createPedidoWithItems(cpf, itens, total, funcionarioCpf)` - Cria com itens
- `getPedidoById(id)` - Busca por ID
- `getPedidosPorPessoa(cpfPessoa)` - Lista do usuário

### pagamentoService
- `createPagamento(idPedido, idForma, valor)` - Cria pagamento
- `verificarFormaPagamento(idForma)` - Valida forma

### funcionarioService ⭐
- `getActiveFuncionarios()` - Lista ativos (filtrado)
- `getFuncionarioByCpf(cpf)` - Busca por CPF
- `getRandomActiveFuncionario()` - Seleciona aleatório ATIVO
- `isFuncionarioActive(cpf)` - Verifica se está ativo
- `createFuncionario(cpf, nome, email, telefone)` - Cria novo
- `deactivateFuncionario(cpf)` - Desativa (soft delete)

### clienteService
- `getClienteByCpf(cpf)` - Busca por CPF
- `getAllClientes()` - Lista todos
- `createCliente(cpf, nome, email, telefone)` - Cria novo
- `updateCliente(cpf, nome, email, telefone)` - Atualiza

### imagemService
- `servirImagemProduto(idProduto)` - Busca imagem
- `imagemExists(idProduto)` - Verifica existência
- `listarImagensProdutos()` - Lista todas
- `deleteImagem(idProduto)` - Deleta imagem

### linguicaService
- `getAllLinguicas()` - Lista todas
- `getLinguicaById(id)` - Busca por ID
- `getLinguicaByNome(nome)` - Busca por nome
- `createLinguica(nome, preco, imagem)` - Cria nova
- `updateLinguica(id, nome, preco, imagem)` - Atualiza
- `deleteLinguica(id)` - Deleta

---

## 🎯 Pontos-Chave de Design

### ✅ Validações Centralizadas
Toda validação de regra de negócio está no **Service Layer**:
- Verificar se funcionário está ativo
- Validar estoque
- Calcular totais
- Autorização (ownership)

### ✅ Repositories Reutilizáveis
Repositories NÃO contêm lógica de negócio:
- Apenas CRUD operations
- Podem ser testados isoladamente
- Reutilizáveis entre serviços

### ✅ Controllers Magros
Controllers apenas traduzem HTTP:
- Parse input
- Chama service
- Traduz erro em status HTTP
- Serializa output

### ✅ Funcionários Ativos
`getAllFuncionarios()` já filtra por `deleted_at IS NULL`:
```javascript
async getRandomActiveFuncionario() {
  const funcionarios = await getActiveFuncionarios(); // ← já filtrado!
  return funcionarios[Math.floor(Math.random() * funcionarios.length)];
}
```

---

## 🚀 Frontend Modular

### ES6 Modules em `public/src/`
```javascript
// index.html
<script type="module">
  import { login, logout } from '/src/api.js';
  import { session } from '/src/session.js';
  import { showNotification } from '/src/dom.js';
  import { validateEmail } from '/src/validators.js';
  import { formatCurrency } from '/src/utils.js';
  
  // Usar...
</script>
```

### API Client Centralizado
```javascript
// /src/api.js
async function createPedido(itens) {
  return postAPI('/pedidos', { itens });
}
```

### Session Manager
```javascript
import { session } from '/src/session.js';

if (session.isLoggedIn()) {
  console.log(session.getUser()); // { cpf, nome, email, isAdmin }
}
```

---

## 🔐 Segurança

### Autenticação
- Express-session com PG Store (PostgreSQL)
- Middleware `requireLogin` em rotas protegidas
- Senhas com bcryptjs (10 rounds)

### Autorização
- `req.session.user.isAdmin` para admin
- Ownership check: usuário só vê seus dados
  ```javascript
  if (userId !== req.session.user.cpfpessoa && !req.session.user.isAdmin) {
    return jsonError(res, 'Acesso negado', 403);
  }
  ```

### Validação de Entrada
- Validators em `public/src/validators.js`
- Email, CPF, telefone, obrigatórios, comprimento

---

## 📊 Database

### Schema Principal (PostgreSQL)
- `pedido` - Pedidos com funcionário atribuído
- `pedidohasproduto` - Itens do pedido
- `produto` - Catálogo
- `pagamento` - Pagamentos
- `formadepagamento` - Formas (Dinheiro, PIX, Cartão)
- `funcionarios` - Atendentes (com `deleted_at` para soft delete)
- `pessoa` - Clientes/usuários

### Coluna Crítica
`funcionarios.deleted_at IS NULL` → Filtra ativos automaticamente

---

## ⚙️ Configuração

### `src/config/index.js`
```javascript
module.exports = {
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 3000,
  sessionSecret: process.env.SESSION_SECRET || 'dev-secret',
  pool: // pg.Pool conectado ao avap2
};
```

### Variáveis de Ambiente (`.env`)
```
NODE_ENV=development
PORT=3000
DATABASE_URL=postgres://user:pass@localhost/avap2
SESSION_STORE=postgres  # ou 'file'
PIX_KEY=uperesmarcon@gmail.com
PIX_MERCHANT_NAME=UENER LINGUÇO
```

---

## 🧪 Testing & Validation

### Script de Análise Estática
```bash
node scripts/check_requires.js
```
Valida:
- Imports/requires válidos
- Dependências circulares
- Arquivos órfãos

---

## 📝 Migrando do Padrão Antigo

### ❌ Antes
```javascript
// controllers falam direto com DB
const user = await pool.query('SELECT ...');
```

### ✅ Depois
```javascript
// controllers usam services
const user = await userService.getUserByEmail(email);

// services usam repositories
const user = await userRepository.getUserByEmail(email);

// repositories falam com DB
const result = await pool.query('SELECT ...');
```

---

## 🎓 Próximas Melhorias

1. **Testes Unitários** - Jest + Supertest
2. **Logging Estruturado** - Winston + logs em arquivo
3. **Rate Limiting** - Express-rate-limit
4. **Validação com Joi/Zod** - Schema validation
5. **GraphQL** - Alternativa a REST
6. **CI/CD** - GitHub Actions
7. **Containerização** - Docker + Docker Compose

---

**Versão**: 1.0  
**Data**: 9 de Dezembro de 2025  
**Autor**: Clean Architecture Reorganization
