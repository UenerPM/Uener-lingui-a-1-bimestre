# =====================================================
# TESTE RÁPIDO — SISTEMA DE PAGAMENTO
# =====================================================
# Salve como: test_pagamento.ps1
# Execute: .\test_pagamento.ps1

# Cores para output
$Verde = 'Green'
$Vermelho = 'Red'
$Amarelo = 'Yellow'
$Azul = 'Cyan'

Write-Host "`n========== TESTE SISTEMA DE PAGAMENTO ==========" -ForegroundColor $Azul
Write-Host "1. Testando GET /api/formas-pagamento`n" -ForegroundColor $Amarelo

try {
    $resp = Invoke-WebRequest -Uri "http://localhost:3000/api/formas-pagamento" `
        -Method Get `
        -UseBasicParsing -SkipHttpErrorCheck
    
    $json = $resp.Content | ConvertFrom-Json
    
    if ($json.success) {
        Write-Host "✅ Sucesso! Formas de pagamento listadas:" -ForegroundColor $Verde
        $json.formas | ForEach-Object {
            Write-Host "   - ID $($_.idformapagamento): $($_.nomeformapagamento)" -ForegroundColor $Verde
        }
    } else {
        Write-Host "❌ Erro na resposta: $($json.message)" -ForegroundColor $Vermelho
    }
}
catch {
    Write-Host "❌ Erro ao conectar: $_" -ForegroundColor $Vermelho
}

Write-Host "`n2. Testando POST /api/pagamentos (simulado)`n" -ForegroundColor $Amarelo

$payload = @{
    idpedido = 1
    idformadepagamento = 2
    valorpagamento = 50.00
} | ConvertTo-Json

Write-Host "Payload: $payload`n" -ForegroundColor $Azul

try {
    $resp = Invoke-WebRequest -Uri "http://localhost:3000/api/pagamentos" `
        -Method Post `
        -ContentType "application/json" `
        -Body $payload `
        -UseBasicParsing -SkipHttpErrorCheck
    
    $json = $resp.Content | ConvertFrom-Json
    
    if ($json.success) {
        Write-Host "✅ Pagamento criado com sucesso!" -ForegroundColor $Verde
        Write-Host "   Status HTTP: $($resp.StatusCode)" -ForegroundColor $Verde
        Write-Host "   Resposta: $($json.message)" -ForegroundColor $Verde
    } else {
        Write-Host "❌ Erro: $($json.message)" -ForegroundColor $Vermelho
        Write-Host "   Detalhes: $($json.error)" -ForegroundColor $Vermelho
    }
}
catch {
    $errorMsg = $_.Exception.Response.StatusCode
    Write-Host "❌ Erro HTTP ou conexão: $errorMsg" -ForegroundColor $Vermelho
    Write-Host "   (Isso é esperado se pedido/forma não existem no BD)" -ForegroundColor $Amarelo
}

Write-Host "`n========== FIM DO TESTE ==========" -ForegroundColor $Azul
Write-Host "`nPróximos passos:" -ForegroundColor $Amarelo
Write-Host "1. Verifique o console do servidor para logs [pagamento]"
Write-Host "2. Teste a página em browser: http://localhost:3000/pagamento.html"
Write-Host "3. Abra DevTools (F12) e veja Network para requisições"
Write-Host "`n"
