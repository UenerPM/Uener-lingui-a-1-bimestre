# Exemplos de Teste - API de Pagamentos (avap2)

## Setup

Certifique-se que:
1. O servidor está rodando: `node app-sqlite.js` ou `npm start`
2. Você está autenticado (session cookie foi gerado)
3. Há pelo menos 1 pedido e 1 forma de pagamento no banco

## Variáveis de Teste

```bash
# URL base
BASE_URL="http://localhost:3000"

# Cookie de sessão (substitua pelo seu)
SESSION_COOKIE="connect.sid=seu_valor_aqui"

# IDs de teste (ajuste aos seus dados)
PEDIDO_ID=1
FORMA_PAGAMENTO_ID=2
```

## Testes 1: GET /api/formas-pagamento (Listar formas)

Sem autenticação - retorna todas as formas disponíveis:

```bash
curl -X GET "http://localhost:3000/api/formas-pagamento" \
  -H "Content-Type: application/json"
```

**Resposta esperada (200):**
```json
{
  "success": true,
  "message": "Formas de pagamento listadas com sucesso",
  "formas": [
    {
      "idformapagamento": 1,
      "nomeformapagamento": "PIX"
    },
    {
      "idformapagamento": 2,
      "nomeformapagamento": "Cartão de Crédito"
    },
    {
      "idformapagamento": 3,
      "nomeformapagamento": "Dinheiro"
    }
  ]
}
```

---

## Testes 2: POST /api/pagamentos (Criar pagamento)

### ✅ Teste 2.1: Sucesso - Dados válidos

```bash
curl -X POST "http://localhost:3000/api/pagamentos" \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=seu_session_id" \
  -d '{
    "idpedido": 1,
    "idformadepagamento": 2,
    "valorpagamento": 150.50
  }'
```

**Resposta esperada (201):**
```json
{
  "success": true,
  "message": "Pagamento registrado com sucesso",
  "idPagamento": 1,
  "pedidoId": 1,
  "formaPagamentoId": 2,
  "valor": 150.50,
  "status": "pendente",
  "dataPagamento": "2025-12-01T14:30:00.000Z"
}
```

---

### ✅ Teste 2.2: Sucesso - Aliases alternativos

Os campos aceitam múltiplos nomes (aliases) para compatibilidade:

```bash
curl -X POST "http://localhost:3000/api/pagamentos" \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=seu_session_id" \
  -d '{
    "pedidoId": 1,
    "formaPagamentoId": 2,
    "valor": 250.00
  }'
```

Também funciona com:
```json
{
  "pedido_id": 1,
  "forma_pagamento_id": 2,
  "valortotal": 250.00
}
```

Ou:
```json
{
  "pedido": 1,
  "forma": 2,
  "total": 250.00
}
```

---

### ❌ Teste 3: Erros de Validação

### ❌ Teste 3.1: Não autenticado

```bash
curl -X POST "http://localhost:3000/api/pagamentos" \
  -H "Content-Type: application/json" \
  -d '{
    "idpedido": 1,
    "idformadepagamento": 2,
    "valorpagamento": 150.50
  }'
```

**Resposta esperada (401):**
```json
{
  "success": false,
  "message": "Usuário não autenticado"
}
```

**Logs do servidor:**
```
[pagamento] POST /api/pagamentos
[pagamento] body recebido: {...}
[pagamento] ❌ Erro de autenticação: usuário não logado
```

---

### ❌ Teste 3.2: idPedido ausente

```bash
curl -X POST "http://localhost:3000/api/pagamentos" \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=seu_session_id" \
  -d '{
    "idformadepagamento": 2,
    "valorpagamento": 150.50
  }'
```

**Resposta esperada (400):**
```json
{
  "success": false,
  "message": "idPedido é obrigatório"
}
```

**Logs do servidor:**
```
[pagamento] entrada normalizada: { idPedido: null, idFormaPagamento: 2, valor: 150.5 }
[pagamento] ❌ idPedido ausente
```

---

### ❌ Teste 3.3: idFormaPagamento não é um inteiro

```bash
curl -X POST "http://localhost:3000/api/pagamentos" \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=seu_session_id" \
  -d '{
    "idpedido": 1,
    "idformadepagamento": "abc",
    "valorpagamento": 150.50
  }'
```

**Resposta esperada (400):**
```json
{
  "success": false,
  "message": "idFormaPagamento deve ser um número inteiro"
}
```

**Logs do servidor:**
```
[pagamento] entrada normalizada: { idPedido: 1, idFormaPagamento: null, valor: 150.5 }
[pagamento] ❌ idFormaPagamento ausente
```

---

### ❌ Teste 3.4: Valor negativo

