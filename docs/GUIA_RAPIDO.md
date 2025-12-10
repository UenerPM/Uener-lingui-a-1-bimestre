# 📂 Guia Rápido de Estrutura

## Onde Adicionar Novo Recurso (ex: `cliente`)

### 1. Repository (`src/repositories/clienteRepository.js`)
```javascript
async getClienteByCpf(cpf) {
  const result = await pool.query('SELECT * FROM pessoa WHERE cpfpessoa = $1', [cpf]);
  return result.rows[0];
}

async createCliente(cpf, nome, email) {
  const result = await pool.query(
    'INSERT INTO pessoa (cpfpessoa, nomepessoa, email) VALUES ($1, $2, $3) RETURNING *',
    [cpf, nome, email]
  );
  return result.rows[0];
}
```

### 2. Service (`src/services/clienteService.js`)
```javascript
const clienteRepository = require('../repositories/clienteRepository');

async function getClienteByCpf(cpf) {
  if (!cpf) throw new Error('CPF é obrigatório');
  const cliente = await clienteRepository.getClienteByCpf(cpf);
  if (!cliente) throw new Error('Cliente não encontrado');
  return cliente;
}

async function createCliente(cpf, nome, email) {
  // Validações de negócio
  if (!cpf || !nome || !email) throw new Error('Campos obrigatórios');
  
  // Chamar repository
  return clienteRepository.createCliente(cpf, nome, email);
}

module.exports = { getClienteByCpf, createCliente, /* ... */ };
```

### 3. Controller (`src/controllers/clienteController.js`)
```javascript
const clienteService = require('../services/clienteService');

const ClienteController = {
  async getClienteByCpf(req, res) {
    try {
      const { cpf } = req.params;
      const cliente = await clienteService.getClienteByCpf(cpf);
      return res.json({ success: true, data: cliente });
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
  },
  
  async createCliente(req, res) {
    try {
      const { cpf, nome, email } = req.body;
      const cliente = await clienteService.createCliente(cpf, nome, email);
      return res.status(201).json({ success: true, data: cliente });
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
  }
};

module.exports = ClienteController;
```

### 4. Routes (`src/routes/api-avap2.js`)
```javascript
const clienteCtrl = require('../controllers/clienteController');

router.get('/clientes/:cpf', clienteCtrl.getClienteByCpf);
router.post('/clientes', clienteCtrl.createCliente);
```

---

## Verificação de Qualidade

```bash
# Validar imports/requires
node scripts/check_requires.js

# Testar endpoints (exemplo)
curl http://localhost:3000/api/produtos
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","senha":"123"}'
```

---

## Fluxo de Erro

```
try {
  service.doSomething()  // ← lança erro
} catch (err) {
  controller → HTTP 400/500 + { success: false, message }
}
```

Controller SEMPRE retorna JSON estruturado:
```javascript
{ success: true, data: {...}, message: "OK" }
{ success: false, message: "Erro..." }
```

---

**Dúvidas? Consulte `docs/ARQUITETURA.md`**
