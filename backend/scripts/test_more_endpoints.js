const fetch = require('node-fetch');
const BASE = 'http://localhost:3000/api/db';

function extractCookie(res) {
  const raw = res.headers.raw && res.headers.raw()['set-cookie'];
  if (!raw || raw.length === 0) return null;
  return raw.map(s => s.split(';')[0]).join('; ');
}

let COOKIE = null;

async function req(path, opts={}){
  const headers = opts.headers || {};
  if (COOKIE) headers.Cookie = COOKIE;
  opts.headers = headers;
  const res = await fetch(BASE + path, opts);
  const txt = await res.text();
  try { return { status: res.status, body: JSON.parse(txt), raw: res }; } catch(e) { return { status: res.status, body: txt, raw: res }; }
}

async function loginAsAdmin(){
  const res = await fetch('http://localhost:3000/auth/login', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ username: 'adm', password: 'adm' }) });
  if (res.status !== 200) throw new Error('Falha login admin ' + res.status + ' ' + await res.text());
  COOKIE = extractCookie(res);
}

async function testProdutos(){
  console.log('\n--- Produtos ---');
  let r = await req('/produtos', { method: 'POST', body: JSON.stringify({ nome_produto: 'Teste Produto', estoque_atual: 10, preco_unidade: 5.5 }), headers: { 'Content-Type': 'application/json' } });
  console.log('POST produto ->', r.status, r.body);
  r = await req('/produtos'); console.log('GET produtos ->', r.status, Array.isArray(r.body)? r.body.length + ' itens': r.body);
}

async function testPedidosPagamentos(){
  console.log('\n--- Pedidos & Pagamentos ---');
  // Criar um pedido simples (assume cliente id 1 exists)
  let r = await req('/pedidos', { method: 'POST', body: JSON.stringify({ id_cliente: 1, itens: [] }), headers: { 'Content-Type': 'application/json' } });
  console.log('POST pedido ->', r.status, r.body);
  if (r.status === 200 && r.body.id_pedido) {
    const id = r.body.id_pedido;
  let p = await req('/pagamentos', { method: 'POST', body: JSON.stringify({ id_pedido: id, valor_total: 10.0, formas: [] }), headers: { 'Content-Type': 'application/json' } });
    console.log('POST pagamento ->', p.status, p.body);
  }
}

async function main(){
  try { await loginAsAdmin(); await testProdutos(); await testPedidosPagamentos(); } catch(e){ console.error(e); }
}

main();
