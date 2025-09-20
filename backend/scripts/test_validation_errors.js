const fetch = require('node-fetch');

function extractCookie(res) { const raw = res.headers.raw && res.headers.raw()['set-cookie']; if (!raw) return null; return raw.map(s=>s.split(';')[0]).join('; '); }

async function run(){
  console.log('\n--- Testes de validação ---');
  // login
  let r = await fetch('http://localhost:3000/auth/login', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ username: 'adm', password: 'adm' }) });
  if (r.status !== 200) { console.error('falha login', r.status, await r.text()); process.exit(1); }
  const cookie = extractCookie(r);

  // CPF curto
  r = await fetch('http://localhost:3000/api/db/pessoas', { method: 'POST', headers: {'Content-Type':'application/json', Cookie: cookie}, body: JSON.stringify({ cpf: '123', nome: 'X' }) });
  console.log('POST pessoas cpf curto ->', r.status, await r.text());
  // Produto sem nome
  r = await fetch('http://localhost:3000/api/db/produtos', { method: 'POST', headers: {'Content-Type':'application/json', Cookie: cookie}, body: JSON.stringify({ preco_unidade: -5 }) });
  console.log('POST produto inválido ->', r.status, await r.text());
  // Pagamento sem valor
  r = await fetch('http://localhost:3000/api/db/pagamentos', { method: 'POST', headers: {'Content-Type':'application/json', Cookie: cookie}, body: JSON.stringify({ id_pedido: 'x' }) });
  console.log('POST pagamento inválido ->', r.status, await r.text());
}

run().catch(e=>{ console.error(e); process.exit(1); });
