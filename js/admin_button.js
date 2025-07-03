// Exibe botão de admin apenas para administradores
fetch('/api/session')
  .then(res => res.json())
  .then(data => {
    if (data.isAdmin) {
      const header = document.querySelector('header');
      const btn = document.createElement('a');
      btn.href = '/admin.html';
      btn.textContent = 'Painel Admin';
      btn.className = 'botao-admin';
      btn.style.marginLeft = '20px';
      header.appendChild(btn);
    }
  });
