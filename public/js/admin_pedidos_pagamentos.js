document.addEventListener('DOMContentLoaded', () => {
  const container = document.createElement('section');
  container.className = 'admin-section';
  container.innerHTML = `
    <h2>Pedidos</h2>
    <div id="pedidos-lista"></div>
    <form id="form-add-pedido">
      <input name="id_cliente" placeholder="ID Cliente" required />
      <input name="cpf_funcionario" placeholder="CPF Funcionário" />
      <button type="submit">Criar Pedido</button>
    </form>
    <h2>Pagamentos</h2>
    <form id="form-add-pagamento">
      <input name="id_pedido" placeholder="ID Pedido" required />
      <input name="valor_total" placeholder="Valor Total" required />
      <button type="submit">Criar Pagamento</button>
    </form>
  `;
  document.querySelector('main').appendChild(container);

  async function fetchPedidos(){
    const res = await fetch('/api/db/pedidos');
    if (!res.ok) return;
    const data = await res.json();
    const div = document.getElementById('pedidos-lista');
    div.innerHTML = '';
    data.forEach(p => {
      const el = document.createElement('div');
      el.textContent = `Pedido ${p.id_pedido} - Cliente:${p.id_cliente}`;
      div.appendChild(el);
    });
  }

  document.getElementById('form-add-pedido').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const body = { id_cliente: Number(fd.get('id_cliente')), cpf_funcionario: fd.get('cpf_funcionario') || null };
    const res = await fetch('/api/db/pedidos', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(body) });
    if (res.ok) { e.target.reset(); await fetchPedidos(); } else { alert('Erro ao criar pedido'); }
  });

  document.getElementById('form-add-pagamento').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const body = { id_pedido: Number(fd.get('id_pedido')), valor_total: Number(fd.get('valor_total')), formas: [] };
    const res = await fetch('/api/db/pagamentos', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(body) });
    if (res.ok) { e.target.reset(); alert('Pagamento criado'); } else { const t = await res.json(); alert('Erro: ' + (t.erro || res.status)); }
  });

  fetchPedidos();
});
