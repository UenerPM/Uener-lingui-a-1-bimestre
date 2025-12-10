# ===== GUIA COMPLETO: SISTEMA DE IMAGENS DINÂMICAS =====
# Data: 2 de dezembro de 2025
# Versão: 1.0

## RESUMO EXECUTIVO

Você agora tem um sistema robusto de carregamento de imagens do seu projeto CRUD externo:

- ✅ Rota proxy: `/api/imagem?path=/imgs/...` (com validação segura)
- ✅ Rota estática: `/imgs/...` (fallback se EXTERNAL_IMAGES_PATH configurado)
- ✅ Proteção contra path traversal (../../../etc/passwd é bloqueado)
- ✅ Fallback automático para `public/img/no-image.png`
- ✅ Frontend atualizado para usar `construirUrlImagem()`
- ✅ Streams eficientes para arquivos grandes
- ✅ Logs detalhados para auditoria

---

## ARQUIVOS CRIADOS/MODIFICADOS

### 1. Nova Rota: `src/routes/imagem.js`
- **O quê**: Endpoint proxy `/api/imagem?path=...`
- **Segurança**: valida caminho, bloqueia `..`, rejeita paths absolutos
- **Streams**: usa `fs.createReadStream` (eficiente)
- **Fallback**: retorna `public/img/no-image.png` se arquivo não encontrado
- **Logs**: `[imagem]` tags para debug
- **MIME**: detecta tipo automaticamente (`mime-types`)

### 2. Modificado: `app.js`
Adicionou:
```javascript
const imagemRoute = require('./src/routes/imagem');
app.use('/api/imagem', imagemRoute);

// Rota estática se EXTERNAL_IMAGES_PATH configurado
if (EXTERNAL_IMAGES_PATH_STATIC) {
  app.use('/imgs', express.static(EXTERNAL_IMAGES_PATH_STATIC));
  app.use('/uploads', express.static(EXTERNAL_IMAGES_PATH_STATIC));
}
```

### 3. Atualizado: `public/js/script.js`
Nova função `construirUrlImagem(imagemCampo)`:
- Se `imagemCampo` é URL completa → usa direto
- Se começa com `/` → usa `/api/imagem?path=...`
- Senão → prefixar `/imgs/` e usar proxy
- Fallback final: `/imgs/default.png`

Função `carregarProdutos()` agora usa a helper acima.

### 4. Atualizado: `.env.example`
Adicionou variáveis:
```env
EXTERNAL_IMAGES_PATH=              # Caminho do projeto CRUD
PIX_KEY=...                        # Já existia
PIX_MERCHANT_NAME=...              # Já existia
PIX_MERCHANT_CITY=...              # Já existia
```

### 5. Novo: `TESTE_IMAGENS.ps1`
Script com exemplos de teste (PowerShell, curl, navegador).

---

## COMO CONFIGURAR

### Passo 1: Definir `EXTERNAL_IMAGES_PATH` no `.env`

**Windows** (exemplo real):
```env
EXTERNAL_IMAGES_PATH=C:\Users\upere\Projetos\crud-project\public
```

**Linux/Mac** (exemplo):
```env
EXTERNAL_IMAGES_PATH=/home/upere/projetos/crud-project/public
```

Certifique-se de que:
- O caminho existe
- Contém subpastas `/imgs` ou `/uploads`
- Imagens estão em: `{EXTERNAL_IMAGES_PATH}/imgs/produtos/caseira.png`

### Passo 2: Garantir que banco tem caminhos corretos

No banco `avap2`, a coluna `imagem` (ou equivalente) deve conter:
```sql
/imgs/produtos/salada.png
/imgs/linguicas/caseira.jpg
/uploads/linguica1.png
```

**Não** salve:
- Caminhos absolutos: `C:\Users\...` ou `/home/...`
- URLs completas: `http://localhost:3000/...`
- Apenas nome do arquivo: `salada.png` (sem `/`)

### Passo 3: Criar `public/img/no-image.png`

Fallback para quando imagem não existir. Se não existir, o servidor criará um placeholder no startup.

