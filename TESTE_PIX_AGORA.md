# 🔧 TESTE PIX COM CHAVE REAL (uperesmarcon@gmail.com)

## ✅ O que foi corrigido

1. **Chave PIX real**: `uperesmarcon@gmail.com` (agora está configurada)
2. **Endpoint novo**: `GET /api/pix-config` retorna a configuração PIX
3. **Frontend carrega config**: `carregarConfigPixBackend()` é chamada na inicialização
4. **Payload corrigido**: Usa a chave real na construção do EMV

---

## 🚀 Teste agora (passo a passo)

### 1. Reinicie o backend
```bash
npm start
```

### 2. Abra DevTools (F12) e vá para aba Network

### 3. Acesse a página de pagamento
```
http://localhost:3000/public/pagamento.html
```
OU
```
http://localhost:3000/pagamento.html
```

### 4. No console, observe os logs:
- Devem aparecer:
  ```
  ✓ Configuração PIX carregada do backend: uperesmarcon@gmail.com
  Gerando PIX para valor: R$ XX.XX
  ✓ Payload PIX gerado com sucesso
  Comprimento: XXX caracteres
  ✓ Validação de CRC passou
  QR Code URL gerada
  ✓ QR Code exibido
  ```

### 5. Verifique o payload gerado
- Deve conter: `br.gov.bcb.pix` (GUID)
- Deve conter: `uperesmarcon@gmail.com` (sua chave)
- Deve terminar com: `6304XXXX` (CRC16)

### 6. Teste o QR Code
- Abra um **leitor de QR Code** (app do banco, Google Lens, etc)
- Escaneie o QR gerado
- Deve **NÃO dar erro "código inválido"** mais

### 7. Teste o código copia-e-cola
- Clique no botão **"Copiar Código PIX"**
- Cole em um app PIX ou QR reader
- Deve funcionar corretamente

---

## 🔍 Se ainda der erro "PIX inválido"

### Verificação 1: Confirme a chave PIX
```bash
curl http://localhost:3000/api/pix-config
```

Deve retornar:
```json
{
  "success": true,
  "config": {
    "pixKey": "uperesmarcon@gmail.com",
    "merchantName": "UENER LINGUÇO",
    "merchantCity": "CAMPO MOURAO",
    "merchantDocument": "00000000000000"
  }
}
```

### Verificação 2: Verifique o payload no console
Rode no DevTools Console:
```javascript
// Simular geração
console.log(construirPayloadPix(50.00));
```

Copie o payload e valide em: https://brcode.dev/ (validador PIX online)

### Verificação 3: Teste com QR scanner simples
- Use um QR reader básico que apenas mostra o texto
- Se o banco rejeitar, pode ser porque a chave é email
  - Nesse caso, em produção use CPF/CNPJ da loja

---

## 📝 Próximos passos se funcionar

1. ✅ Teste com múltiplos valores
2. ✅ Copie o código em diferentes apps PIX
3. ✅ Verifique se o pagamento é registrado no banco
4. ✅ Teste cartão e dinheiro também

---

## 🎯 Se o teste passar

Parabéns! O PIX está funcionando 100%. Agora você pode:
- Usar em produção
- Configurar a chave PIX via `.env` (variável `PIX_KEY`)
- Adicionar webhook para confirmar pagamentos

