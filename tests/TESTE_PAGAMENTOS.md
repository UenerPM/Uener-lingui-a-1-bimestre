# 🎯 TESTE END-TO-END - SISTEMA DE PAGAMENTOS

## ✅ CHECKLIST DE VERIFICAÇÃO

Antes de testar, verificar:

```bash
# 1. Servidor rodando?
curl http://localhost:3000/health

# 2. Banco de dados ok?
# Verificar tabelas: pagamentos, formas_pagamento, pedidos

# 3. Rotas registradas?
curl -i http://localhost:3000/api/formas-pagamento

# 4. Autenticação ok?
# Fazer login first
```

---

## 🚀 TESTE 1: LISTAR FORMAS DE PAGAMENTO (GET /api/formas-pagamento)

### Request
```bash
curl -X GET http://localhost:3000/api/formas-pagamento \
  -H "Content-Type: application/json" \
  -b "connect.sid=SEU_SESSION_ID"
```

### Expected Response (200)
```json
{
  "success": true,
  "message": "Formas de pagamento listadas",
  "data": [
    { "id": 1, "nome": "Cartão de Crédito", "descricao": "...", "ativo": true },
    { "id": 2, "nome": "Cartão de Débito", "descricao": "...", "ativo": true },
    { "id": 3, "nome": "PIX", "descricao": "...", "ativo": true },
    { "id": 4, "nome": "Dinheiro", "descricao": "...", "ativo": true }
  ],
  "formas": [...]
}
```

---

## 🚀 TESTE 2: CRIAR PAGAMENTO VÁLIDO (POST /api/pagamentos)

### Precondições
- ✅ Usuário autenticado (session cookie)
- ✅ Pedido existente no BD (id = 1)
- ✅ Forma de pagamento ativa (id = 1, 2, 3 ou 4)

### Request - Variante 1 (Nomes padrão)
```bash
curl -X POST http://localhost:3000/api/pagamentos \
  -H "Content-Type: application/json" \
  -b "connect.sid=SEU_SESSION_ID" \
  -d '{
    "idpedido": 1,
    "idformadepagamento": 3,
    "valorpagamento": 50.00
  }'
```

### Request - Variante 2 (Aliases alternativos)
```bash
curl -X POST http://localhost:3000/api/pagamentos \
  -H "Content-Type: application/json" \
  -b "connect.sid=SEU_SESSION_ID" \
  -d '{
    "pedidoId": 1,
    "formaPagamentoId": 3,
    "valor": 50.00
  }'
```

### Expected Response (201)
```json
{
  "success": true,
  "message": "Pagamento registrado com sucesso",
  "idPagamento": 1,
  "pedidoId": 1,
  "formaPagamentoId": 3,
  "valor": 50.00,
  "status": "pendente",
  "dataPagamento": "2025-12-01T08:00:00Z"
}
```

### Logs esperados no console
```
[pagamento] ➡️  POST /api/pagamentos iniciado
[pagamento] ✓ Usuário autenticado: cpf_or_username
[pagamento] Body recebido: {...}
[pagamento] Campos normalizados: pedido=1, forma=3, valor=50
[pagamento] ✓ idPedido validado: 1
[pagamento] ✓ idFormaPagamento validado: 3
[pagamento] ✓ Valor validado: R$ 50.00
[pagamento] Verificando pedido 1 no banco...
[pagamento] ✓ Pedido encontrado: pedido_number_123
[pagamento] ✓ Pedido pertence ao usuário (ou admin)
[pagamento] Verificando forma de pagamento 3...
[pagamento] ✓ Forma de pagamento validada: PIX
[pagamento] Inserindo pagamento no banco...
[pagamento] ✓ Pagamento criado com sucesso!
[pagamento]   ID: 1
[pagamento]   Pedido: 1
[pagamento]   Forma: 3
[pagamento]   Valor: R$ 50.00
[pagamento]   Status: pendente
```

