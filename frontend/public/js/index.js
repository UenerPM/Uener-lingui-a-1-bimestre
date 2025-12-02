document.addEventListener('DOMContentLoaded', async () => {
  const user = await verificarSessao();
  if (!user) {
    window.location.replace('/login.html');
    return;
  }

  // Carregar e renderizar produtos
  const produtos = await carregarProdutos();
  renderizarProdutos(produtos, 'produtos-lista');

  // Atualizar displays
  atualizarCarrinhoDOM('#carrinho-lista', '#carrinho-total');
  updateQtdDisplay();

  // Mostrar usuário na header
  const header = document.querySelector('header');
  const userSpan = document.createElement('span');
  userSpan.textContent = `${user.nomepessoa}`;
  userSpan.style = 'position:absolute;top:24px;left:32px;font-weight:bold;color:#fff;background:#bb3e03;padding:4px 12px;border-radius:8px;';
  header.appendChild(userSpan);

  // Botão de logout
  const logoutBtn = document.createElement('a');
  logoutBtn.href = '#';
  logoutBtn.textContent = 'Sair';
  logoutBtn.className = 'logout-btn';
  logoutBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    await fazerLogout();
    window.location.href = '/login.html';
  });
  header.appendChild(logoutBtn);
});
