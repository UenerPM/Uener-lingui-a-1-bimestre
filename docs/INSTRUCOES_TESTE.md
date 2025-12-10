# 🎯 INSTRUÇÕES PARA TESTAR O SISTEMA CORRIGIDO

## ✅ Servidor já está rodando em `http://localhost:3000`

---

## 🧪 Como Testar o Fluxo Completo

### PASSO 1: Acessar Login
1. Abra `http://localhost:3000/login.html`
2. Insira email e senha válidos (de um usuário na tabela `pessoa`)
   - Exemplo: `email@example.com` e senha correspondente
3. Clique em "Entrar"

### PASSO 2: Carrinho de Compras
1. Será redirecionado para `http://localhost:3000/index.html`
2. Veja a lista de produtos do banco avap2
3. Clique nos botões `+` para adicionar itens ao carrinho
4. O carrinho atualiza em tempo real
5. Veja o total sendo calculado

### PASSO 3: Confirmar Pedido
1. Clique em **"Confirmar Pedido"** (botão laranja)
2. Será redirecionado para `http://localhost:3000/confirmacao.html`
3. ⚠️ **IMPORTANTE**: Aguarde 2-3 segundos (não deve redirecionar!)
4. Você verá o resumo do pedido com os itens e total
5. Clique em **"Confirmar Pedido"** (botão principal)
6. Aguarde o spinner (circular de carregamento)
7. ✅ Se bem-sucedido, verá: **"✓ Pedido criado com sucesso!"**
8. Clique em **"Ir para Pagamento"**

### PASSO 4: Pagamento
1. Será redirecionado para `http://localhost:3000/pagamento.html`
2. Escolha forma de pagamento:
   - **PIX** (mostra QR Code)
   - **Cartão de Crédito** (placeholder por enquanto)
3. Clique em **"Concluir Pagamento"**
4. Aguarde o spinner
5. ✅ Se bem-sucedido, verá: **"✓ Pagamento realizado com sucesso!"**
6. Clique em **"Voltar ao Início"**

### PASSO 5: Voltar ao Carrinho (Vazio)
1. Deve retornar a `http://localhost:3000/index.html`
2. ✅ Carrinho agora deve estar **vazio**
3. Pode fazer um novo pedido normalmente

---

## 🎯 O QUE FOI CORRIGIDO

### ✅ Antes (COM BUG):
```
Clica "Confirmar Pedido"
  ↓
Tenta ir para confirmacao.html
  ↓
Script detecta que "não está logado" 
  ↓
Redireciona para login.html
  ↓
Volta para index.html
  ↓
LOOP INFINITO ❌
```

### ✅ Depois (CORRIGIDO):
```
Clica "Confirmar Pedido"
  ↓
Vai para confirmacao.html
  ↓
Valida sessão (sem redirect)
  ↓
Exibe carrinho
  ↓
Clica "Confirmar Pedido"
  ↓
POST /api/pedidos
  ↓
Cria pedido no banco ✓
  ↓
Vai para pagamento.html
  ↓
POST /api/pagamentos
  ↓
Cria pagamento no banco ✓
  ↓
Volta a index.html
  ↓
✅ SUCESSO - SEM LOOPS!
```

---

## 🔍 Verificar Dados no Banco

### Pedidos Criados
```sql
SELECT * FROM pedido ORDER BY datadopedido DESC LIMIT 5;
```

### Itens do Pedido
```sql
SELECT * FROM pedidohasproduto ORDER BY pedidoidpedido DESC LIMIT 10;
```

### Pagamentos Registrados
```sql
SELECT * FROM pagamento ORDER BY datapagamento DESC LIMIT 5;
```

---

## 📊 Verificar Logs do Servidor

O servidor imprime logs das requisições. Procure por:

```
✅ Login: "usuario@email.com"
✅ GET /api/produtos
✅ POST /api/pedidos → idpedido: 123
✅ POST /api/pagamentos → pedidoid: 123
```

Se houver erro, aparecerá:
```
❌ Erro ao criar pedido: [mensagem de erro]
```

---

## 🛠️ Troubleshooting

### ❌ "Nenhum usuário logado"
**Solução**: Verifique se tem usuários na tabela `pessoa` com:
- Email válido
- Senha válida (comparar com `senha_pessoa`)

### ❌ "Nenhum pedido encontrado"
**Solução**: Pode ser erro ao criar o pedido. Verifique:
1. Se o carrinho não está vazio
2. Se os produtos têm estoque
3. Se a tabela `pedido` tem dados (cheque o banco)

### ❌ "Nenhuma forma de pagamento"
**Solução**: Verifique se tem dados em `formadepagamento`:
```sql
SELECT * FROM formadepagamento;
```

### ❌ Servidor não responde
**Solução**: 
1. Verifique se o servidor está rodando: `npm start`
2. Verifique se PostgreSQL está rodando
3. Verifique conexão ao banco em `.env`

---

## 📝 Endpoints Disponíveis

| Método | URL | Autenticação | Descrição |
|--------|-----|--------------|-----------|
| POST | /api/login | ❌ | Login com email + senha |
| POST | /api/logout | ❌ | Logout |
| GET | /api/me | ❌ | Info do usuário logado |
| GET | /api/produtos | ❌ | Lista todos os produtos |
| POST | /api/pedidos | ✅ | Criar novo pedido |
| GET | /api/pedidos | ✅ | Listar pedidos do usuário |
| GET | /api/formas-pagamento | ❌ | Listar formas de pagamento |
| POST | /api/pagamentos | ✅ | Registrar pagamento |

---

## 💾 Dados de Teste

Se não tiver usuários, crie um:
```sql
INSERT INTO pessoa (cpfpessoa, nomepessoa, email, senha_pessoa) 
VALUES ('12345678900', 'Usuário Teste', 'teste@example.com', 'senha123');
```

Depois faça login com:
- **Email**: teste@example.com
- **Senha**: senha123

---

## 🎉 Tudo Pronto!

O sistema agora funciona sem loops de redirecionamento.

Aproveite o fluxo de compra completo! 🎁

---

**Dúvidas?** Verifique os logs do servidor ou os arquivos:
- `RESUMO_EXECUTIVO.md` - Análise detalhada
- `FLUXO_COMPRA_CORRIGIDO.md` - Documentação técnica
- `scripts/test-fluxo-compra.js` - Testes automatizados