```bash
curl -X POST "http://localhost:3000/api/pagamentos" \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=seu_session_id" \
  -d '{
    "idpedido": 1,
    "idformadepagamento": 2,
    "valorpagamento": -100.00
  }'
```

**Resposta esperada (400):**
```json
{
  "success": false,
  "message": "valor deve ser maior que zero"
}
```

**Logs do servidor:**
```
[pagamento] ✓ idPedido válido: 1
[pagamento] ✓ idFormaPagamento válido: 2
[pagamento] ❌ valor inválido: não é positivo (-100)
```

---

### ❌ Teste 3.5: Valor com muitas casas decimais

```bash
curl -X POST "http://localhost:3000/api/pagamentos" \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=seu_session_id" \
  -d '{
    "idpedido": 1,
    "idformadepagamento": 2,
    "valorpagamento": 150.555
  }'
```

**Resposta esperada (400):**
```json
{
  "success": false,
  "message": "valor pode ter no máximo 2 casas decimais"
}
```

**Logs do servidor:**
```
[pagamento] ❌ valor inválido: mais de 2 casas decimais (150.555)
```

---

### ❌ Teste 3.6: Pedido não existe

```bash
curl -X POST "http://localhost:3000/api/pagamentos" \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=seu_session_id" \
  -d '{
    "idpedido": 99999,
    "idformadepagamento": 2,
    "valorpagamento": 150.50
  }'
```

**Resposta esperada (404):**
```json
{
  "success": false,
  "message": "Pedido 99999 não encontrado"
}
```

**Logs do servidor:**
```
[pagamento] ✓ Usuário autenticado: João Silva (CPF: 123.456.789-00)
[pagamento] ✓ idPedido válido: 99999
[pagamento] ✓ idFormaPagamento válido: 2
[pagamento] ✓ valor válido: 150.5
[pagamento] Verificando se pedido 99999 existe no banco...
[pagamentoRepo] Verificando se pedido 99999 existe...
[pagamentoRepo] ❌ Pedido 99999: não existe
[pagamento] ❌ Pedido não encontrado: 99999
```

---

### ❌ Teste 3.7: Forma de pagamento não existe

```bash
curl -X POST "http://localhost:3000/api/pagamentos" \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=seu_session_id" \
  -d '{
    "idpedido": 1,
    "idformadepagamento": 99999,
    "valorpagamento": 150.50
  }'
```

**Resposta esperada (404):**
```json
{
  "success": false,
  "message": "Forma de pagamento 99999 não encontrada ou inativa"
}
```

**Logs do servidor:**
```
[pagamento] Verificando se forma de pagamento 99999 existe e está ativa...
[pagamentoRepo] Verificando se forma de pagamento 99999 existe e está ativa...
[pagamentoRepo] ❌ Forma de pagamento 99999: não encontrada
[pagamento] ❌ Forma de pagamento não encontrada ou inativa: 99999
```

---

### ❌ Teste 3.8: Pedido não pertence ao usuário (acesso negado)

```bash
curl -X POST "http://localhost:3000/api/pagamentos" \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=outro_usuario_session" \
  -d '{
    "idpedido": 1,
    "idformadepagamento": 2,
    "valorpagamento": 150.50
  }'
```

(Assumindo que o session pertence a outro usuário)

**Resposta esperada (403):**
```json
{
  "success": false,
  "message": "Acesso negado: este pedido não pertence a você"
}
```

**Logs do servidor:**
```
[pagamento] ✓ Usuário autenticado: Outro Usuário (CPF: 987.654.321-00)
[pagamento] Verificando se pedido pertence ao usuário...
[pagamentoRepo] Verificando se pedido 1 pertence ao CPF 987.654.321-00...
[pagamentoRepo] ❌ Pedido 1: não pertence ao CPF 987.654.321-00
[pagamento] ❌ Acesso negado: pedido não pertence ao usuário
```

---

## Teste 4: GET /api/pagamentos/:idpagamento (Buscar pagamento)

### ✅ Teste 4.1: Sucesso - Buscar pagamento válido

```bash
curl -X GET "http://localhost:3000/api/pagamentos/1" \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=seu_session_id"
```

**Resposta esperada (200):**
```json
{
  "success": true,
  "message": "Pagamento encontrado",
  "pagamento": {
    "pedidoId": 1,
    "formaPagamentoId": 2,
    "valor": 150.50,
    "dataPagamento": "2025-12-01T14:30:00.000Z"
  }
}
```

---

### ❌ Teste 4.2: Não autenticado

```bash
curl -X GET "http://localhost:3000/api/pagamentos/1" \
  -H "Content-Type: application/json"
```

**Resposta esperada (401):**
```json
{
  "success": false,
  "message": "Usuário não autenticado"
}
```

