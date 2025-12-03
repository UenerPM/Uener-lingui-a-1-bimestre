/* public/js/script.js
   Utilitários públicos para sessão e chamadas simples
*/

if (typeof verificarSessao === 'undefined') {
  async function verificarSessao(){
    try{
      const r = await fetch('/api/me', { credentials: 'include' });
      if(!r.ok) return null; const j = await r.json(); return (j && j.success) ? (j.user || j.data || j) : null;
    }catch(err){ console.error('verificarSessao',err); return null; }
  }
  window.verificarSessao = verificarSessao;
}
// Recupera o carrinho do localStorage ou retorna um objeto vazio
if (typeof getCarrinho === 'undefined') {
  function getCarrinho() {
    try {
      return JSON.parse(localStorage.getItem("carrinho")) || {};
    } catch (err) {
      console.warn('getCarrinho parse error, returning empty', err);
      return {};
    }
  }
  window.getCarrinho = getCarrinho;
}

// Salva o carrinho no localStorage
if (typeof salvarCarrinho === 'undefined') {
  function salvarCarrinho(carrinho) {
    localStorage.setItem("carrinho", JSON.stringify(carrinho));
  }
  window.salvarCarrinho = salvarCarrinho;
}

// Limpa o carrinho e a forma de pagamento do localStorage
if (typeof limparCarrinho === 'undefined') {
  function limparCarrinho() {
    localStorage.removeItem("carrinho");
    localStorage.removeItem("formaPagamento");
  }
  window.limparCarrinho = limparCarrinho;
}

// Atualiza visualmente a lista de itens e o total no carrinho
function atualizarCarrinhoDOM(listaSelector, totalSelector) {
  const lista = document.querySelector(listaSelector);
  if (!lista) return;

  const carrinho = getCarrinho();
  lista.innerHTML = "";
  let total = 0;

  if (Object.keys(carrinho).length === 0) {
    lista.innerHTML = "<li>Carrinho vazio</li>";
    return;
  }

  Object.entries(carrinho).forEach(([nome, item]) => {
    const subtotal = item.preco * item.quantidade;
    lista.innerHTML += `<li>${nome} x${item.quantidade} – R$ ${subtotal.toFixed(2)}</li>`;
    total += subtotal;
  });

  if (totalSelector) {
    document.querySelector(totalSelector).textContent = `R$ ${total.toFixed(2)}`;
  }
}

// Configura a página inicial (index.html) para manipular itens do carrinho
function setupIndexPage() {
  // Esvazia o carrinho apenas se o usuário recarregar a página (F5 ou Ctrl+R)
  if (performance.getEntriesByType("navigation")[0].type === "reload") {
    limparCarrinho();
  }

  // Usamos event delegation para garantir que cada clique adicione/remova apenas 1 item
  const produtosContainer = document.querySelector('.produtos');
  if (produtosContainer && !produtosContainer.dataset.inited) {
    produtosContainer.addEventListener('click', event => {
      const target = event.target;
      const carrinho = getCarrinho();

      if (target.classList.contains('adicionar')) {
        const nome = target.dataset.nome;
        const preco = parseFloat(target.dataset.preco);

        carrinho[nome] = carrinho[nome] || { quantidade: 0, preco };
        carrinho[nome].quantidade++;
        salvarCarrinho(carrinho);

        document.querySelector(`.quantidade[data-nome="${nome}"]`).textContent = carrinho[nome].quantidade;
        atualizarCarrinhoDOM("#carrinho-lista");
      }

      if (target.classList.contains('remover')) {
        const nome = target.dataset.nome;

        if (carrinho[nome]) {
          carrinho[nome].quantidade--;
          if (carrinho[nome].quantidade <= 0) delete carrinho[nome];
          salvarCarrinho(carrinho);

          document.querySelector(`.quantidade[data-nome="${nome}"]`).textContent = carrinho[nome]?.quantidade || 0;
          atualizarCarrinhoDOM("#carrinho-lista");
        }
      }
    });

    produtosContainer.dataset.inited = 'true';
  }

  // Verifica se o carrinho está vazio ao confirmar
  const linkConfirmar = document.getElementById("confirmar-pedido");
  if (linkConfirmar) {
    linkConfirmar.addEventListener("click", e => {
      if (Object.keys(getCarrinho()).length === 0) {
        e.preventDefault();
        alert("Adicione itens ao carrinho antes de confirmar!");
      }
    });
  }

  // Atualiza visualmente o carrinho
  atualizarCarrinhoDOM("#carrinho-lista");
}

