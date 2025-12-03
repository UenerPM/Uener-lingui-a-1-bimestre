const messageEl = document.getElementById('message');
const formLogin = document.getElementById('form-login');

function showMessage(text, type = 'error') {
  messageEl.textContent = text;
  messageEl.className = 'message ' + type;
  setTimeout(() => { messageEl.className = 'message'; }, 5000);
}

(async () => {
  const user = await verificarSessao();
  if (user) {
    window.location.replace('/index.html');
  }
})();

formLogin.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('login-email').value.trim();
  const senha = document.getElementById('login-password').value;

  if (!email || !senha) {
    return showMessage('Email e senha são obrigatórios', 'error');
  }

  const result = await fazerLogin(email, senha);
  if (result.success) {
    showMessage('Login realizado com sucesso!', 'success');
    setTimeout(() => { window.location.href = '/index.html'; }, 800);
  } else {
    showMessage(result.message || 'Falha ao fazer login', 'error');
  }
});
