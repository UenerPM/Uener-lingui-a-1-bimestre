#!/usr/bin/env node

/**
 * test-endpoints.js
 * Script para testar os endpoints da API avap2
 */

const http = require('http');

function makeRequest(method, path, body = null) {
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

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, body: parsed, error: null });
        } catch (e) {
          resolve({ status: res.statusCode, body: data, error: e.message });
        }
      });
    });

    req.on('error', (err) => {
      resolve({ status: 0, body: null, error: err.message });
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('\n🧪 Iniciando testes de endpoints...\n');

  try {
    // Test 1: GET /api/produtos
    console.log('✅ Teste 1: GET /api/produtos');
    const produtosRes = await makeRequest('GET', '/api/produtos');
    if (produtosRes.error) {
      console.log(`   ✗ Erro de conexão: ${produtosRes.error}`);
    } else {
      console.log(`   Status: ${produtosRes.status}`);
      if (produtosRes.body && produtosRes.body.success) {
        console.log(`   ✓ Retornou ${produtosRes.body.data?.length || 0} produtos`);
        if (produtosRes.body.data && produtosRes.body.data.length > 0) {
          console.log(`   Primeiro produto: ${produtosRes.body.data[0].nomeproduto}`);
        }
      } else if (produtosRes.body) {
        console.log(`   ✗ Erro: ${produtosRes.body.message || 'Resposta inválida'}`);
      } else {
        console.log(`   ✗ Erro: ${produtosRes.error}`);
      }
    }

    // Test 2: GET /api/formas-pagamento
    console.log('\n✅ Teste 2: GET /api/formas-pagamento');
    const formasRes = await makeRequest('GET', '/api/formas-pagamento');
    if (formasRes.error) {
      console.log(`   ✗ Erro de conexão: ${formasRes.error}`);
    } else {
      console.log(`   Status: ${formasRes.status}`);
      if (formasRes.body && formasRes.body.success) {
        console.log(`   ✓ Retornou ${formasRes.body.data?.length || 0} formas de pagamento`);
      } else if (formasRes.body) {
        console.log(`   ✗ Erro: ${formasRes.body.message || 'Resposta inválida'}`);
      }
    }

    // Test 3: POST /api/login (deve falhar - email inválido)
    console.log('\n✅ Teste 3: POST /api/login (teste com credencial inválida)');
    const loginRes = await makeRequest('POST', '/api/login', {
      email: 'teste@teste.com',
      senha: 'senhateste'
    });
    if (loginRes.error) {
      console.log(`   ✗ Erro de conexão: ${loginRes.error}`);
    } else {
      console.log(`   Status: ${loginRes.status}`);
      if (loginRes.body) {
        console.log(`   Resultado: ${loginRes.body.message || 'Sem mensagem'}`);
      }
    }

    // Test 4: GET /api/me (sem autenticação)
    console.log('\n✅ Teste 4: GET /api/me (sem autenticação)');
    const meRes = await makeRequest('GET', '/api/me');
    if (meRes.error) {
      console.log(`   ✗ Erro de conexão: ${meRes.error}`);
    } else {
      console.log(`   Status: ${meRes.status}`);
      if (meRes.body) {
        console.log(`   Resultado: ${meRes.body.message || 'Sem mensagem'}`);
      }
    }

    console.log('\n✅ Testes completados!\n');
  } catch (err) {
    console.error('\n❌ Erro durante testes:', err.message);
    process.exit(1);
  }
}

runTests();
