#!/usr/bin/env pwsh
# Script de teste para a API de Pagamentos (avap2)
# Uso: .\test-pagamentos.ps1

param(
    [string]$SessionId = "",
    [string]$BaseUrl = "http://localhost:3000",
    [int]$PedidoId = 1,
    [int]$FormaId = 2,
    [decimal]$Valor = 150.50
)

# Cores para output
$Green = "`e[32m"
$Red = "`e[31m"
$Yellow = "`e[33m"
$Reset = "`e[0m"

function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Method,
        [string]$Url,
        [object]$Body = $null,
        [string]$ExpectedStatus = "200"
    )
    
    Write-Host "`n$Yellow► Teste: $Name$Reset"
    Write-Host "  Método: $Method"
    Write-Host "  URL: $Url"
    
    if ($Body) {
        Write-Host "  Body: $(($Body | ConvertTo-Json -Depth 1) -replace "`n", ' ')"
    }
    
    try {
        $headers = @{
            "Content-Type" = "application/json"
        }
        
        if ($SessionId) {
            $headers["Cookie"] = "connect.sid=$SessionId"
        }
        
        $splat = @{
            Uri     = $Url
            Method  = $Method
            Headers = $headers
        }
        
        if ($Body) {
            $splat["Body"] = $Body | ConvertTo-Json
        }
        
        $response = Invoke-WebRequest @splat -ErrorAction Stop
        $status = $response.StatusCode
        $data = $response.Content | ConvertFrom-Json
        
        Write-Host "$Green✓ Status: $status$Reset"
        Write-Host "  Response: $(($data | ConvertTo-Json -Depth 1) -replace "`n", ' ')"
        
        return $data
    }
    catch {
        $response = $_.Exception.Response
        
        if ($response) {
            $status = [int]$response.StatusCode
            $content = $_.Exception.Response.Content.ReadAsString()
            $data = $content | ConvertFrom-Json -ErrorAction SilentlyContinue
            
            Write-Host "$Red✗ Status: $status$Reset"
            Write-Host "  Response: $(($data | ConvertTo-Json -Depth 1) -replace "`n", ' ')"
            
            return $data
        }
        else {
            Write-Host "$Red✗ Erro: $($_.Exception.Message)$Reset"
            return $null
        }
    }
}

# ============================================================================
# TESTES PRINCIPAIS
# ============================================================================

Write-Host "`n$Green=== TESTE 1: Listar Formas de Pagamento ===$Reset"
$formas = Test-Endpoint `
    -Name "GET /api/formas-pagamento" `
    -Method "GET" `
    -Url "$BaseUrl/api/formas-pagamento"

if ($formas.formas) {
    Write-Host "$Green✓ Formas encontradas: $($formas.formas.Count)$Reset"
}

Write-Host "`n$Green=== TESTE 2: Criar Pagamento (sem autenticação) ===$Reset"
$result = Test-Endpoint `
    -Name "POST /api/pagamentos (sem cookie)" `
    -Method "POST" `
    -Url "$BaseUrl/api/pagamentos" `
    -Body @{
        idpedido = $PedidoId
        idformadepagamento = $FormaId
        valorpagamento = $Valor
    }

Write-Host "`n$Green=== TESTE 3: Criar Pagamento (com dados válidos) ===$Reset"
if ($SessionId) {
    $pagamento = Test-Endpoint `
        -Name "POST /api/pagamentos (com cookie)" `
        -Method "POST" `
        -Url "$BaseUrl/api/pagamentos" `
        -Body @{
            idpedido = $PedidoId
            idformadepagamento = $FormaId
            valorpagamento = $Valor
        }
    
    if ($pagamento.idPagamento) {
        Write-Host "$Green✓ Pagamento criado: ID $($pagamento.idPagamento)$Reset"
    }
}
else {
    Write-Host "$Yellow⚠ SessionId não fornecido - pulando teste autenticado$Reset"
    Write-Host "$Yellow  Use: .\test-pagamentos.ps1 -SessionId 'seu_session_id'$Reset"
}

Write-Host "`n$Green=== TESTE 4: Criar Pagamento (valor negativo) ===$Reset"
$result = Test-Endpoint `
    -Name "POST /api/pagamentos (valor negativo)" `
    -Method "POST" `
    -Url "$BaseUrl/api/pagamentos" `
    -Body @{
        idpedido = $PedidoId
        idformadepagamento = $FormaId
        valorpagamento = -100
    }

Write-Host "`n$Green=== TESTE 5: Criar Pagamento (pedido inválido) ===$Reset"
$result = Test-Endpoint `
    -Name "POST /api/pagamentos (pedido 99999)" `
    -Method "POST" `
    -Url "$BaseUrl/api/pagamentos" `
    -Body @{
        idpedido = 99999
        idformadepagamento = $FormaId
        valorpagamento = $Valor
    }

Write-Host "`n$Green=== TESTE 6: Buscar Pagamento ===$Reset"
if ($SessionId) {
    $pagamento = Test-Endpoint `
        -Name "GET /api/pagamentos/$PedidoId" `
        -Method "GET" `
        -Url "$BaseUrl/api/pagamentos/$PedidoId"
}
else {
    Write-Host "$Yellow⚠ SessionId não fornecido - pulando$Reset"
}

Write-Host "`n$Green=== TESTES COMPLETOS ===$Reset"
Write-Host "`nPróximas ações:`n"
Write-Host "1. Verificar os logs da aplicação (procure por [pagamento])"
Write-Host "2. Testar com dados reais do seu banco de dados"
Write-Host "3. Consulte TESTES_PAGAMENTOS.md para mais exemplos"
Write-Host "4. Use Postman/Insomnia para testes mais avançados`n"
