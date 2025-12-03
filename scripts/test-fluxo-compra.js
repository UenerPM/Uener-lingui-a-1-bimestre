#!/usr/bin/env node

/**
 * test-fluxo-compra.js
 * Script de teste do fluxo completo: login → carrinho → pedido → pagamento
 */

const http = require('http');

// Simular cookies/sessão
let sessionCookie = null;

function makeRequest(method, path, body = null, incluirCookie = true) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (incluirCookie && sessionCookie) {
      options.headers['Cookie'] = sessionCookie;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        // Capturar Set-Cookie para sessão
        if (res.headers['set-cookie']) {
          sessionCookie = res.headers['set-cookie'][0];
        }

        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, body: parsed, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, body: data, headers: res.headers });
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('\n╔════════════════════════════════════════════════╗');
  console.log('║  🧪 TESTE DO FLUXO COMPLETO DE COMPRA 🧪    ║');
  console.log('╚════════════════════════════════════════════════╝\n');

  try {
    // ========== TESTE 1: Login ==========
    console.log('📌 TESTE 1: LOGIN');
    console.log('─'.repeat(50));
    const loginRes = await makeRequest('POST', '/api/login', {
      email: 'adm@uener.com.br',
      senha: 'senha123'
    }, false);
    console.log(`Status: ${loginRes.status}`);
    console.log(`Resposta:`, JSON.stringify(loginRes.body, null, 2));
    
    if (!loginRes.body.success) {
      console.log('\n❌ Login falhou! Abortando testes.');
      return;
    }
    console.log('\n✅ Login bem-sucedido!\n');

    // ========== TESTE 2: Validar Sessão ==========
    console.log('📌 TESTE 2: VALIDAR SESSÃO');
    console.log('─'.repeat(50));
    const meRes = await makeRequest('GET', '/api/me');
    console.log(`Status: ${meRes.status}`);
    console.log(`Resposta:`, JSON.stringify(meRes.body, null, 2));
    if (meRes.body.success) {
      console.log('\n✅ Sessão validada!\n');
    } else {
      console.log('\n❌ Sessão inválida! Abortando testes.');
      return;
    }

    // ========== TESTE 3: Listar Produtos ==========
    console.log('📌 TESTE 3: LISTAR PRODUTOS');
    console.log('─'.repeat(50));
    const produtosRes = await makeRequest('GET', '/api/produtos');
    console.log(`Status: ${produtosRes.status}`);
    const produtos = produtosRes.body.data || [];
    console.log(`Total de produtos: ${produtos.length}`);
    if (produtos.length > 0) {
      console.log(`Primeiro produto:`, {
        idproduto: produtos[0].idproduto,
        nomeproduto: produtos[0].nomeproduto,
        preco: produtos[0].preco,
        estoque: produtos[0].estoque
      });
    }
    console.log('\n✅ Produtos carregados!\n');

    // ========== TESTE 4: Criar Pedido ==========
    console.log('📌 TESTE 4: CRIAR PEDIDO');
    console.log('─'.repeat(50));
    
    if (produtos.length < 2) {
      console.log('❌ Sem produtos suficientes para testar. Abortando.');
      return;
    }

    const itens = [
      { idproduto: produtos[0].idproduto, quantidade: 2 },
      { idproduto: produtos[1].idproduto, quantidade: 1 }
    ];
    const total = (produtos[0].preco * 2) + (produtos[1].preco * 1);

    console.log(`Itens do pedido:`, itens);
    console.log(`Total: R$ ${total.toFixed(2)}`);

    const pedidoRes = await makeRequest('POST', '/api/pedidos', { itens, total });
    console.log(`Status: ${pedidoRes.status}`);
    console.log(`Resposta:`, JSON.stringify(pedidoRes.body, null, 2));
    
    if (!pedidoRes.body.success) {
      console.log('\n❌ Falha ao criar pedido! Abortando testes.');
      return;
    }

    const idPedido = pedidoRes.body.pedido.idpedido;
    console.log(`\n✅ Pedido criado com sucesso! ID: ${idPedido}\n`);

    // ========== TESTE 5: Listar Formas de Pagamento ==========
    console.log('📌 TESTE 5: LISTAR FORMAS DE PAGAMENTO');
    console.log('─'.repeat(50));
    const formasRes = await makeRequest('GET', '/api/formas-pagamento');
    console.log(`Status: ${formasRes.status}`);
    const formas = formasRes.body.data || [];
    console.log(`Total de formas: ${formas.length}`);
    if (formas.length > 0) {
      console.log('Formas disponíveis:');
      formas.forEach(f => {
        console.log(`  - ${f.idformapagamento}: ${f.nomeformapagamento}`);
      });
    }
    console.log('\n✅ Formas de pagamento carregadas!\n');

    // ========== TESTE 6: Criar Pagamento ==========
    console.log('📌 TESTE 6: CRIAR PAGAMENTO');
    console.log('─'.repeat(50));
    
    const idFormaPagamento = formas.length > 0 ? formas[0].idformapagamento : 1;
    console.log(`Pedido ID: ${idPedido}`);
    console.log(`Forma de pagamento: ${idFormaPagamento}`);
    console.log(`Valor: R$ ${total.toFixed(2)}`);

    const pagamentoRes = await makeRequest('POST', '/api/pagamentos', {
      idpedido: idPedido,
      idformadepagamento: idFormaPagamento,
      valorpagamento: total
    });
    console.log(`Status: ${pagamentoRes.status}`);
    console.log(`Resposta:`, JSON.stringify(pagamentoRes.body, null, 2));
    
    if (!pagamentoRes.body.success) {
      console.log('\n❌ Falha ao criar pagamento! Abortando testes.');
      return;
    }

    console.log('\n✅ Pagamento registrado com sucesso!\n');

    // ========== TESTE 7: Listar Pedidos do Usuário ==========
    console.log('📌 TESTE 7: LISTAR PEDIDOS DO USUÁRIO');
    console.log('─'.repeat(50));
    const pedidosRes = await makeRequest('GET', '/api/pedidos');
    console.log(`Status: ${pedidosRes.status}`);
    const pedidos = pedidosRes.body.data || [];
    console.log(`Total de pedidos: ${pedidos.length}`);
    if (pedidos.length > 0) {
      console.log('Últimos pedidos:');
      pedidos.slice(0, 3).forEach(p => {
        console.log(`  - ID: ${p.idpedido}, Data: ${p.datadopedido}, Total itens: ${p.itens?.length || 0}`);
      });
    }
    console.log('\n✅ Pedidos listados!\n');

    // ========== RESULTADO FINAL ==========
    console.log('╔════════════════════════════════════════════════╗');
    console.log('║  ✅ TODOS OS TESTES PASSOU COM SUCESSO! ✅    ║');
    console.log('╚════════════════════════════════════════════════╝');
    console.log('\n🎉 Fluxo completo de compra funcionando corretamente!\n');

  } catch (err) {
    console.error('\n❌ ERRO DURANTE OS TESTES:', err.message);
    process.exit(1);
  }
}

// Aguardar servidor inicializar
setTimeout(() => {
  runTests();
}, 2000);
