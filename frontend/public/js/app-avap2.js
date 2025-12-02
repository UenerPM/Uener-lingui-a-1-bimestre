/**
 * app-avap2.js
 * Frontend integrado com as APIs do PostgreSQL avap2
 * 
 * Inclui:
 * - Gerenciamento de sessão/autenticação
 * - Carrinho de compras em localStorage
 * - Integração com produtos, pedidos e pagamentos
 */

// ===== CONFIGURAÇÃO GLOBAL =====
const API = {
  BASE: '/api',
  login: '/api/login',
  logout: '/api/logout',
  me: '/api/me',
  produtos: '/api/produtos',
  pedidos: '/api/pedidos',
  pagamentos: '/api/pagamentos',
  formasPagamento: '/api/formas-pagamento'
};

let currentUser = null;

// ===== HELPER: CONSTRUIR URL DE IMAGEM =====

/**
 * Construir URL de imagem com fallback automático
 * Estratégia:
 * 1. Se for caminho completo (/img/..., /imgs/, http), usar direto
 * 2. Se for nome só (ex: 35929.jpeg), servir via /imagens-produtos/
 * 3. Fallback: /img/no-image.png
 */
function construirUrlImagem(imagemCampo) {
  // Se não tem caminho, usar default
  if (!imagemCampo) {
    return '/img/no-image.png';
  }
  
  // Se é uma URL completa (começa com http), usar direto
  if (imagemCampo.startsWith('http')) {
    return imagemCampo;
  }
  
  // Se já é um caminho relativo ao public/ (/img/, /imgs/, /uploads/), usar direto
  if (imagemCampo.startsWith('/')) {
    return imagemCampo;
  }
  
  // Senão, é um nome de arquivo do banco, servir via rota /imagens-produtos
  return `/imagens-produtos/${encodeURIComponent(imagemCampo)}`;
}

// ===== CARRINHO (localStorage) =====

function getCarrinho() {
  return JSON.parse(localStorage.getItem('carrinho')) || [];
}

function salvarCarrinho(carrinho) {
  localStorage.setItem('carrinho', JSON.stringify(carrinho));
}

function limparCarrinho() {
  localStorage.removeItem('carrinho');
  localStorage.removeItem('formaPagamento');
}

function adicionarAoCarrinho(produto) {
  const carrinho = getCarrinho();
  const existe = carrinho.find(item => item.idproduto === produto.idproduto);

  if (existe) {
    existe.quantidade++;
  } else {
    carrinho.push({
      idproduto: produto.idproduto,
      nomeproduto: produto.nomeproduto,
      preco: produto.preco,
      imagem: produto.imagem,
      quantidade: 1
    });
  }

  salvarCarrinho(carrinho);
  return carrinho;
}

function removerDoCarrinho(idproduto) {
  let carrinho = getCarrinho();
  const idx = carrinho.findIndex(item => item.idproduto === idproduto);

  if (idx !== -1) {
    carrinho[idx].quantidade--;
    if (carrinho[idx].quantidade <= 0) {
      carrinho.splice(idx, 1);
    }
    salvarCarrinho(carrinho);
  }

  return carrinho;
}

function getCarrinhoTotal() {
  return getCarrinho().reduce((sum, item) => sum + item.preco * item.quantidade, 0);
}

// ===== AUTENTICAÇÃO =====

async function fazerLogin(email, senha) {
  try {
    const res = await fetch(API.login, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, senha })
    });

    const data = await res.json();

    if (data.success) {
      currentUser = data.user;
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
      return { success: true, user: data.user };
    } else {
      return { success: false, message: data.message };
    }
  } catch (err) {
    return { success: false, message: err.message };
  }
}

async function fazerLogout() {
  try {
    const res = await fetch(API.logout, {
      method: 'POST',
      credentials: 'include'
    });

    const data = await res.json();

    if (data.success) {
      currentUser = null;
      localStorage.removeItem('currentUser');
      return { success: true };
    } else {
      return { success: false, message: data.message };
    }
  } catch (err) {
    return { success: false, message: err.message };
  }
}

async function verificarSessao() {
  try {
    const res = await fetch(API.me, {
      credentials: 'include'
    });

    const data = await res.json();

    if (data.success) {
      currentUser = data.user;
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
      return currentUser;
    } else {
      currentUser = null;
      localStorage.removeItem('currentUser');
      return null;
    }
  } catch (err) {
    return null;
  }
}

// ===== PRODUTOS =====

async function carregarProdutos() {
  try {
    const res = await fetch(API.produtos);
    const data = await res.json();

    if (data.success) {
      return data.data || [];
    } else {
      console.error('Erro ao carregar produtos:', data.message);
      return [];
    }
  } catch (err) {
    console.error('Erro ao carregar produtos:', err.message);
    return [];
  }
}

// ===== PEDIDOS =====

async function criarPedido(itens) {
  if (!currentUser) {
    return { success: false, message: 'Usuário não autenticado' };
  }

  try {
    const total = itens.reduce((sum, item) => sum + item.preco * item.quantidade, 0);

    const res = await fetch(API.pedidos, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ itens, total })
    });

    const data = await res.json();

    if (data.success) {
      return { success: true, pedido: data.pedido };
    } else {
      return { success: false, message: data.message };
    }
  } catch (err) {
    return { success: false, message: err.message };
  }
}

