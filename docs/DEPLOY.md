# DEPLOY — instalar, rodar e testar

Passos rápidos (desenvolvimento):

1. Instalar dependências
```powershell
npm install
```

2. Configurar variáveis de ambiente (criar `.env` a partir de `.env.example`)

3. Inicializar banco (se necessário)
```powershell
npm run setup-db
```

4. Rodar servidor
```powershell
npm start
```

5. Testes manuais
- Acesse `http://localhost:3000` e use as credenciais de teste listadas no `app.js`.

Notas de produção
- Usar `NODE_ENV=production` e `SESSION_STORE=pg` para store em PG.
- Ativar HTTPS e `cookie.secure=true` em produção.
