const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

const base = 'http://localhost:3000';

async function raw(path, opts = {}){
  const res = await fetch(base + path, opts);
  const text = await res.text();
  let body = null;
  try { body = JSON.parse(text); } catch(e){ body = text; }
  return { res, status: res.status, headers: res.headers.raw(), body };
}

function cookieHeader(setCookieRaw){
  if (!setCookieRaw) return '';
  return setCookieRaw.map(c => c.split(';')[0]).join('; ');
}

async function run(){
  console.log('1) login adm/adm');
  const login = await raw('/auth/login', { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ username: 'adm', password: 'adm' }), redirect: 'manual' });
  if (login.status !== 200) return console.error('login falhou', login.status, login.body);
  const setCookie = login.headers['set-cookie'];
  const cookie = cookieHeader(setCookie);
  console.log('cookie:', cookie ? cookie.split('=')[0] : '(nenhum)');

  // 2) criar uma linguica (produtos)
  console.log('\n2) criar Linguica (via /admin/linguicas)');
  const create = await raw('/admin/linguicas', { method: 'POST', headers: { 'Content-Type':'application/json', Cookie: cookie }, body: JSON.stringify({ nome: 'TesteLinguica-' + Date.now(), preco: 9.9 }) });
  console.log('create status', create.status, create.body);
  if (create.status !== 200) return console.error('falha ao criar linguica');
  const created = create.body;

  // 3) listar linguicas
  console.log('\n3) listar Linguicas');
  const list = await raw('/admin/linguicas', { headers: { Cookie: cookie } });
  console.log('list status', list.status, Array.isArray(list.body) ? list.body.length + ' items' : list.body);

  // 4) deletar criada
  console.log('\n4) deletar Linguica criada');
  const id = created.id || created.id || created.id_produto || created.id || created.id;
  const del = await raw('/admin/linguicas/' + (created.id || created.id_produto || created.id), { method: 'DELETE', headers: { Cookie: cookie } });
  console.log('delete status', del.status, del.body);

  // 5) criar usuario via admin
  console.log('\n5) criar usuario via /admin/usuarios');
  const uname = 'testuser_' + Date.now();
  const createUser = await raw('/admin/usuarios', { method: 'POST', headers: { 'Content-Type':'application/json', Cookie: cookie }, body: JSON.stringify({ username: uname, password: 'senha' }) });
  console.log('create user', createUser.status, createUser.body);

  // 6) listar usuarios
  const listUsers = await raw('/admin/usuarios', { headers: { Cookie: cookie } });
  console.log('list users', listUsers.status, Array.isArray(listUsers.body) ? listUsers.body.length + ' users' : listUsers.body);

  // 7) deletar usuario
  const delUser = await raw('/admin/usuarios/' + encodeURIComponent(uname), { method: 'DELETE', headers: { Cookie: cookie } });
  console.log('delete user', delUser.status, delUser.body);

  console.log('\nTeste finalizado');
}

run().catch(e=>{ console.error(e); process.exit(1); });
