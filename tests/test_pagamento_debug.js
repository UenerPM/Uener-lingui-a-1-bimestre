/**
 * Test script para debug de pagamento
 * Simula login + criação de pedido + pagamento
 */

const http = require('http');

const BASE_URL = 'http://localhost:3000';

// Cookies para manter sessão
let cookies = [];

function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + path);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    // Adicionar cookies existentes
    if (cookies.length > 0) {
      options.headers['Cookie'] = cookies.join('; ');
    }

    const req = http.request(options, (res) => {
      let data = '';

      // Capturar Set-Cookie para manter sessão
      const setCookie = res.headers['set-cookie'];
      if (setCookie) {
        setCookie.forEach(cookie => {
          const parts = cookie.split(';')[0]; // Pegar só a parte do session id
          if (parts.includes('connect.sid') || parts.includes('sessionid')) {
            cookies.push(parts);
          }
        });
      }

      res.on('data', chunk => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            body: JSON.parse(data),
            headers: res.headers
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            body: data,
            headers: res.headers
          });
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

async function test() {
  console.log('=== TEST PAGAMENTO DEBUG ===\n');

  try {
    // 1. Login
    console.log('1️⃣  Fazendo login...');
    const loginRes = await makeRequest('POST', '/api/login', {
      email: 'upere@example.com',
      senha: '123456'
    });
    console.log('Status:', loginRes.status);
    console.log('Response:', JSON.stringify(loginRes.body, null, 2));
    console.log('Cookies capturados:', cookies);
    console.log();

    if (loginRes.status !== 200) {
      console.error('❌ Login falhou');
      return;
    }

    const userId = loginRes.body.data?.cpfpessoa || loginRes.body.data?.id;
    console.log('✓ Login OK, userId:', userId);
    console.log();

    // 2. Verificar pedido existente (usar ID 57 conforme mensagem)
    console.log('2️⃣  Buscando pedido 57...');
    const pedidoRes = await makeRequest('GET', '/api/pedidos/57');
    console.log('Status:', pedidoRes.status);
    console.log('Response:', JSON.stringify(pedidoRes.body, null, 2));
    console.log();

    // 3. Tentar criar pagamento
    console.log('3️⃣  Criando pagamento para pedido 57...');
    const pagamentoRes = await makeRequest('POST', '/api/pagamentos', {
      idpedido: 57,
      idformadepagamento: 1,
      valorpagamento: 0.99
    });
    console.log('Status:', pagamentoRes.status);
    console.log('Response:', JSON.stringify(pagamentoRes.body, null, 2));

  } catch (err) {
    console.error('Erro:', err);
  }
}

test();