---

## ❌ TESTE 3: ERRO - PEDIDO NÃO ENCONTRADO

### Request
```bash
curl -X POST http://localhost:3000/api/pagamentos \
  -H "Content-Type: application/json" \
  -b "connect.sid=SEU_SESSION_ID" \
  -d '{
    "idpedido": 99999,
    "idformadepagamento": 3,
    "valorpagamento": 50.00
  }'
```

### Expected Response (404)
```json
{
  "success": false,
  "message": "Pedido não encontrado"
}
```

### Console Log
```
[pagamento] ❌ Pedido não encontrado: 99999
```

---

## ❌ TESTE 4: ERRO - FORMA DE PAGAMENTO INVÁLIDA

### Request
```bash
curl -X POST http://localhost:3000/api/pagamentos \
  -H "Content-Type: application/json" \
  -b "connect.sid=SEU_SESSION_ID" \
  -d '{
    "idpedido": 1,
    "idformadepagamento": 99999,
    "valorpagamento": 50.00
  }'
```

### Expected Response (404)
```json
{
  "success": false,
  "message": "Forma de pagamento não encontrada"
}
```

---

## ❌ TESTE 5: ERRO - VALOR INVÁLIDO (ZERO OU NEGATIVO)

### Request
```bash
curl -X POST http://localhost:3000/api/pagamentos \
  -H "Content-Type: application/json" \
  -b "connect.sid=SEU_SESSION_ID" \
  -d '{
    "idpedido": 1,
    "idformadepagamento": 3,
    "valorpagamento": 0
  }'
```

### Expected Response (400)
```json
{
  "success": false,
  "message": "Valor deve ser um número positivo"
}
```

---

## ❌ TESTE 6: ERRO - CAMPOS OBRIGATÓRIOS AUSENTES

### Request (sem valor)
```bash
curl -X POST http://localhost:3000/api/pagamentos \
  -H "Content-Type: application/json" \
  -b "connect.sid=SEU_SESSION_ID" \
  -d '{
    "idpedido": 1,
    "idformadepagamento": 3
  }'
```

### Expected Response (400)
```json
{
  "success": false,
  "message": "Valor do pagamento é obrigatório"
}
```

---

## ❌ TESTE 7: ERRO - NÃO AUTENTICADO

### Request (sem session cookie)
```bash
curl -X POST http://localhost:3000/api/pagamentos \
  -H "Content-Type: application/json" \
  -d '{
    "idpedido": 1,
    "idformadepagamento": 3,
    "valorpagamento": 50.00
  }'
```

### Expected Response (401)
```json
{
  "success": false,
  "message": "Usuário não autenticado"
}
```

---

## 🔍 TESTE 8: BUSCAR PAGAMENTO CRIADO (GET /api/pagamentos/:idpagamento)

### Request
```bash
curl -X GET http://localhost:3000/api/pagamentos/1 \
  -H "Content-Type: application/json" \
  -b "connect.sid=SEU_SESSION_ID"
```

### Expected Response (200)
```json
{
  "success": true,
  "message": "Pagamento encontrado",
  "data": {
    "id": 1,
    "pedido_id": 1,
    "forma_pagamento_id": 3,
    "valor": "50.00",
    "status": "pendente",
    "forma_nome": "PIX",
    "numero_pedido": "PED-001",
    "created_at": "2025-12-01T08:00:00Z"
  }
}
```

---

## 📋 SCRIPT DE TESTE COMPLETO (PowerShell)

