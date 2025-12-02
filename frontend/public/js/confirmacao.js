let idPedidoAtual = null;

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Validar sessão
  const user = await verificarSessao();
  if (!user) {
    window.location.replace('/login.html');
    return;
  }

  // 2. Carregar e exibir carrinho
  const carrinho = getCarrinho();
  exibirCarrinho(carrinho);

  // 3. Botão voltar
  document.getElementById('btn-voltar-carrinho').addEventListener('click', () => {
    window.location.href = '/index.html';
  });

  // 4. Botão confirmar pedido
  document.getElementById('btn-confirmar-pedido').addEventListener('click', confirmarPedido);

  // 5. Botão ir para pagamento
  document.getElementById('btn-ir-pagamento').addEventListener('click', () => {
    if (idPedidoAtual) {
      sessionStorage.setItem('idPedidoAtual', idPedidoAtual);
    }
    window.location.href = '/pagamento.html';
  });
});

function exibirCarrinho(carrinho) {
  const lista = document.getElementById('confirmacao-lista');
  lista.innerHTML = '';

  if (carrinho.length === 0) {
    lista.innerHTML = '<li>Carrinho vazio</li>';
    document.getElementById('btn-confirmar-pedido').disabled = true;
    return;
  }

  let total = 0;
  carrinho.forEach(item => {
    const subtotal = item.preco * item.quantidade;
    const li = document.createElement('li');
    li.textContent = `${item.nomeproduto} x${item.quantidade} – R$ ${subtotal.toFixed(2)}`;
    lista.appendChild(li);
    total += subtotal;
  });

  const liTotal = document.createElement('li');
  liTotal.textContent = `Total: R$ ${total.toFixed(2)}`;
  lista.appendChild(liTotal);
}

async function confirmarPedido() {
  const btn = document.getElementById('btn-confirmar-pedido');
  const statusMsg = document.getElementById('status-msg');
  const spinner = document.getElementById('spinner');
  const statusTexto = document.getElementById('status-texto');
  const carrinho = getCarrinho();

  if (carrinho.length === 0) {
    mostrarMensagem('Carrinho vazio!', 'erro');
    return;
  }

  btn.disabled = true;
  spinner.style.display = 'inline-block';
  statusMsg.className = 'status-msg';
  statusTexto.textContent = 'Processando pedido...';
  statusMsg.style.display = 'block';

  try {
    const resultado = await criarPedido(carrinho);

    if (resultado.success) {
      idPedidoAtual = resultado.pedido.idpedido;
      limparCarrinho();
      spinner.style.display = 'none';
      statusMsg.style.display = 'none';
      document.getElementById('confirmacao-lista').style.display = 'none';
      document.getElementById('btn-voltar-carrinho').style.display = 'none';
      document.getElementById('btn-confirmar-pedido').style.display = 'none';
      document.getElementById('sucesso-msg').style.display = 'block';
    } else {
      spinner.style.display = 'none';
      statusMsg.className = 'status-msg erro';
      statusTexto.textContent = `Erro: ${resultado.message}`;
      btn.disabled = false;
    }
  } catch (err) {
    spinner.style.display = 'none';
    statusMsg.className = 'status-msg erro';
    statusTexto.textContent = `Erro: ${err.message}`;
    btn.disabled = false;
  }
}

function mostrarMensagem(texto, tipo) {
  const statusMsg = document.getElementById('status-msg');
  const statusTexto = document.getElementById('status-texto');
  statusMsg.className = `status-msg ${tipo}`;
  statusTexto.textContent = texto;
  statusMsg.style.display = 'block';

  if (tipo === 'sucesso') {
    setTimeout(() => { statusMsg.style.display = 'none'; }, 3000);
  }
}