// Configura a página de confirmação (confirmacao.html)
function setupConfirmacaoPage() {
  const lista = document.getElementById("confirmacao-lista");
  const btnFinalizar = document.getElementById("btn-finalizar");
  const carrinho = getCarrinho();
  let total = 0;

  if (lista) {
    lista.innerHTML = "";
    if (Object.keys(carrinho).length === 0) {
      lista.innerHTML = "<li>Nenhum item no carrinho</li>";
    } else {
      Object.entries(carrinho).forEach(([nome, item]) => {
        const subtotal = item.preco * item.quantidade;
        lista.innerHTML += `<li>${nome} x${item.quantidade} – R$ ${subtotal.toFixed(2)}</li>`;
        total += subtotal;
      });
      lista.innerHTML += `<li><strong>Total: R$ ${total.toFixed(2)}</strong></li>`;
    }
  }

  if (btnFinalizar) {
    btnFinalizar.addEventListener("click", () => {
      if (Object.keys(carrinho).length === 0) {
        return alert("Carrinho vazio!");
      }
      const metodo = document.querySelector('input[name="pagamento"]:checked').value;
      localStorage.setItem("formaPagamento", metodo);
      window.location.href = "pagamento.html";
    });
  }
}

// Permite apenas dígitos numéricos em campos específicos
function somenteDigitos(e) {
  if (![8, 46].includes(e.keyCode) && (e.keyCode < 48 || e.keyCode > 57)) {
    e.preventDefault();
  }
}

// Valida número do cartão pelo algoritmo de Luhn
function luhnCheck(num) {
  let arr = num.split('').reverse().map(x => parseInt(x));
  let sum = arr.reduce((acc, val, idx) => {
    if (idx % 2) {
      val *= 2;
      if (val > 9) val -= 9;
    }
    return acc + val;
  }, 0);
  return sum % 10 === 0;
}

// Valida a data de validade do cartão
function validarValidade(valor) {
  const [mes, ano] = valor.split('/').map(Number);
  if (!mes || !ano || mes < 1 || mes > 12) return false;
  const agora = new Date();
  const anoAtual = agora.getFullYear() % 100;
  const mesAtual = agora.getMonth() + 1;
  return ano > anoAtual || (ano === anoAtual && mes >= mesAtual);
}

// Valida o código de segurança do cartão (CVV)
function validarCVV(cvv) {
  return /^\d{3,4}$/.test(cvv);
}

