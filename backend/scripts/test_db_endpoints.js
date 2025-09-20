const fetch = require('node-fetch');

const BASE = 'http://localhost:3000/api/db';

function extractCookie(res) {
  const raw = res.headers.raw && res.headers.raw()['set-cookie'];
  if (!raw || raw.length === 0) return null;
  return raw.map(s => s.split(';')[0]).join('; ');
}

let COOKIE = null;

async function req(path, opts = {}){
  const headers = opts.headers || {};
  if (COOKIE) headers.Cookie = COOKIE;
  opts.headers = headers;
  const res = await fetch(BASE + path, opts);
  const text = await res.text();
  let body;
  try { body = JSON.parse(text); } catch(e){ body = text; }
  return { status: res.status, body, raw: res };
}

async function loginAsAdmin(){
  const res = await fetch('http://localhost:3000/auth/login', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ username: 'adm', password: 'adm' }) });
  if (res.status !== 200) throw new Error('Falha login admin ' + res.status + ' ' + await res.text());
  COOKIE = extractCookie(res);
}

async function testPessoas(){
  console.log('\n--- Testando Pessoas ---');
  // POST
  const pessoa = { cpf: '99999999999', nome: 'Teste API', endereco: 'Rua Teste, 1' };
  let r = await req('/pessoas', { method: 'POST', body: JSON.stringify(pessoa), headers: { 'Content-Type': 'application/json' } });
  console.log('POST pessoas ->', r.status, r.body);
  // GET list
  r = await req('/pessoas');
  console.log('GET pessoas ->', r.status, Array.isArray(r.body) ? r.body.length + ' itens' : r.body);
  // GET single
  r = await req('/pessoas/' + pessoa.cpf);
  console.log('GET pessoa ->', r.status, r.body);
  // PUT
  r = await req('/pessoas/' + pessoa.cpf, { method: 'PUT', body: JSON.stringify({ nome: 'Teste API Edit' }), headers: { 'Content-Type': 'application/json' } });
  console.log('PUT pessoa ->', r.status, r.body);
  // DELETE
  r = await req('/pessoas/' + pessoa.cpf, { method: 'DELETE' });
  console.log('DELETE pessoa ->', r.status, r.body);
}

async function testFuncionarios(){
  console.log('\n--- Testando Funcionarios ---');
  // Need a pessoa and cargo existing; try to use existing sample
  const cpf = '11111111111'; // assume exists
  // POST funcionario
  const func = { cpf, salario: '1500.00', id_cargo: 1, porcentagem_comissao: '2.5' };
  let r = await req('/funcionarios', { method: 'POST', body: JSON.stringify(func), headers: { 'Content-Type': 'application/json' } });
  console.log('POST funcionarios ->', r.status, r.body);
  // GET list
  r = await req('/funcionarios');
  console.log('GET funcionarios ->', r.status, Array.isArray(r.body) ? r.body.length + ' itens' : r.body);
  // GET single
  r = await req('/funcionarios/' + cpf);
  console.log('GET funcionario ->', r.status, r.body);
  // PUT
  r = await req('/funcionarios/' + cpf, { method: 'PUT', body: JSON.stringify({ salario: '1800.00' }), headers: { 'Content-Type': 'application/json' } });
  console.log('PUT funcionario ->', r.status, r.body);
  // DELETE
  r = await req('/funcionarios/' + cpf, { method: 'DELETE' });
  console.log('DELETE funcionario ->', r.status, r.body);
}

async function main(){
  try{
    await loginAsAdmin();
    await testPessoas();
    await testFuncionarios();
  }catch(e){
    console.error('Erro nos testes:', e && e.message ? e.message : e);
  }
}

main();