### Passo 4: Reiniciar servidor

```powershell
npm run dev
# ou
node app.js
```

Logs devem aparecer:
```
[app] Servindo /imgs de: C:\Users\upere\Projetos\crud-project\public
```

---

## COMO USAR

### No Frontend (HTML/JS)

```html
<!-- Antes (quebrado) -->
<img src="/imgs/produtos/salada.png" />

<!-- Depois (funcionando) -->
<img src="/api/imagem?path=/imgs/produtos/salada.png" 
     onerror="this.src='/imgs/default.png'" />
```

Ou usar a helper:
```javascript
const url = construirUrlImagem('/imgs/produtos/salada.png');
// Retorna: /api/imagem?path=/imgs/produtos/salada.png
```

### No Banco de Dados

Salvar sempre com prefixo `/`:
```sql
INSERT INTO produto (nome, imagem) VALUES ('Salada', '/imgs/produtos/salada.png');
INSERT INTO linguica (nome, imagem) VALUES ('Caseira', '/imgs/linguicas/caseira.jpg');
INSERT INTO oferta (nome, imagem) VALUES ('Promo', '/uploads/promo1.png');
```

### Fluxo Completo

```
1. Backend: SELECT * FROM linguicas;
   Resultado: { nome: "Salada", imagem: "/imgs/produtos/salada.png" }

2. Frontend: carregarProdutos()
   Renderiza: <img src="/api/imagem?path=/imgs/produtos/salada.png" />

3. Navegador: GET /api/imagem?path=/imgs/produtos/salada.png

4. Backend (imagem.js):
   - Valida path (OK)
   - Resolve: EXTERNAL_IMAGES_PATH + /imgs/produtos/salada.png
   - Abre arquivo com stream
   - Envia bytes ao navegador

5. Navegador:
   Renderiza imagem ✓
```

---

## SEGURANÇA

### O que está protegido

✅ Path traversal bloqueado:
- `/api/imagem?path=/../../../etc/passwd` → retorna fallback
- `/api/imagem?path=/..` → retorna fallback
- Paths absolutos: `/api/imagem?path=/root/senha.txt` → bloqueado

✅ Diretórios restringidos:
- Apenas `/imgs`, `/uploads`, `/images`, `/fotos` permitidos
- `/api`, `/admin`, `/config` → rejeitados

✅ Validação dupla:
- 1ª: isPathSafe() verifica .. e paths absolutos
- 2ª: resolve + compara com base (garante confinamento)

### O que ainda precisa ser cuidado

⚠️ Permissões de arquivo:
- Certifique-se que o usuário que roda Node tem leitura em EXTERNAL_IMAGES_PATH

⚠️ Espaço em disco:
- Não há limite de tamanho no stream (proteja via nginx/límite a montante)

⚠️ CORS (se frontend em domínio diferente):
- Rota `/api/imagem` mesmo servidor = sem problema
- Domínios cruzados = adicionar CORS headers em `imagem.js` se necessário

---

## TESTE RÁPIDO

### 1. PowerShell

```powershell
# Teste básico
$resp = Invoke-RestMethod "http://localhost:3000/api/imagem?path=/imgs/produtos/salada.png" -OutFile test.png
if (Test-Path test.png) { Write-Host "✓ OK" } else { Write-Host "✗ ERRO" }

# Teste de fallback (path inválido)
Invoke-RestMethod "http://localhost:3000/api/imagem?path=/../../../passwd" -OutFile test_fallback.png
# Deve retornar no-image.png, não /etc/passwd
```

### 2. Navegador

1. Abrir: `http://localhost:3000`
2. Pressionar F12 (DevTools)
3. Aba Network
4. Recarregar página
5. Procurar por: `/api/imagem?path=...`
6. Verificar se status é 200 e imagem renderiza

### 3. Logs no Terminal

```
[imagem] Requisição: /imgs/produtos/salada.png
[imagem] Resolvido para: C:\...\imgs\produtos\salada.png
[imagem] MIME type detectado: image/png
[imagem] ✓ Servindo arquivo: /imgs/produtos/salada.png (15234 bytes)
```