// Calcula o CRC16-CCITT para validação do payload PIX
function crc16(payload) {
  let crc = 0xFFFF;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = (crc & 0x8000) ? (crc << 1) ^ 0x1021 : (crc << 1);
      crc &= 0xFFFF;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

// ===== UTILITÁRIO: REMOVER DIACRÍTICOS =====
function removerDiacriticos(str) {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

// Monta o payload PIX seguindo o padrão EMV com CRC16
function montarPayloadPix(chave, valor, nome, cidade) {
  const format = (id, value) => {
    const len = String(value).length.toString().padStart(2, '0');
    return `${id}${len}${value}`;
  };

  const gui = format('00', 'BR.GOV.BCB.PIX') + format('01', chave); // ✅ MAIÚSCULO
  const merchantInfo = format('26', gui);

  // ✅ Sanitizar nome e cidade (remove diacríticos)
  const nomeClean = removerDiacriticos(nome).slice(0, 25);
  const cidadeClean = removerDiacriticos(cidade).slice(0, 15);

  const payload = [
    format('00', '01'),
    merchantInfo,
    format('52', '0000'),
    format('53', '986'),
    format('54', valor.toFixed(2)),
    format('58', 'BR'),
    format('59', nomeClean),
    format('60', cidadeClean),
    format('62', format('05', '***'))
  ].join('');

  const crcPayload = payload + '6304';
  const crc = crc16(crcPayload);
  return crcPayload + crc;
}

// Configura a página de pagamento (pagamento.html)
function setupPagamentoPage() {
  const conteudo = document.getElementById("conteudo-pagamento");
  const btnConcluir = document.getElementById("btn-concluir");
  const mensagemFinal = document.getElementById("mensagem-final");
  const metodo = localStorage.getItem("formaPagamento");
  const carrinho = getCarrinho();

  if (!conteudo || !btnConcluir) return;

  if (Object.keys(carrinho).length === 0) {
    conteudo.innerHTML = "<p>Carrinho vazio. Volte e adicione itens.</p>";
    btnConcluir.style.display = "none";
    return;
  }

  const total = Object.values(carrinho).reduce((sum, item) => sum + item.preco * item.quantidade, 0);

  const totalFormattedEl = document.getElementById("total-formatted");
  if (totalFormattedEl) {
    totalFormattedEl.textContent = `R$ ${total.toFixed(2)}`;
  }

  if (metodo === "PIX") {
    const chavePix = "uperesmarcon@gmail.com";
    const nome = "Uener Linguucudo";
    const cidade = "CAMPO MOURAO";

    const payload = montarPayloadPix(chavePix, total, nome, cidade);
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(payload)}&size=250x250`;

    const qrImg = document.getElementById("pix-qrcode");
    if (qrImg) {
      qrImg.src = qrUrl;
    }
  } else {
    conteudo.innerHTML = `
      <form id="form-cartao">
        <div class="form-group">
          <label for="numero-cartao">Número do Cartão:</label>
          <input type="text" id="numero-cartao" placeholder="0000 0000 0000 0000" maxlength="19" required>
        </div>
        <div class="form-group">
          <label for="validade">Validade (MM/AA):</label>
          <input type="text" id="validade" placeholder="MM/AA" maxlength="5" required>
        </div>
        <div class="form-group">
          <label for="cvv">CVV:</label>
          <input type="text" id="cvv" placeholder="123" maxlength="4" required>
        </div>
      </form>
    `;

    ["numero-cartao", "validade", "cvv"].forEach(id => {
      const inp = document.getElementById(id);
      inp.addEventListener("keydown", somenteDigitos);
      if (id === "validade") {
        inp.addEventListener("input", e => {
          let v = e.target.value.replace(/\D/g, '').slice(0, 4);
          if (v.length > 2) v = v.slice(0, 2) + '/' + v.slice(2);
          e.target.value = v;
        });
      } else if (id === "numero-cartao") {
        inp.addEventListener("input", e => {
          let v = e.target.value.replace(/\D/g, '').slice(0, 16);
          v = v.match(/.{1,4}/g)?.join(' ') || v;
          e.target.value = v;
        });
      }
    });
  }

  btnConcluir.addEventListener("click", () => {
    const form = document.getElementById("form-cartao");
    if (form) {
      const num = document.getElementById("numero-cartao").value.replace(/\s/g, '');
      const val = document.getElementById("validade").value;
      const cvv = document.getElementById("cvv").value;

      if (!num || num.length < 13 || !luhnCheck(num)) {
        return alert("Número de cartão inválido!");
      }
      if (!validarValidade(val)) {
        return alert("Validade inválida ou expirada!");
      }
      if (!validarCVV(cvv)) {
        return alert("CVV inválido!");
      }
    }

    limparCarrinho();
    conteudo.style.display = "none";
    btnConcluir.style.display = "none";
    mensagemFinal.style.display = "block";
  });
}

// Carrega os produtos disponíveis da API e renderiza na página
// função defensiva para páginas legadas que ainda incluem este script
if (typeof carregarProdutos === 'undefined') {
  async function carregarProdutos() {
    try {
      const res = await fetch('/api/linguicas');
      if (!res.ok) {
        const txt = await res.text();
        console.warn('[carregarProdutos] ✗ /api/linguicas returned', res.status, txt);
        return [];
      }
      const body = await res.json();
      
      // Suporta várias formas de resposta: array direto, { success, data }, { data }
      let arr = [];
      if (Array.isArray(body)) arr = body;
      else if (body && Array.isArray(body.data)) arr = body.data;
      else if (body && body.success && Array.isArray(body.data)) arr = body.data;
      else if (body && body.linguicas && Array.isArray(body.linguicas)) arr = body.linguicas;
      else {
        // Se veio um objeto que contém os itens em alguma propriedade, tentar descobrir
        const possible = Object.values(body).find(v => Array.isArray(v));
        if (Array.isArray(possible)) arr = possible;
      }

      console.log('[carregarProdutos] ✓ Carregados', arr.length, 'produtos');

      const container = document.getElementById('produtos-lista');
      if (!container) return arr;

      container.innerHTML = arr.map(l => {
        // Usar imagem via /api/imagem/:id
        // O backend retorna imagem como "/api/imagem/1"
        let imagemSrc = '';
        
        if (l.imagem && l.imagem.startsWith('/api/imagem/')) {
          // Já é URL da API, usar direto
          imagemSrc = l.imagem; // Ex: /api/imagem/1
        } else if (l.id) {
          // Se não tiver imagem da API, construir da URL
          imagemSrc = `/api/imagem/${l.id}`;
        } else if (l.idproduto) {
          // Fallback para idproduto
          imagemSrc = `/api/imagem/${l.idproduto}`;
        } else {
          // Sem ID, usar fallback
          imagemSrc = '/api/imagem/no-image.png';
        }

        return `
        <div class="produto">
          <img src="${imagemSrc}" 
               alt="${l.nome || l.nomeproduto || ''}" 
               class="produto-imagem" />
          <h3>${l.nome || l.nomeproduto || ''}</h3>
          <p>R$ ${Number(l.preco || l.precounitario || l.preco_unit || 0).toFixed(2).replace('.', ',')}</p>
          <div class="controle-qtd">
            <button class="remover btn-carrinho" data-nome="${l.nome || l.nomeproduto || ''}" aria-label="Remover uma unidade">−</button>
            <span class="quantidade quantidade-carrinho" data-nome="${l.nome || l.nomeproduto || ''}">0</span>
            <button class="adicionar btn-carrinho" data-nome="${l.nome || l.nomeproduto || ''}" data-preco="${l.preco || l.precounitario || 0}" aria-label="Adicionar uma unidade">+</button>
          </div>
        </div>
        `;
      }).join('');

      return arr;
    } catch (err) {
      console.error('[carregarProdutos] ✗ erro', err);
      return [];
    }
  }
  window.carregarProdutos = carregarProdutos;
}

/**
 * Construir URL de imagem com fallback automático
 * Estratégia:
 * 1. Se for caminho completo (/img/..., /imgs/, http), usar direto
 * 2. Se for nome só (ex: 35929.jpeg), servir via /imagens-produtos/
 * 3. Fallback: /img/no-image.png
 */
if (typeof construirUrlImagem === 'undefined') {
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
  window.construirUrlImagem = construirUrlImagem;
}

/**
 * Carrega os produtos disponíveis da API e renderiza na página
 * função defensiva para páginas legadas que ainda incluem este script
 */
if (typeof carregarProdutos === 'undefined') {
  async function carregarProdutos() {
    try {
      const res = await fetch('/api/linguicas');
      if (!res.ok) {
        const txt = await res.text();
        console.warn('[carregarProdutos] ✗ /api/linguicas returned', res.status, txt);
        return [];
      }
      const body = await res.json();
      
      // Suporta várias formas de resposta: array direto, { success, data }, { data }
      let arr = [];
      if (Array.isArray(body)) arr = body;
      else if (body && Array.isArray(body.data)) arr = body.data;
      else if (body && body.success && Array.isArray(body.data)) arr = body.data;
      else if (body && body.linguicas && Array.isArray(body.linguicas)) arr = body.linguicas;
      else {
        // Se veio um objeto que contém os itens em alguma propriedade, tentar descobrir
        const possible = Object.values(body).find(v => Array.isArray(v));
        if (Array.isArray(possible)) arr = possible;
      }

      console.log('[carregarProdutos] ✓ Carregados', arr.length, 'produtos');

      const container = document.getElementById('produtos-lista');
      if (!container) return arr;

      container.innerHTML = arr.map(l => {
        // Construir URL da imagem usando a função helper
        const imagemSrc = construirUrlImagem(l.imagem || l.caminho || '');

        return `
        <div class="produto">
          <img src="${imagemSrc}" 
               alt="${l.nome || l.nomeproduto || ''}" 
               onerror="this.onerror=null;this.src='/img/no-image.png'" 
               class="produto-imagem" />
          <h3>${l.nome || l.nomeproduto || ''}</h3>
          <p>R$ ${Number(l.preco || l.precounitario || l.preco_unit || 0).toFixed(2).replace('.', ',')}</p>
          <div class="controle-qtd">
            <button class="remover btn-carrinho" data-nome="${l.nome || l.nomeproduto || ''}" aria-label="Remover uma unidade">−</button>
            <span class="quantidade quantidade-carrinho" data-nome="${l.nome || l.nomeproduto || ''}">0</span>
            <button class="adicionar btn-carrinho" data-nome="${l.nome || l.nomeproduto || ''}" data-preco="${l.preco || l.precounitario || 0}" aria-label="Adicionar uma unidade">+</button>
          </div>
        </div>
        `;
      }).join('');

      return arr;
    } catch (err) {
      console.error('[carregarProdutos] ✗ erro', err);
      return [];
    }
  }
  window.carregarProdutos = carregarProdutos;
}
document.addEventListener("DOMContentLoaded", () => {
  setupIndexPage();
  setupConfirmacaoPage();
  setupPagamentoPage();
  carregarProdutos();
});

// Easter Egg: 17 cliques na imagem do logo desbloqueiam a Linguiça do Chefe
let cliqueLogo = 0;
const logoImg = document.getElementById("logo-img");

if (logoImg) {
  logoImg.addEventListener("click", () => {
    cliqueLogo++;
    if (cliqueLogo === 17) {
      if (!document.querySelector("[data-nome='Linguiça do Chefe']")) {
        const lista = document.querySelector(".produtos") || document.getElementById("lista-produtos");
        if (lista) {
          const item = document.createElement("div");
          item.className = "produto";
          item.innerHTML = `
            <img src="img/uener.jpg" alt="Linguiça Apimentada" />
            <h3>Linguiça do Chefe 🔥</h3>
            <p>R$ 999,99</p>
            <button class="remover" data-nome="Linguiça do Chefe">−</button>
            <span class="quantidade" data-nome="Linguiça do Chefe">0</span>
            <button class="adicionar" data-nome="Linguiça do Chefe" data-preco="999.99">+</button>
          `;
          lista.appendChild(item);
          alert("🔥 Você desbloqueou a Linguiça do Chefe!");
          // Não precisa chamar setupIndexPage de novo, pois usamos delegation
        }
      }
    }
    if (cliqueLogo === 30) {
      if (!document.querySelector("[data-nome='Linguiça do Kid Bengala']")) {
        const lista = document.querySelector(".produtos") || document.getElementById("lista-produtos");
        if (lista) {
          const item = document.createElement("div");
          item.className = "produto";
          item.innerHTML = `
            <img src="img/Kid.jpg" alt="Linguiça Apimentada" />
            <h3>Linguiça do Kid Bengala🔥(30cm)</h3>
            <p>R$ 999,99</p>
            <button class="remover" data-nome="Linguiça do Kid Bengala">−</button>
            <span class="quantidade" data-nome="Linguiça do Kid Bengala">0</span>
            <button class="adicionar" data-nome="Linguiça do Kid Bengala" data-preco="999.99">+</button>
          `;
          lista.appendChild(item);
          alert("🔥 Você desbloqueou a Linguiça do Kid Bengala!(30 cliques = 30 centimetros)");
          // A delegation já está ativa
        }
      }
    }
  });
}