---

### ❌ Teste 4.3: Pagamento não encontrado

```bash
curl -X GET "http://localhost:3000/api/pagamentos/99999" \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=seu_session_id"
```

**Resposta esperada (404):**
```json
{
  "success": false,
  "message": "Pagamento 99999 não encontrado"
}
```

---

### ❌ Teste 4.4: ID inválido

```bash
curl -X GET "http://localhost:3000/api/pagamentos/abc" \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=seu_session_id"
```

**Resposta esperada (400):**
```json
{
  "success": false,
  "message": "ID do pagamento deve ser um número positivo"
}
```

---

## Teste 5: Usar com Postman ou Insomnia

### Configuração de Ambiente:

```json
{
  "BASE_URL": "http://localhost:3000",
  "SESSION_ID": "seu_connect.sid_aqui",
  "PEDIDO_ID": "1",
  "FORMA_ID": "2"
}
```

### Template de Request (POST):

```
POST {{BASE_URL}}/api/pagamentos
Headers:
  - Content-Type: application/json
  - Cookie: connect.sid={{SESSION_ID}}

Body (raw JSON):
{
  "idpedido": {{PEDIDO_ID}},
  "idformadepagamento": {{FORMA_ID}},
  "valorpagamento": 150.50
}
```

---

## Monitoramento de Logs

O controlador emite logs detalhados. No terminal do servidor, você verá:

```
[pagamento] POST /api/pagamentos
[pagamento] body recebido: {"idpedido": 1, "idformadepagamento": 2, "valorpagamento": 150.50}
[pagamento] entrada normalizada: {"idPedido": 1, "idFormaPagamento": 2, "valor": 150.5}
[pagamento] ✓ Usuário autenticado: João Silva (CPF: 123.456.789-00)
[pagamento] ✓ idPedido válido: 1
[pagamento] ✓ idFormaPagamento válido: 2
[pagamento] ✓ valor válido: 150.5
[pagamento] Verificando se pedido 1 existe no banco...
[pagamentoRepo] Verificando se pedido 1 existe...
[pagamentoRepo] ✓ Pedido 1: existe
[pagamento] ✓ Pedido encontrado
[pagamento] Verificando se pedido pertence ao usuário...
[pagamentoRepo] Verificando se pedido 1 pertence ao CPF 123.456.789-00...
[pagamentoRepo] ✓ Pedido 1: pertence ao CPF 123.456.789-00
[pagamento] ✓ Pedido pertence ao usuário
[pagamento] Verificando se forma de pagamento 2 existe e está ativa...
[pagamentoRepo] Verificando se forma de pagamento 2 existe e está ativa...
[pagamentoRepo] ✓ Forma de pagamento 2: Cartão de Crédito
[pagamento] ✓ Forma de pagamento válida: Cartão de Crédito
[pagamento] Criando pagamento no banco...
[pagamentoRepo] Criando pagamento: pedido=1, forma=2, valor=150.5
[pagamentoRepo] Executando validações pré-inserção...
[pagamentoRepo] ✓ Todas as validações pré-inserção passaram
[pagamentoRepo] Executando INSERT...
[pagamentoRepo] ✓ Pagamento criado com sucesso: {...}
[pagamento] ✓ Pagamento criado com sucesso: {...}
```

---

## Dicas de Teste

1. **Para obter o session ID:**
   - Faça login primeiro
   - Copie o cookie `connect.sid` do navegador (DevTools > Application > Cookies)
   - Use em `-H "Cookie: connect.sid=valor"`

2. **Para facilitar testes repetidos:**
   - Crie um arquivo `test-pagamentos.sh` com todos os curl commands
   - Use variáveis de ambiente: `export SESSION_ID="..."`

3. **Aliases aceitos:**
   - `idpedido`, `pedidoId`, `pedido_id`, `pedidoidpedido`, `pedido`
   - `idformadepagamento`, `formaPagamentoId`, `forma_pagamento_id`, `formaId`, `forma`
   - `valorpagamento`, `valorpag`, `valor`, `valortotal`, `total`, `valortotalpagamento`

4. **Valores aceitáveis:**
   - Números inteiros positivos: `1`, `100`, `9999`
   - Decimais com até 2 casas: `150.50`, `99.99`, `1.00`
   - Strings numéricas também funcionam: `"150.50"`
   - Vírgula como separador funciona: `"150,50"`

5. **Verificar erros rapidamente:**
   - Se a resposta não é JSON, há erro do servidor
   - Use `| jq` no Linux/Mac para formatar: `curl ... | jq`
   - No PowerShell: `curl ... | ConvertFrom-Json | ConvertTo-Json`