```powershell
# Configuração
$BASE_URL = "http://localhost:3000"
$SESSION_ID = "seu_connect.sid_aqui"

# Função auxiliar
function Test-Endpoint {
    param(
        [string]$Method,
        [string]$Endpoint,
        [object]$Body,
        [string]$Description
    )
    
    Write-Host "`n=== $Description ===" -ForegroundColor Cyan
    
    $headers = @{
        "Content-Type" = "application/json"
        "Cookie" = "connect.sid=$SESSION_ID"
    }
    
    if ($Body) {
        Write-Host "Request Body: $($Body | ConvertTo-Json)" -ForegroundColor Yellow
        $response = Invoke-RestMethod -Uri "$BASE_URL$Endpoint" -Method $Method -Headers $headers -Body ($Body | ConvertTo-Json)
    } else {
        $response = Invoke-RestMethod -Uri "$BASE_URL$Endpoint" -Method $Method -Headers $headers
    }
    
    Write-Host "Response:" -ForegroundColor Green
    Write-Host ($response | ConvertTo-Json) -ForegroundColor Green
    
    return $response
}

# Testes
Test-Endpoint -Method GET -Endpoint "/api/formas-pagamento" -Description "Listar Formas de Pagamento"

$body1 = @{
    idpedido = 1
    idformadepagamento = 3
    valorpagamento = 50.00
}
Test-Endpoint -Method POST -Endpoint "/api/pagamentos" -Body $body1 -Description "Criar Pagamento Válido"

$body2 = @{
    idpedido = 1
    idformadepagamento = 99999
    valorpagamento = 50.00
}
Test-Endpoint -Method POST -Endpoint "/api/pagamentos" -Body $body2 -Description "Teste Erro: Forma Inválida"

$body3 = @{
    idpedido = 1
    idformadepagamento = 3
    valorpagamento = 0
}
Test-Endpoint -Method POST -Endpoint "/api/pagamentos" -Body $body3 -Description "Teste Erro: Valor Zero"

Write-Host "`n✅ Testes concluídos!" -ForegroundColor Green
```

---

## 📊 MATRIZ DE TESTES

| # | Teste | Endpoint | Método | Status Esperado | Validações |
|---|-------|----------|--------|-----------------|------------|
| 1 | Listar formas | `/api/formas-pagamento` | GET | 200 | Autenticação opcional |
| 2 | Criar (válido) | `/api/pagamentos` | POST | 201 | Todos os campos |
| 3 | Pedido não existe | `/api/pagamentos` | POST | 404 | idPedido |
| 4 | Forma inválida | `/api/pagamentos` | POST | 404 | idFormaPagamento |
| 5 | Valor inválido | `/api/pagamentos` | POST | 400 | valor > 0 |
| 6 | Campos faltando | `/api/pagamentos` | POST | 400 | Obrigatoriedade |
| 7 | Não autenticado | `/api/pagamentos` | POST | 401 | session.user |
| 8 | Buscar pagamento | `/api/pagamentos/:id` | GET | 200 | Ownership check |

---

## 🐛 TROUBLESHOOTING

### Erro: "Usuário não autenticado"
✅ Solução: Fazer login primeiro e obter session cookie
```bash
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{"username":"adm","password":"123"}'

# Depois usar -b cookies.txt nos próximos requests
```

### Erro: "Pedido não encontrado"
✅ Solução: Verificar ID do pedido no BD
```sql
SELECT id, numero_pedido, user_id FROM pedidos LIMIT 5;
```

### Erro: "Forma de pagamento não encontrada"
✅ Solução: Usar IDs válidos (1-4) ou verificar BD
```sql
SELECT id, nome FROM formas_pagamento WHERE ativo = true;
```

### Logs não aparecem
✅ Solução: Verificar NODE_ENV e nível de log
```bash
NODE_ENV=development node app.js
```

---

## ✨ PRÓXIMOS PASSOS

1. ✅ Testar endpoint manualmente
2. ✅ Verificar logs do backend
3. ✅ Testar validações de entrada
4. ✅ Testar página de pagamento (frontend)
5. ✅ Testar fluxo end-to-end completo
6. ✅ Deploy em produção

---

**Data**: 2025-12-01  
**Status**: ✅ Pronto para Teste  
**Última atualização**: Versão 2025 - Sistema Completo
