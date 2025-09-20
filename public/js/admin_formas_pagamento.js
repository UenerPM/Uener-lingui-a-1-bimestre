document.addEventListener('DOMContentLoaded', () => {
  const container = document.createElement('section');
  container.className = 'admin-section';
  container.innerHTML = `
    <h2>Formas de Pagamento</h2>
    <div id="formas-lista"></div>
    <form id="form-add-forma">
      <input name="nome_forma_pagamento" placeholder="Nome da forma" required />
      <button type="submit">Adicionar Forma</button>
    </form>
  `;
  document.querySelector('main').appendChild(container);

  async function fetchLista() {
    const res = await fetch('/api/db/forma_pagamento', { credentials: 'same-origin' });
    if (!res.ok) return;
    const data = await res.json();
    const div = document.getElementById('formas-lista');
    div.innerHTML = '';
    data.forEach(f => {
      const el = document.createElement('div');
      el.innerHTML = `
        <strong>${f.nome_forma_pagamento}</strong>
        <button data-action="delete" data-type="forma_pagamento" data-id="${f.id_forma_pagamento}">Excluir</button>
      `;
      div.appendChild(el);
    });
  }

  document.getElementById('form-add-forma').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const body = { nome_forma_pagamento: fd.get('nome_forma_pagamento') };
    const res = await fetch('/api/db/forma_pagamento', { method: 'POST', credentials: 'same-origin', headers: {'Content-Type':'application/json'}, body: JSON.stringify(body) });
    if (res.ok) { e.target.reset(); await fetchLista(); } else { alert('Erro ao criar forma de pagamento'); }
  });

  document.addEventListener('admin:delete', async (e) => {
    const { type, id } = e.detail; if (type !== 'forma_pagamento') return;
    if (!confirm('Confirma exclusão da forma ' + id + '?')) return;
    const res = await fetch(`/api/db/forma_pagamento/${id}`, { method: 'DELETE', credentials: 'same-origin' });
    if (res.ok) await fetchLista(); else alert('Erro ao excluir forma');
  });

  fetchLista();
});
