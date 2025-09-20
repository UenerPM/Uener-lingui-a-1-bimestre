document.addEventListener('DOMContentLoaded', () => {
  const container = document.createElement('section');
  container.className = 'admin-section';
  container.innerHTML = `
    <h2>Clientes</h2>
    <div id="clientes-lista"></div>
    <form id="form-add-cliente">
      <input name="cpf" placeholder="CPF (já cadastrado em pessoas)" required />
      <input name="tipo_cliente" placeholder="Tipo de cliente" />
      <button type="submit">Adicionar Cliente</button>
    </form>
  `;
  document.querySelector('main').appendChild(container);

  async function fetchLista() {
    const res = await fetch('/api/db/clientes', { credentials: 'same-origin' });
    if (!res.ok) return;
    const data = await res.json();
    const div = document.getElementById('clientes-lista');
    div.innerHTML = '';
    data.forEach(c => {
      const el = document.createElement('div');
      el.innerHTML = `
        <strong>#${c.id_cliente} ${c.nome}</strong> — CPF:${c.cpf} — Tipo:${c.tipo_cliente || ''}
        <button data-action="edit" data-type="clientes" data-id="${c.id_cliente}">Editar</button>
        <button data-action="delete" data-type="clientes" data-id="${c.id_cliente}">Excluir</button>
      `;
      div.appendChild(el);
    });
  }

  const form = document.getElementById('form-add-cliente');
  const submitBtn = form.querySelector('button[type="submit"]');
  const cancelBtn = document.createElement('button');
  cancelBtn.type = 'button'; cancelBtn.textContent = 'Cancelar Edição'; cancelBtn.style.marginLeft='8px'; cancelBtn.style.display='none';
  form.appendChild(cancelBtn);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const body = { cpf: fd.get('cpf'), tipo_cliente: fd.get('tipo_cliente') };
    if (form.dataset.editing) {
      const id = form.dataset.editing;
      const res = await fetch(`/api/db/clientes/${id}`, { method: 'PUT', credentials: 'same-origin', headers: {'Content-Type':'application/json'}, body: JSON.stringify(body) });
      if (res.ok) { delete form.dataset.editing; cancelBtn.style.display='none'; submitBtn.textContent='Adicionar Cliente'; form.reset(); await fetchLista(); } else { const txt = await res.text(); alert('Erro ao atualizar cliente: '+txt); }
    } else {
      const res = await fetch('/api/db/clientes', { method: 'POST', credentials: 'same-origin', headers: {'Content-Type':'application/json'}, body: JSON.stringify(body) });
      if (res.ok) { e.target.reset(); await fetchLista(); } else { const txt = await res.text(); alert('Erro ao criar cliente: ' + txt); }
    }
  });

  cancelBtn.addEventListener('click', ()=>{ delete form.dataset.editing; form.reset(); cancelBtn.style.display='none'; submitBtn.textContent='Adicionar Cliente'; });

  document.addEventListener('admin:edit', async (e) => {
    const { type, id } = e.detail; if (type !== 'clientes') return;
    const res = await fetch(`/api/db/clientes/${id}`, { credentials: 'same-origin' });
    if (!res.ok) return alert('Erro ao obter cliente');
    const data = await res.json();
    const form = document.getElementById('form-add-cliente');
    form.cpf.value = data.cpf || '';
    form.tipo_cliente.value = data.tipo_cliente || '';
    form.dataset.editing = id;
  });

  document.addEventListener('admin:delete', async (e) => {
    const { type, id } = e.detail; if (type !== 'clientes') return;
    if (!confirm('Confirma exclusão do cliente ' + id + '?')) return;
    const res = await fetch(`/api/db/clientes/${id}`, { method: 'DELETE', credentials: 'same-origin' });
    if (res.ok) await fetchLista(); else alert('Erro ao excluir cliente');
  });

  fetchLista();
});
