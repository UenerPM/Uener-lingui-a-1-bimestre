# ===== TESTE DO SISTEMA DE IMAGENS =====
#
# Este arquivo contém instruções e comandos para testar o sistema de imagens
#
# Pré-requisitos:
# 1. Servidor rodando: npm run dev (ou node app.js)
# 2. EXTERNAL_IMAGES_PATH configurado no .env (caminho do projeto CRUD)
# 3. Imagens existentes no projeto CRUD em /imgs ou /uploads
#

# ===== 1. TESTE DA ROTA /api/imagem (Proxy seguro) =====

# PowerShell: Testar com arquivo válido
Invoke-RestMethod "http://localhost:3000/api/imagem?path=/imgs/produtos/salada.png" -OutFile test_imagem.png
if (Test-Path test_imagem.png) { Write-Host "✓ Imagem baixada com sucesso" } else { Write-Host "✗ ERRO: Arquivo não baixado" }

# PowerShell: Testar path traversal (deve falhar com fallback)
Invoke-RestMethod "http://localhost:3000/api/imagem?path=/../../../etc/passwd" -OutFile test_attack.bin
# Deve retornar imagem padrão (no-image.png), não o arquivo /etc/passwd

# PowerShell: Testar diretório não permitido (deve retornar fallback)
Invoke-RestMethod "http://localhost:3000/api/imagem?path=/admin/secret.png" -OutFile test_invalid.bin

# PowerShell: Testar sem parâmetro path (deve retornar JSON 400)
Invoke-RestMethod "http://localhost:3000/api/imagem" -UseBasicParsing | ConvertTo-Json

# ===== 2. TESTE DA ROTA /imgs (Estática direto) =====

# Se EXTERNAL_IMAGES_PATH estiver configurado:
# PowerShell: Acessar diretamente (bypass proxy)
Invoke-RestMethod "http://localhost:3000/imgs/produtos/salada.png" -OutFile test_static.png

# ===== 3. TESTE NO NAVEGADOR =====

# Abrir e recarregar a página inicial para ver as imagens
# URL: http://localhost:3000/index.html
#
# Verificar no DevTools (F12 → Network):
# - Imagens devem aparecer em /api/imagem?path=...
# - Status 200 se arquivo existe
# - Se arquivo não existe, status 200 mas com imagem padrão (no-image.png)
# - Se houver erro, fallback aparece
#
# Verificar Console (F12 → Console):
# - Logs [imagem] mostram qual arquivo foi requisitado
# - Logs ✓ mostram sucesso
# - Logs ❌ mostram erros (arquivo não encontrado, etc)

# ===== 4. TESTE COM CURL (Linux/Mac/Windows com WSL) =====

# Testar imagem existente
curl -i "http://localhost:3000/api/imagem?path=/imgs/produtos/salada.png" -o test_curl.png

# Testar path traversal (verificar que retorna fallback)
curl -i "http://localhost:3000/api/imagem?path=/../../../etc/passwd"

# Testar sem path (400 Bad Request)
curl -i "http://localhost:3000/api/imagem"

# ===== 5. TESTE DE LOGS =====

# Observar no terminal onde rodou npm start ou node app.js:
# [imagem] Requisição: /imgs/produtos/salada.png
# [imagem] ✓ Servindo arquivo: /imgs/produtos/salada.png (15234 bytes)
#
# Para arquivo não encontrado:
# [imagem] Arquivo não encontrado: [caminho]
# [imagem] ✓ Servindo fallback: public/img/no-image.png

# ===== 6. TESTE DE SEGURANÇA =====

# Todos estes devem retornar fallback (não arquivo real):
# - /api/imagem?path=../../../../etc/passwd
# - /api/imagem?path=/../../secrets.env
# - /api/imagem?path=/admin/config.json
# - /api/imagem?path=/../.env

# ===== 7. CHECKLIST DE CONFIGURAÇÃO =====

# [ ] EXTERNAL_IMAGES_PATH está definido em .env
# [ ] Caminho aponta para pasta com /imgs ou /uploads
# [ ] Imagens realmente existem em: EXTERNAL_IMAGES_PATH + /imgs/...
# [ ] public/img/no-image.png existe (fallback)
# [ ] Servidor iniciou sem erros
# [ ] Banco tem caminhos de imagem: /imgs/*, /uploads/*
# [ ] Frontend carrega: GET /api/linguicas retorna produtos com campo "imagem"

# ===== 8. RESOLVENDO PROBLEMAS =====

# ❌ Problema: GET /api/imagem retorna 400
# ✓ Solução: Passar parâmetro ?path=/imgs/... na URL

# ❌ Problema: Imagens não aparecem (404)
# ✓ Solução: 
#   - Verificar EXTERNAL_IMAGES_PATH em .env
#   - Verificar se arquivo realmente existe no caminho
#   - Verificar logs no servidor ([imagem] ❌ Arquivo não encontrado)

# ❌ Problema: Path traversal não está bloqueado
# ✓ Solução: Rota valida com isPathSafe() - deve retornar fallback para (..)

# ❌ Problema: CORS bloqueando imagem
# ✓ Solução: Usar /api/imagem ou /imgs (mesmo servidor, sem CORS needed)

# ===== 9. EXEMPLO COMPLETO DE FLUXO =====

# 1. Banco tem registro: produto.imagem = "/imgs/produtos/caseira.png"
# 2. Frontend chama: GET /api/linguicas
# 3. API retorna: { nome: "Linguiça Caseira", imagem: "/imgs/produtos/caseira.png" }
# 4. Frontend renderiza: <img src="/api/imagem?path=/imgs/produtos/caseira.png" />
# 5. Navegador requisita: GET /api/imagem?path=/imgs/produtos/caseira.png
# 6. Backend valida (isPathSafe = true, arquivo existe)
# 7. Backend serve arquivo com stream
# 8. Navegador renderiza imagem ✓

# ===== 10. REMOCAO DE TESTES =====

# Após verificação, remover arquivos de teste:
Remove-Item -Force test_imagem.png -ErrorAction SilentlyContinue
Remove-Item -Force test_attack.bin -ErrorAction SilentlyContinue
Remove-Item -Force test_invalid.bin -ErrorAction SilentlyContinue
Remove-Item -Force test_static.png -ErrorAction SilentlyContinue
Remove-Item -Force test_curl.png -ErrorAction SilentlyContinue
