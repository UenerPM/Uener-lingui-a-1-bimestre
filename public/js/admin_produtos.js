document.addEventListener('DOMContentLoaded', () => {
  const container = document.createElement('section');
  container.className = 'admin-section';
  container.innerHTML = `
    <h2>Produtos</h2>
    <div id="produtos-lista"></div>
    <form id="form-add-produto">
      <input name="nome_produto" placeholder="Nome do produto" required />
      <input name="estoque_atual" placeholder="Estoque" type="number" />
      <input name="preco_unidade" placeholder="Preço" step="0.01" />
      <button type="submit">Adicionar Produto</button>
    </form>
  `;
  document.querySelector('main').appendChild(container);

  async function fetchLista(){
    const res = await fetch('/api/db/produtos', { credentials: 'same-origin' });
    if (!res.ok) return;
    const data = await res.json();
    const div = document.getElementById('produtos-lista');
    div.innerHTML = '';
    data.forEach(p => {
      const el = document.createElement('div');
      el.innerHTML = `
        <strong>${p.nome_produto}</strong> — Estoque:${p.estoque_atual} — R$ ${p.preco_unidade}
        <button data-action="edit" data-type="produtos" data-id="${p.id_produto}">Editar</button>
        <button data-action="delete" data-type="produtos" data-id="${p.id_produto}">Excluir</button>
      `;
      div.appendChild(el);
    });
  }

  const form = document.getElementById('form-add-produto');
  const submitBtn = form.querySelector('button[type="submit"]');
  const cancelBtn = document.createElement('button');
  cancelBtn.type = 'button';
  cancelBtn.textContent = 'Cancelar Edição';
  cancelBtn.style.marginLeft = '8px';
  cancelBtn.style.display = 'none';
  form.appendChild(cancelBtn);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const body = { nome_produto: fd.get('nome_produto'), estoque_atual: Number(fd.get('estoque_atual')||0), preco_unidade: Number(fd.get('preco_unidade')||0) };
    if (form.dataset.editing) {
      const id = form.dataset.editing;
      const res = await fetch(`/api/db/produtos/${id}`, { method: 'PUT', credentials: 'same-origin', headers: {'Content-Type':'application/json'}, body: JSON.stringify(body) });
      if (res.ok) {
        delete form.dataset.editing; cancelBtn.style.display = 'none'; submitBtn.textContent = 'Adicionar Produto'; form.reset(); await fetchLista();
      } else { alert('Erro ao atualizar produto'); }
    } else {
      const res = await fetch('/api/db/produtos', { method: 'POST', credentials: 'same-origin', headers: {'Content-Type':'application/json'}, body: JSON.stringify(body) });
      if (res.ok) { e.target.reset(); await fetchLista(); } else { alert('Erro ao criar produto'); }
    }
  });

  cancelBtn.addEventListener('click', () => { delete form.dataset.editing; form.reset(); cancelBtn.style.display='none'; submitBtn.textContent='Adicionar Produto'; });

  // Eventos globais para editar / excluir
  document.addEventListener('admin:edit', async (e) => {
    const { type, id } = e.detail;
    if (type !== 'produtos') return;
    const res = await fetch(`/api/db/produtos/${id}`, { credentials: 'same-origin' });
    if (!res.ok) return alert('Falha ao obter produto');
    const data = await res.json();
    const form = document.getElementById('form-add-produto');
    form.nome_produto.value = data.nome_produto || '';
    form.estoque_atual.value = data.estoque_atual || 0;
    form.preco_unidade.value = data.preco_unidade || 0;
    form.dataset.editing = id;
  });

  document.addEventListener('admin:delete', async (e) => {
    const { type, id } = e.detail;
    if (type !== 'produtos') return;
    if (!confirm('Confirma exclusão do produto ' + id + '?')) return;
    const res = await fetch(`/api/db/produtos/${id}`, { method: 'DELETE', credentials: 'same-origin' });
    if (res.ok) await fetchLista(); else alert('Erro ao excluir produto');
  });

  // Prevenção: o submit do formulário já lida com criação; edição pode ser tratada separadamente se desejado

  fetchLista();
});
