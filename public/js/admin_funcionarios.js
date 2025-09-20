document.addEventListener('DOMContentLoaded', () => {
  const container = document.createElement('section');
  container.className = 'admin-section';
  container.innerHTML = `
    <h2>Funcionários</h2>
    <div id="funcionarios-lista"></div>
    <form id="form-add-funcionario">
      <input name="cpf" placeholder="CPF" required />
      <input name="salario" placeholder="Salário" />
      <input name="id_cargo" placeholder="ID Cargo" />
      <input name="porcentagem_comissao" placeholder="% Comissão" />
      <button type="submit">Adicionar Funcionário</button>
    </form>
  `;
  document.querySelector('main').appendChild(container);

  async function fetchLista(){
    const res = await fetch('/api/db/funcionarios', { credentials: 'same-origin' });
    if (!res.ok) return;
    const data = await res.json();
    const div = document.getElementById('funcionarios-lista');
    div.innerHTML = '';
    if (Array.isArray(data)) {
      data.forEach(f => {
        const el = document.createElement('div');
        el.innerHTML = `
          <strong>${f.nome || f.cpf}</strong> — R$ ${f.salario || '0.00'} — Cargo:${f.id_cargo || ''}
          <button data-action="edit" data-type="funcionarios" data-id="${f.cpf}">Editar</button>
          <button data-action="delete" data-type="funcionarios" data-id="${f.cpf}">Excluir</button>
        `;
        div.appendChild(el);
      });
    } else if (data && data.cpf) {
      div.textContent = `${data.nome || data.cpf} — R$ ${data.salario || '0.00'}`;
    }
  }

  const form = document.getElementById('form-add-funcionario');
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
    const body = {
      cpf: fd.get('cpf'),
      salario: fd.get('salario'),
      id_cargo: fd.get('id_cargo'),
      porcentagem_comissao: fd.get('porcentagem_comissao')
    };
    if (form.dataset.editing) {
      // update via PUT
      const id = form.dataset.editing;
      const res = await fetch(`/api/db/funcionarios/${id}`, { method: 'PUT', credentials: 'same-origin', headers: {'Content-Type':'application/json'}, body: JSON.stringify(body) });
      if (res.ok) {
        delete form.dataset.editing;
        cancelBtn.style.display = 'none';
        submitBtn.textContent = 'Adicionar Funcionário';
        form.reset();
        await fetchLista();
      } else {
        alert('Erro ao atualizar funcionário');
      }
    } else {
      const res = await fetch('/api/db/funcionarios', { method: 'POST', credentials: 'same-origin', headers: {'Content-Type':'application/json'}, body: JSON.stringify(body) });
      if (res.ok) {
        e.target.reset();
        await fetchLista();
      } else {
        alert('Erro ao criar funcionário');
      }
    }
  });

  cancelBtn.addEventListener('click', (e) => {
    delete form.dataset.editing;
    form.reset();
    cancelBtn.style.display = 'none';
    submitBtn.textContent = 'Adicionar Funcionário';
  });

  fetchLista();
  
  // Eventos disparados pelo listener global em admin.html
  document.addEventListener('admin:edit', async (e) => {
    const { type, id } = e.detail;
    if (type !== 'funcionarios') return;
    // Buscar dados e preencher formulário para edição
    const res = await fetch(`/api/db/funcionarios/${id}`, { credentials: 'same-origin' });
    if (!res.ok) return alert('Falha ao obter funcionário');
    const data = await res.json();
    const form = document.getElementById('form-add-funcionario');
    form.cpf.value = data.cpf;
    form.salario.value = data.salario || '';
    form.id_cargo.value = data.id_cargo || '';
    form.porcentagem_comissao.value = data.porcentagem_comissao || '';
    // Trocar comportamento do submit para edição
    form.dataset.editing = id;
  });

  document.addEventListener('admin:delete', async (e) => {
    const { type, id } = e.detail;
    if (type !== 'funcionarios') return;
    if (!confirm('Confirma exclusão do funcionário ' + id + '?')) return;
    const res = await fetch(`/api/db/funcionarios/${id}`, { method: 'DELETE', credentials: 'same-origin' });
    if (res.ok) {
      await fetchLista();
    } else {
      alert('Erro ao excluir funcionário');
    }
  });

  // Interceptar submit para tratar edição
  document.getElementById('form-add-funcionario').addEventListener('submit', async (e) => {
    if (!e.target.dataset.editing) return; // já tratado pelo handler acima
  });
});