async function listarPedidos() {
  if (!currentUser) {
    return { success: false, message: 'Usuário não autenticado' };
  }

  try {
    const res = await fetch(API.pedidos, {
      credentials: 'include'
    });

    const data = await res.json();

    if (data.success) {
      return { success: true, pedidos: data.data || [] };
    } else {
      return { success: false, message: data.message };
    }
  } catch (err) {
    return { success: false, message: err.message };
  }
}

// ===== PAGAMENTOS =====

async function criarPagamento(idpedido, idformadepagamento, valorpagamento) {
  if (!currentUser) {
    return { success: false, message: 'Usuário não autenticado' };
  }

  try {
    const res = await fetch(API.pagamentos, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ idpedido, idformadepagamento, valorpagamento })
    });

    const data = await res.json();

    if (data.success) {
      return { success: true, pagamento: data.pagamento };
    } else {
      return { success: false, message: data.message };
    }
  } catch (err) {
    return { success: false, message: err.message };
  }
}

async function carregarFormasPagamento() {
  try {
    const res = await fetch(API.formasPagamento);
    const data = await res.json();

    if (data.success) {
      return data.data || [];
    } else {
      return [];
    }
  } catch (err) {
    console.error('Erro ao carregar formas de pagamento:', err.message);
    return [];
  }
}

// ===== UI - UTILITÁRIOS =====

function atualizarCarrinhoDOM(listaSelector, totalSelector) {
  const lista = document.querySelector(listaSelector);
  if (!lista) return;

  const carrinho = getCarrinho();
  lista.innerHTML = '';
  let total = 0;

  if (carrinho.length === 0) {
    lista.innerHTML = '<li>Carrinho vazio</li>';
    if (totalSelector) {
      document.querySelector(totalSelector).textContent = 'R$ 0,00';
    }
    return;
  }

  carrinho.forEach(item => {
    const subtotal = item.preco * item.quantidade;
    const li = document.createElement('li');
    li.textContent = `${item.nomeproduto} x${item.quantidade} – R$ ${subtotal.toFixed(2)}`;
    lista.appendChild(li);
    total += subtotal;
  });

  if (totalSelector) {
    document.querySelector(totalSelector).textContent = `R$ ${total.toFixed(2)}`;
  }
}

function renderizarProdutos(produtos, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = produtos.map(p => `
    <div class="produto">
      <img src="${construirUrlImagem(p.imagem)}" alt="${p.nomeproduto}" class="produto-imagem" />
      <h3>${p.nomeproduto}</h3>
      <p>${p.descricao || ''}</p>
      <p class="preco">R$ ${parseFloat(p.preco).toFixed(2)}</p>
      <p class="estoque">Estoque: ${p.estoque}</p>
      <div class="controle-qtd">
        <button class="remover btn-carrinho" data-idproduto="${p.idproduto}" aria-label="Remover">−</button>
        <span class="quantidade" data-idproduto="${p.idproduto}">0</span>
        <button class="adicionar btn-carrinho" data-idproduto="${p.idproduto}" data-preco="${p.preco}" aria-label="Adicionar">+</button>
      </div>
    </div>
  `).join('');

  // Event delegation para carrinho
  container.addEventListener('click', (e) => {
    const idproduto = parseInt(e.target.dataset.idproduto);
    if (!idproduto) return;

    if (e.target.classList.contains('adicionar')) {
      const produto = produtos.find(p => p.idproduto === idproduto);
      if (produto && produto.estoque > 0) {
        adicionarAoCarrinho(produto);
        updateQtdDisplay();
        atualizarCarrinhoDOM('#carrinho-lista', '#carrinho-total');
      }
    }

    if (e.target.classList.contains('remover')) {
      removerDoCarrinho(idproduto);
      updateQtdDisplay();
      atualizarCarrinhoDOM('#carrinho-lista', '#carrinho-total');
    }
  });
}

function updateQtdDisplay() {
  const carrinho = getCarrinho();
  document.querySelectorAll('.quantidade').forEach(span => {
    const idproduto = parseInt(span.dataset.idproduto);
    const item = carrinho.find(c => c.idproduto === idproduto);
    span.textContent = item?.quantidade || 0;
  });
}

// ===== INICIALIZAÇÃO =====

document.addEventListener('DOMContentLoaded', async () => {
  // Verificar sessão
  const user = await verificarSessao();
  if (user) {
    console.log('✅ Usuário logado:', user.nomepessoa);
    document.body.classList.add('logado');
  } else {
    console.log('⚠️ Nenhum usuário logado');
    document.body.classList.add('nao-logado');
  }
});

// Export para uso em outros scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    API,
    currentUser,
    getCarrinho,
    salvarCarrinho,
    limparCarrinho,
    adicionarAoCarrinho,
    removerDoCarrinho,
    getCarrinhoTotal,
    fazerLogin,
    fazerLogout,
    verificarSessao,
    carregarProdutos,
    criarPedido,
    listarPedidos,
    criarPagamento,
    carregarFormasPagamento,
    atualizarCarrinhoDOM,
    renderizarProdutos,
    updateQtdDisplay
  };
}
