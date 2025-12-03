/**
 * test-avap2.js
 * Script de teste para validar as APIs do avap2
 * 
 * Uso: node scripts/test-avap2.js
 */

const http = require('http');

const BASE_URL = 'http://localhost:3000';
let sessionCookie = '';

function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        'Cookie': sessionCookie
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed, headers: res.headers });
        } catch (err) {
          resolve({ status: res.statusCode, data, headers: res.headers });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runTests() {
  console.log('\n🧪 Iniciando testes da API avap2...\n');

  try {
    // ===== TEST 1: GET /api/produtos =====
    console.log('1️⃣  GET /api/produtos');
    let res = await makeRequest('GET', '/api/produtos');
    console.log(`   Status: ${res.status}`);
    if (res.data.success) {
      console.log(`   ✅ Produtos carregados: ${res.data.data?.length || 0} produtos`);
    } else {
      console.log(`   ❌ Erro: ${res.data.message}`);
    }

    // ===== TEST 2: GET /api/formas-pagamento =====
    console.log('\n2️⃣  GET /api/formas-pagamento');
    res = await makeRequest('GET', '/api/formas-pagamento');
    console.log(`   Status: ${res.status}`);
    if (res.data.success) {
      console.log(`   ✅ Formas de pagamento: ${res.data.data?.length || 0}`);
    } else {
      console.log(`   ❌ Erro: ${res.data.message}`);
    }

    // ===== TEST 3: POST /api/login (sem credenciais) =====
    console.log('\n3️⃣  POST /api/login (teste com credenciais inválidas)');
    res = await makeRequest('POST', '/api/login', { email: 'teste@test.com', senha: 'errada' });
    console.log(`   Status: ${res.status}`);
    if (!res.data.success) {
      console.log(`   ✅ Rejeição esperada: ${res.data.message}`);
    } else {
      console.log(`   ⚠️  Credenciais aceitadas (banco pode ter teste@test.com)`);
    }

    // ===== TEST 4: GET /api/me (sem login) =====
    console.log('\n4️⃣  GET /api/me (sem autenticação)');
    res = await makeRequest('GET', '/api/me');
    console.log(`   Status: ${res.status}`);
    if (!res.data.success) {
      console.log(`   ✅ Acesso negado como esperado: ${res.data.error}`);
    } else {
      console.log(`   ❌ Deveria exigir autenticação`);
    }

    // ===== TEST 5: GET /api/pedidos (sem login) =====
    console.log('\n5️⃣  GET /api/pedidos (sem autenticação)');
    res = await makeRequest('GET', '/api/pedidos');
    console.log(`   Status: ${res.status}`);
    if (res.status === 401) {
      console.log(`   ✅ Acesso negado como esperado`);
    } else {
      console.log(`   ❌ Deveria retornar 401`);
    }

    console.log('\n✅ Testes básicos completados!\n');
    console.log('Próximos passos:');
    console.log('1. Criar um usuário de teste na tabela pessoa');
    console.log('2. Testar POST /api/login com credenciais válidas');
    console.log('3. Testar POST /api/pedidos após login');
    console.log('4. Testar POST /api/pagamentos após criar pedido');

  } catch (err) {
    console.error('❌ Erro durante testes:', err.message);
  }
}

runTests();
