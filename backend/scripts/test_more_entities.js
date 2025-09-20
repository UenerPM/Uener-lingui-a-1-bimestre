const fetch = require('node-fetch');

function extractCookie(res) {
  const raw = res.headers.raw && res.headers.raw()['set-cookie'];
  if (!raw || raw.length === 0) return null;
  // manter apenas o par chave=valor de cada cookie
  return raw.map(s => s.split(';')[0]).join('; ');
}

async function run(){
  // Primeiro, logar como admin para obter sessão
  console.log('\n--- Autenticando como admin ---');
  let res = await fetch('http://localhost:3000/auth/login', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ username: 'adm', password: 'adm' }) });
  if (res.status !== 200) {
    console.error('Falha ao logar como adm:', res.status, await res.text());
    process.exit(1);
  }
  const cookieHeader = extractCookie(res);
  console.log('Login OK, cookie:', !!cookieHeader);

  const headersWithCookie = (extra = {}) => ({ 'Content-Type': 'application/json', Cookie: cookieHeader, ...extra });

  console.log('\n--- Testando Cargos ---');
  res = await fetch('http://localhost:3000/api/db/cargos');
  console.log('GET cargos ->', res.status);
  res = await fetch('http://localhost:3000/api/db/cargos', { method: 'POST', headers: headersWithCookie(), body: JSON.stringify({ nome_cargo: 'Cargo Teste' }) });
  console.log('POST cargo ->', res.status, await res.json());

  console.log('\n--- Testando Formas de Pagamento ---');
  res = await fetch('http://localhost:3000/api/db/forma_pagamento');
  console.log('GET formas ->', res.status);
  res = await fetch('http://localhost:3000/api/db/forma_pagamento', { method: 'POST', headers: headersWithCookie(), body: JSON.stringify({ nome_forma_pagamento: 'Dinheiro' }) });
  console.log('POST forma ->', res.status, await res.json());

  console.log('\n--- Testando Clientes ---');
  // Criar uma pessoa primeiro (se não existir)
  res = await fetch('http://localhost:3000/api/db/pessoas', { method: 'POST', headers: headersWithCookie(), body: JSON.stringify({ cpf:'99988877766', nome:'Cliente Teste', endereco:'Rua X' }) });
  console.log('POST pessoa ->', res.status, await (res.status===200?res.json():res.text()));
  res = await fetch('http://localhost:3000/api/db/clientes', { method: 'POST', headers: headersWithCookie(), body: JSON.stringify({ cpf:'99988877766', tipo_cliente:'regular' }) });
  console.log('POST cliente ->', res.status, await res.json());
}

run().catch(e=>{ console.error(e); process.exit(1); });
