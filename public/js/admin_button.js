// Faz uma requisição para a API de sessão para saber se o usuário está logado e se é admin
fetch('/api/session')
  .then(res => res.json()) // Converte a resposta para JSON
  .then(data => {
    // Se o usuário for administrador, exibe o botão de admin
    if (data.isAdmin) {
      // Seleciona o elemento <header> da página
      const header = document.querySelector('header');
      // Cria um novo elemento <a> que será o botão para o painel admin
      const btn = document.createElement('a');
      btn.href = '/admin.html'; // Define o link do botão
      btn.textContent = 'Painel Admin'; // Texto do botão
      btn.className = 'botao-admin'; // Classe para estilização
      btn.style.marginLeft = '20px'; // Espaçamento à esquerda
      // Adiciona o botão ao header
      header.appendChild(btn);
    }
  });
