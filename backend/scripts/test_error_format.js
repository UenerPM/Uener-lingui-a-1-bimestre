const fetch = require('node-fetch');

function extractCookie(res) { const raw = res.headers.raw && res.headers.raw()['set-cookie']; if (!raw) return null; return raw.map(s=>s.split(';')[0]).join('; '); }

async function run() {
  console.log('\n--- Teste de formato de erro ---');
  // login
  let r = await fetch('http://localhost:3000/auth/login', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ username: 'adm', password: 'adm' }) });
  if (r.status !== 200) { console.error('falha login', r.status, await r.text()); process.exit(1); }
  const cookie = extractCookie(r);

  // CPF curto -> esperar 400 com { erros: [...] }
  r = await fetch('http://localhost:3000/api/db/pessoas', { method: 'POST', headers: {'Content-Type':'application/json', Cookie: cookie}, body: JSON.stringify({ cpf: '123', nome: 'X' }) });
  console.log('CPF curto status:', r.status, 'body:', await r.text());

  // Produto inexistente -> esperar 404 com { erro: 'Produto não encontrado' }
  r = await fetch('http://localhost:3000/api/db/produtos/999999', { method: 'GET', headers: { Cookie: cookie } });
  console.log('GET produto inexistente status:', r.status, 'body:', await r.text());

  // Forçar um erro interno: chamar rota que não existe via POST para provocar 404 (aqui só mostramos forma)
  console.log('Teste concluído');
}

run().catch(e=>{ console.error(e); process.exit(1); });
