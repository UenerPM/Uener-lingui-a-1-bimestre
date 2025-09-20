// Funções para carregar e gerenciar usuários e linguiças
// (A integração com o backend será feita nas próximas etapas)

document.addEventListener('DOMContentLoaded', () => {
  carregarUsuarios();
  carregarLinguicas();

  document.getElementById('form-add-usuario').onsubmit = async (e) => {
    e.preventDefault();
    const form = e.target;
    const username = form.username.value;
    const password = form.password.value;
    if (!window.confirm('Deseja realmente adicionar este usuário?')) return;
    await fetch('/admin/usuarios', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    form.reset();
    carregarUsuarios();
  };

  document.getElementById('form-add-linguica').onsubmit = async (e) => {
    e.preventDefault();
    const form = e.target;
    const nome = form.nome.value;
    const preco = form.preco.value;
    const imagem = form.imagem.files[0];
    if (!window.confirm('Deseja realmente adicionar esta linguiça?')) return;
    const formData = new FormData();
    formData.append('nome', nome);
    formData.append('preco', preco);
    formData.append('imagem', imagem);
    await fetch('/admin/linguicas', {
      method: 'POST',
      credentials: 'same-origin',
      body: formData
    });
    form.reset();
    carregarLinguicas();
  };
});

async function carregarUsuarios() {
  const res = await fetch('/admin/usuarios', { credentials: 'same-origin' });
  const usuarios = await res.json();
  const lista = document.getElementById('usuarios-lista');
  lista.innerHTML = usuarios.map(u =>
    `<div class="usuario-item">${u.username} ${u.isAdmin ? '<span class="admin-label">(admin)</span>' : ''} ${u.bloqueado ? '<span class="bloqueado-label">[bloqueado]</span>' : ''}
      <button class="btn-bloquear" onclick="toggleBloqueioUsuario('${u.username}')">${u.bloqueado ? 'Desbloquear' : 'Bloquear'}</button>
      ${!u.isAdmin ? `<button class="btn-promover" onclick="promoverUsuario('${u.username}')">Promover a admin</button>` : ''}
      ${(u.isAdmin && u.username !== 'adm') ? `<button class="btn-despromover" onclick="despromoverUsuario('${u.username}')">Despromover admin</button>` : ''}
    </div>`
  ).join('');
}

async function removerUsuario(username) {
  if (!window.confirm('Deseja realmente remover este usuário?')) return;
  await fetch(`/admin/usuarios/${username}`, { method: 'DELETE', credentials: 'same-origin' });
  carregarUsuarios();
}

async function carregarLinguicas() {
  const res = await fetch('/admin/linguicas', { credentials: 'same-origin' });
  const linguicas = await res.json();
  const lista = document.getElementById('linguicas-lista');
  lista.innerHTML = linguicas.map(l =>
    `<div>${l.nome} - R$ ${Number(l.preco).toFixed(2)}
      <img src="img/${l.imagem}" alt="${l.nome}" style="height:40px;vertical-align:middle;" />
      <button onclick="removerLinguica('${l.nome}')">Remover</button>
      <button onclick="editarLinguica('${l.nome}')">Editar</button>
    </div>`
  ).join('');
}

window.editarLinguica = function(nome) {
  fetch('/admin/linguicas', { credentials: 'same-origin' })
    .then(res => res.json())
    .then(linguicas => {
      const l = linguicas.find(l => l.nome === nome);
      if (!l) return;
      const modal = document.getElementById('edit-linguica-modal');
      modal.innerHTML = `
        <form id="form-edit-linguica">
          <h3>Editar Linguiça</h3>
          <input type="text" name="nome" value="${l.nome}" required />
          <input type="number" name="preco" value="${l.preco}" step="0.01" required />
          <input type="file" name="imagem" accept="image/*" />
          <button type="submit">Salvar</button>
          <button type="button" onclick="document.getElementById('edit-linguica-modal').style.display='none'">Cancelar</button>
        </form>
      `;
      modal.style.display = 'block';
      document.getElementById('form-edit-linguica').onsubmit = async (e) => {
        e.preventDefault();
        if (!window.confirm('Deseja realmente salvar as alterações?')) return;
        const form = e.target;
        const formData = new FormData(form);
        await fetch(`/admin/linguicas/${encodeURIComponent(nome)}`, {
          method: 'PUT',
          credentials: 'same-origin',
          body: formData
        });
        modal.style.display = 'none';
        carregarLinguicas();
      };
    });
};

async function removerLinguica(nome) {
  if (!window.confirm('Deseja realmente remover esta linguiça?')) return;
  await fetch(`/admin/linguicas/${encodeURIComponent(nome)}`, { method: 'DELETE', credentials: 'same-origin' });
  carregarLinguicas();
}

window.toggleBloqueioUsuario = async function(username) {
  if (!window.confirm('Deseja realmente bloquear/desbloquear este usuário?')) return;
  await fetch(`/admin/usuarios/${username}/bloquear`, { method: 'PATCH', credentials: 'same-origin' });
  carregarUsuarios();
};

window.promoverUsuario = async function(username) {
  if (!window.confirm('Deseja realmente promover este usuário a admin?')) return;
  await fetch(`/admin/usuarios/${username}/promover`, { method: 'PATCH', credentials: 'same-origin' });
  carregarUsuarios();
};

window.despromoverUsuario = async function(username) {
  if (!window.confirm('Deseja realmente despromover este admin?')) return;
  await fetch(`/admin/usuarios/${username}/despromover`, { method: 'PATCH', credentials: 'same-origin' });
  carregarUsuarios();
};
