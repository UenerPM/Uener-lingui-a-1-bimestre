document.addEventListener('DOMContentLoaded', () => {
  const container = document.createElement('section');
  container.className = 'admin-section';
  container.innerHTML = `
    <h2>Cargos</h2>
    <div id="cargos-lista"></div>
    <form id="form-add-cargo">
      <input name="nome_cargo" placeholder="Nome do cargo" required />
      <button type="submit">Adicionar Cargo</button>
    </form>
  `;
  document.querySelector('main').appendChild(container);

  async function fetchLista() {
    const res = await fetch('/api/db/cargos', { credentials: 'same-origin' });
    if (!res.ok) return;
    const data = await res.json();
    const div = document.getElementById('cargos-lista');
    div.innerHTML = '';
    data.forEach(c => {
      const el = document.createElement('div');
      el.innerHTML = `
        <strong>${c.nome_cargo}</strong>
        <button data-action="edit" data-type="cargos" data-id="${c.id_cargo}">Editar</button>
        <button data-action="delete" data-type="cargos" data-id="${c.id_cargo}">Excluir</button>
      `;
      div.appendChild(el);
    });
  }

  const form = document.getElementById('form-add-cargo');
  const submitBtn = form.querySelector('button[type="submit"]');
  const cancelBtn = document.createElement('button');
  cancelBtn.type='button'; cancelBtn.textContent='Cancelar Edição'; cancelBtn.style.marginLeft='8px'; cancelBtn.style.display='none'; form.appendChild(cancelBtn);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const body = { nome_cargo: fd.get('nome_cargo') };
    if (form.dataset.editing) {
      const id = form.dataset.editing;
      const res = await fetch(`/api/db/cargos/${id}`, { method: 'PUT', credentials: 'same-origin', headers: {'Content-Type':'application/json'}, body: JSON.stringify(body) });
      if (res.ok) { delete form.dataset.editing; cancelBtn.style.display='none'; submitBtn.textContent='Adicionar Cargo'; form.reset(); await fetchLista(); } else { alert('Erro ao atualizar cargo'); }
    } else {
      const res = await fetch('/api/db/cargos', { method: 'POST', credentials: 'same-origin', headers: {'Content-Type':'application/json'}, body: JSON.stringify(body) });
      if (res.ok) { e.target.reset(); await fetchLista(); } else { alert('Erro ao criar cargo'); }
    }
  });

  cancelBtn.addEventListener('click', ()=>{ delete form.dataset.editing; form.reset(); cancelBtn.style.display='none'; submitBtn.textContent='Adicionar Cargo'; });

  document.addEventListener('admin:edit', async (e) => {
    const { type, id } = e.detail; if (type !== 'cargos') return;
    const res = await fetch(`/api/db/cargos/${id}`, { credentials: 'same-origin' });
    if (!res.ok) return alert('Erro ao obter cargo');
    const data = await res.json();
    const form = document.getElementById('form-add-cargo');
    form.nome_cargo.value = data.nome_cargo || '';
    form.dataset.editing = id;
  });

  document.addEventListener('admin:delete', async (e) => {
    const { type, id } = e.detail; if (type !== 'cargos') return;
    if (!confirm('Confirma exclusão do cargo ' + id + '?')) return;
    const res = await fetch(`/api/db/cargos/${id}`, { method: 'DELETE', credentials: 'same-origin' });
    if (res.ok) await fetchLista(); else alert('Erro ao excluir cargo');
  });

  fetchLista();
});