---

## TROUBLESHOOTING

### ❌ Imagens não aparecem (branco ou x)

**Causa 1**: `EXTERNAL_IMAGES_PATH` não configurado
```powershell
# Verificar
Get-Content .env | Select-String EXTERNAL_IMAGES_PATH
# Deve mostrar um caminho, não vazio
```

**Causa 2**: Caminho errado no `.env`
```powershell
Test-Path "C:\Users\upere\Projetos\crud-project\public"
# Deve retornar $true
```

**Causa 3**: Imagens não existem no caminho
```powershell
dir "C:\Users\upere\Projetos\crud-project\public\imgs\produtos\"
# Deve listar as imagens (salada.png, etc)
```

**Causa 4**: Banco tem caminhos errados
```sql
SELECT DISTINCT imagem FROM produto LIMIT 10;
-- Deve mostrar: /imgs/..., /uploads/..., etc (começando com /)
```

### ❌ Erro 400 ao chamar `/api/imagem`

**Causa**: Falta `?path=...` na URL
```
Errado:  GET /api/imagem
Certo:   GET /api/imagem?path=/imgs/produtos/salada.png
```

### ❌ Path traversal não bloqueado (segurança!)

**Verificar**:
```powershell
# Isto DEVE retornar no-image.png, não /etc/passwd
Invoke-RestMethod "http://localhost:3000/api/imagem?path=/../../../etc/passwd" -OutFile test.bin
file test.bin  # ou identify em PowerShell
```

Se ver conteúdo de texto (não PNG), há bug de segurança.

### ❌ Imagens lentas

**Otimizações**:
- Usar CDN para /imgs (nginx, CloudFlare, etc)
- Comprimir PNGs com `pngquant`, `optipng`
- Usar webp ao invés de png/jpg

---

## PRÓXIMOS PASSOS (OPCIONAL)

1. **Compressão automática**: Usar `sharp` ou `jimp` para redimensionar on-the-fly
2. **Cache**: Adicionar `Cache-Control: max-age=2592000` (30 dias)
3. **Webp**: Detectar suporte no navegador e servir `.webp` quando possível
4. **CDN**: Integrar com Cloudflare, AWS S3, etc
5. **Banco**: Adicionar coluna `imagem_tamanho`, `imagem_hash` para rastreamento

---

## SUPORTE E DEBUGGING

### Habilitar logs verbosos

Adicionar no `src/routes/imagem.js`:
```javascript
console.log(`[imagem] DEBUG: fullPath = ${fullPath}`);
console.log(`[imagem] DEBUG: base = ${base}`);
console.log(`[imagem] DEBUG: resolved = ${resolved}`);
```

### Monitorar network no DevTools

1. F12 → Network
2. Filtrar por: `img` ou `imagem`
3. Clicar na requisição
4. Ver headers: Content-Type, Content-Length, Cache-Control
5. Ver preview: deve mostrar imagem

---

## RESUMO DE ARQUIVOS

| Arquivo | Tipo | Status | Descrição |
|---------|------|--------|-----------|
| `src/routes/imagem.js` | Novo | ✅ Completo | Proxy seguro com validação |
| `app.js` | Modificado | ✅ Pronto | Monta rota + estático |
| `public/js/script.js` | Modificado | ✅ Pronto | Helper `construirUrlImagem()` |
| `.env.example` | Modificado | ✅ Pronto | Documentação config |
| `TESTE_IMAGENS.ps1` | Novo | ✅ Completo | Exemplos de teste |
| `public/img/no-image.png` | Existente | ✅ OK | Fallback |

---

## CONCLUSÃO

Seu sistema agora:
- ✅ Carrega imagens do projeto CRUD externo
- ✅ Valida e protege contra ataques
- ✅ Faz fallback automático
- ✅ É eficiente (streams)
- ✅ Tem logs úteis para debug

**Próximo**: Configure `EXTERNAL_IMAGES_PATH` em `.env` e reinicie o servidor!
