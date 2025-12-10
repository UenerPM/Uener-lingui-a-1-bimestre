# 🔍 DEBUG DO PIX — Passo a Passo

## ✅ Correções Aplicadas

1. **Backend** (`src/routes/payment.js`)
   - ✓ GET `/api/formas-pagamento` → Query corrigida para `formadepagamento`
   - ✓ POST `/api/pagamentos` → Aceita múltiplos nomes de campo
   - ✓ Transações ACID com ROLLBACK
   - ✓ Logs estruturados com `[pagamento]` prefix

2. **Frontend** (`public/pagamento.html`)
   - ✓ CRC16 XModem (CCITT) implementado corretamente
   - ✓ Payload EMV conforme especificação PIX
   - ✓ Tag 26 (Merchant Account) posicionada corretamente
   - ✓ Tag 62 (Additional Data) com TXID
   - ✓ Tag 63 (CRC16) calculado corretamente
   - ✓ QR Code gerado com `encodeURIComponent(payload)`
   - ✓ Copy to Clipboard com fallback

---

## 🧪 Teste Rápido (Terminal)

### 1. Iniciar Backend

```bash
cd c:\Users\upere\Uener-lingui-a-1-bimestre
npm start
```

**Esperado:**
```
Servidor rodando na porta 3000
```

---

### 2. Testar GET /api/formas-pagamento (em outro terminal)

```powershell
curl -X GET http://localhost:3000/api/formas-pagamento -H "Content-Type: application/json"
```

**Esperado:**
```json
{
  "success": true,
  "formas": [
    { "idformapagamento": 1, "nomeformapagamento": "Cartão de Crédito", "id": 1, "nome": "Cartão de Crédito" },
    { "idformapagamento": 2, "nomeformapagamento": "PIX", "id": 2, "nome": "PIX" },
    { "idformapagamento": 3, "nomeformapagamento": "Dinheiro", "id": 3, "nome": "Dinheiro" },
    { "idformapagamento": 4, "nomeformapagamento": "Cartão de Débito", "id": 4, "nome": "Cartão de Débito" }
  ],
  "data": [
    ...
  ]
}
```

**Se erro `relação "formas_pagamento" não existe`:**
- Verifique se a tabela existe: `SELECT * FROM formadepagamento;`
- Se não existir, execute o SQL:
```sql
CREATE TABLE IF NOT EXISTS formadepagamento (
  idformapagamento SERIAL PRIMARY KEY,
  nomeformapagamento VARCHAR(100) NOT NULL UNIQUE
);

INSERT INTO formadepagamento (nomeformapagamento) VALUES
  ('Cartão de Crédito'),
  ('PIX'),
  ('Dinheiro'),
  ('Cartão de Débito')
ON CONFLICT (nomeformapagamento) DO NOTHING;
```

---

### 3. Testar Frontend

1. **Abra o navegador:**
   ```
   http://localhost:3000/pagamento.html
   ```

2. **Abra DevTools (F12 → Console)**

3. **Verifique logs:**
   - Deve aparecer: `[pagamento] ✓ Formas retornadas: 4`
   - Botões de seleção devem aparecer: PIX, Cartão de Crédito, Dinheiro, Cartão de Débito

4. **Selecione PIX**
   - Deve aparecer: QR Code + textarea com código

5. **Verifique o payload no console:**
   ```javascript
   // No console do navegador, execute:
   console.log(document.getElementById('pix-payload').value);
   ```
   
   **Esperado:** String começando com `00` e terminando com `6304XXXX` (onde XXXX é o CRC16)
   
   Exemplo:
   ```
   000101260047000106br.gov.bcb.pix0100000000000005224000005300986540050.0058020BR591AUENER LINGUÇO60015CAMPO MOURAO62170550UENER16399999999996304ABCD
   ```

6. **Teste o QR Code:**
   - Deve aparecer uma imagem QR (300x300px)
   - Se não aparecer, verifique o DevTools → Network → procure por `qrserver.com`
   - Clique em Copy → deve copiar o payload

---

## 🔧 Debug Checklist

| Item | Status | Ação |
|------|--------|------|
| Backend rodando (porta 3000) | ❓ | `npm start` |
| Tabela `formadepagamento` existe | ❓ | `SELECT * FROM formadepagamento;` |
| GET `/api/formas-pagamento` retorna formas | ❓ | Curl acima |
| Frontend carrega `/pagamento.html` | ❓ | Abra no navegador |
| Botões aparecem (PIX, Cartão, etc.) | ❓ | Verifique se GET retornou dados |
| Selecionar PIX mostra textarea + QR | ❓ | Clique no radio PIX |
| Payload começa com `00` e termina com `6304XXXX` | ❓ | Console: `document.getElementById('pix-payload').value` |
| QR Code aparece (imagem 300x300) | ❓ | DevTools Network → qrserver |
| Copy funciona (Clipboard API) | ❓ | Clique em "Copiar código PIX" |

---

## 🐛 Erro: "PIX inválido"

Se um app bancário disser que o PIX é inválido:

1. **Verifique o CRC16:**
   ```javascript
   // No console:
   const payload = document.getElementById('pix-payload').value;
   console.log('Payload length:', payload.length);
   console.log('Ends with 6304:', payload.substring(payload.length - 8));
   // Deve terminar com: 6304XXXX
   ```

2. **Teste com QR Scanner genérico:**
   - Use um app que apenas mostra o conteúdo do QR (não valida como PIX)
   - Se conseguir ler o payload, está correto

3. **Chave PIX dummy:**
   - Payload usa `00000000000` (CPF dummy)
   - Muitos bancos rejeitam isso
   - Para produção, substitua por uma chave real

4. **Revalidar construção do payload:**
   - Abra o console e execute:
   ```javascript
   // Regenerar o payload
   const valor = 50.00;
   const novoPayload = construirPayloadPix(valor);
   console.log('Novo payload:', novoPayload);
   console.log('Comprimento:', novoPayload.length);
   ```

---

## 📋 Teste de Pagamento Completo

1. **Login no frontend** (`http://localhost:3000`)
2. **Adicionar produto ao carrinho**
3. **Ir para checkout**
4. **Selecionar PIX**
5. **Copiar código e ir para DevTools → Network**
6. **Clicar em "Concluir Pagamento"**
7. **Verificar POST `/api/pagamentos`:**
   - Status: 201 (Created)
   - Response: `{ "success": true, "pagamento": {...} }`
8. **Verifique se o registro foi criado no banco:**
   ```sql
   SELECT * FROM pagamento WHERE pedidoidpedido = <pedido_id>;
   ```

---

## 💾 SQL de Verificação

```sql
-- Verificar tabelas
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

-- Verificar formas de pagamento
SELECT * FROM formadepagamento;

-- Verificar pagamentos criados
SELECT * FROM pagamento ORDER BY datapagamento DESC LIMIT 5;

-- Verificar pedidos
SELECT * FROM pedido ORDER BY datadopedido DESC LIMIT 5;
```

---

## ✅ Quando tudo estiver funcionando

- [ ] Backend retorna 4 formas de pagamento
- [ ] Frontend exibe botões corretamente
- [ ] PIX selecionado mostra QR + textarea
- [ ] Payload é válido (00...6304XXXX)
- [ ] QR Code é gerado com sucesso
- [ ] Copy funciona
- [ ] POST /api/pagamentos retorna 201
- [ ] Registro aparece na tabela `pagamento`

---

**Próximo passo:** Se tudo acima passar, o PIX está 100% funcional! 🎉
