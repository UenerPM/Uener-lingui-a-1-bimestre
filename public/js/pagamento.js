/**
 * ========================================
 * PAGAMENTO.JS - VALIDAÇÃO FRONTEND
 * Versão 2025 - Completa e Robusta
 * ========================================
 * 
 * Responsabilidades:
 * - Validar todos os campos de entrada
 * - Gerar PIX com CRC16 válido
 * - Validar cartão com Luhn
 * - Enviar dados limpos ao backend
 * - Feedback claro ao usuário
 */

'use strict';

// ===== ESTADO GLOBAL =====
let totalPagamento = 0;
let pedidoAtual = null;
let itensCarrinho = [];

// ===== ELEMENTOS DO DOM =====
const els = {
  totalAmount: document.getElementById('total-amount'),
  itemsSummary: document.getElementById('items-summary'),
  pixContainer: document.getElementById('pix-container'),
  cardContainer: document.getElementById('card-container'),
  moneyContainer: document.getElementById('money-container'),
  qrCodeImg: document.getElementById('qr-code-img'),
  pixCode: document.getElementById('pix-code'),
  copyBtn: document.querySelector('.copy-button'),
  errorMsg: document.getElementById('error-msg'),
  successMsg: document.getElementById('success-msg'),
  successSection: document.getElementById('success-section'),
  paymentSection: document.getElementById('payment-section'),
  completeBtn: document.getElementById('complete-btn'),
  backBtn: document.getElementById('back-btn'),
  cardNumber: document.getElementById('card-number'),
  cardHolder: document.getElementById('card-holder'),
  cardExpiry: document.getElementById('card-expiry'),
  cardCvv: document.getElementById('card-cvv'),
  moneyGiven: document.getElementById('money-given'),
  changeInfo: document.getElementById('change-info')
};

// ===== FUNÇÕES DE LOG E FEEDBACK =====

function log(...args) {
  console.log('[pagamento]', ...args);
}

function showError(msg) {
  els.errorMsg.textContent = msg;
  els.errorMsg.classList.add('show');
  window.scrollTo({ top: 0, behavior: 'smooth' });
  setTimeout(() => { els.errorMsg.classList.remove('show'); }, 5000);
}

function showSuccess(msg) {
  els.successMsg.textContent = msg;
  els.successMsg.classList.add('show');
  window.scrollTo({ top: 0, behavior: 'smooth' });
  setTimeout(() => { els.successMsg.classList.remove('show'); }, 3000);
}

// ===== VALIDADORES =====

/**
 * Valida número de cartão com Luhn
 */
function validarCartao(numero) {
  const nums = numero.replace(/\D/g, '');
  
  if (nums.length < 13 || nums.length > 19) {
    return false;
  }
  
  let sum = 0;
  let isEven = false;
  
  for (let i = nums.length - 1; i >= 0; i--) {
    let digit = parseInt(nums[i], 10);
    
    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }
    
    sum += digit;
    isEven = !isEven;
  }
  
  return sum % 10 === 0;
}

/**
 * Valida validade do cartão (MM/AA)
 */
function validarValidade(valor) {
  if (!/^\d{2}\/\d{2}$/.test(valor)) {
    return false;
  }
  
  const [mes, ano] = valor.split('/').map(Number);
  
  if (mes < 1 || mes > 12) {
    return false;
  }
  
  const agora = new Date();
  const anoAtual = agora.getFullYear() % 100;
  const mesAtual = agora.getMonth() + 1;
  
  // Cartão válido se: ano futuro OU (mesmo ano e mês >= mês atual)
  return ano > anoAtual || (ano === anoAtual && mes >= mesAtual);
}

/**
 * Valida CVV (3-4 dígitos)
 */
function validarCVV(cvv) {
  return /^\d{3,4}$/.test(cvv);
}

/**
 * Valida titular do cartão
 */
function validarTitular(nome) {
  return nome.trim().length >= 3;
}

/**
 * Valida valor do troco
 */
function validarTroco(valorEntregue, total) {
  const valor = parseFloat(valorEntregue);
  const t = parseFloat(total);
  
  if (Number.isNaN(valor) || Number.isNaN(t)) {
    return false;
  }
  
  return valor >= t;
}

// ===== PIX =====

/**
 * Calcula CRC16-CCITT para EMV (conforme padrão BRCode)
 * - Polynomial: 0x1021
 * - Initial value: 0xFFFF (correto!)
 * - Sem reflexão
 * - Saída: 4 chars HEX maiúsculo
 */
function crc16Ccitt(str) {
  let crc = 0xFFFF; // ✅ CORRIGIDO: era 0x0000, agora 0xFFFF
  
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    
    for (let j = 0; j < 8; j++) {
      if (crc & 0x8000) {
        crc = ((crc << 1) ^ 0x1021) & 0xFFFF;
      } else {
        crc = (crc << 1) & 0xFFFF;
      }
    }
  }
  
  return (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
}

/**
 * Remove diacríticos de string (ç → c, ã → a, etc)
 */
function removerDiacriticos(str) {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/**
 * Constrói payload PIX EMV-Co conforme padrão BRCode
 * 
 * Campos:
 * Tag 00: Payload Format Indicator = '01'
 * Tag 26: Merchant Account Information (GUI + Chave PIX)
 * Tag 52: MCC = '0000' (P2P)
 * Tag 53: Moeda = '986' (BRL)
 * Tag 54: Valor (formatado com ponto, 2 casas)
 * Tag 58: País = 'BR'
 * Tag 59: Nome comercio (até 25 bytes)
 * Tag 60: Cidade comercio (até 15 bytes)
 * Tag 62: Dados adicionais (TXID)
 * Tag 63: CRC16-CCITT
 */
function construirPayloadPix(valor) {
  function tag(id, value) {
    const v = String(value || '');
    const len = String(v.length).padStart(2, '0');
    return id + len + v;
  }
  
  // Usar chave PIX correta
  const pixKey = 'uperesmarcon@gmail.com'; // ✅ Chave PIX real
  const merchantName = removerDiacriticos('UENER LINGUÇO').substring(0, 25); // ✅ Remove cedilha
  const merchantCity = removerDiacriticos('CAMPO MOURAO').substring(0, 15);
  const txId = 'UEN' + Date.now().toString().slice(-8); // ID único
  
  // Construir payload (ordem conforme padrão BRCode)
  let payload = '';
  payload += tag('00', '01'); // Payload Format Indicator
  
  // Merchant Account Information (tag 26)
  // Subtag 00: GUI (sempre BR.GOV.BCB.PIX - maiúsculo!)
  // Subtag 01: Chave PIX
  const mai = tag('00', 'BR.GOV.BCB.PIX') + tag('01', pixKey); // ✅ Maiúsculo
  payload += tag('26', mai);
  
  payload += tag('52', '0000'); // MCC (P2P)
  payload += tag('53', '986'); // Moeda BRL
  payload += tag('54', valor.toFixed(2)); // ✅ Valor com ponto, 2 casas
  payload += tag('58', 'BR'); // País
  payload += tag('59', merchantName); // Nome
  payload += tag('60', merchantCity); // Cidade
  
  // Unique Transaction ID (tag 62, subtag 05)
  const additionalData = tag('05', txId);
  payload += tag('62', additionalData);
  
  // Calcular CRC16-CCITT (tag 63)
  const payloadComCrc = payload + '6304'; // Placeholder
  const crcValue = crc16Ccitt(payloadComCrc); // ✅ Usa novo CRC correto
  payload += tag('63', crcValue);
  
  return payload;
}

/**
 * Gera QR Code PIX via Backend
 */
async function gerarPixQrCode(valor) {
  try {
    log(`Gerando PIX para valor: R$ ${valor.toFixed(2)}`);
    log('Chamando backend: /api/pix/generate');
    
    // ✅ Chamar backend para gerar PIX
    const resp = await fetch(`/api/pix/generate?amount=${valor.toFixed(2)}`);
    
    if (!resp.ok) {
      throw new Error(`Erro HTTP ${resp.status}`);
    }

    const data = await resp.json();
    
    if (!data.payload) {
      throw new Error('Payload não retornado pelo backend');
    }

    const payload = data.payload;
    
    log(`✓ Payload recebido do backend`);
    log(`Tamanho: ${payload.length} caracteres`);
    log(`CRC: ${data.crc}`);
    log(`Validado: ${data.validado ? 'SIM' : 'NÃO'}`);
    
    // Armazenar no textarea
    els.pixCode.value = payload;
    
    // Usar QR do backend ou gerar localmente
    const qrUrl = data.qr || `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(payload)}`;
    els.qrCodeImg.src = qrUrl;
    
    log('✓ QR Code exibido');
  } catch (err) {
    logError(`Erro ao gerar PIX: ${err.message}`);
    throw err;
  }
}

/**
 * Copia código PIX para clipboard
 */
window.copyPixCode = function() {
  try {
    els.pixCode.select();
    document.execCommand('copy');
    showSuccess('Código PIX copiado para a área de transferência!');
  } catch (err) {
    showError('Erro ao copiar código PIX');
  }
};

// ===== GERENCIAR CONTAINERS DE PAGAMENTO =====

/**
 * Exibe ou oculta containers conforme forma selecionada
 */
function atualizarContainerPagamento() {
  const metodo = document.querySelector('input[name="payment-method"]:checked').value;
  
  log(`Método selecionado: ${metodo}`);
  
  // Ocultar todos
  els.pixContainer.classList.remove('show');
  els.cardContainer.classList.remove('show');
  els.moneyContainer.style.display = 'none';
  
  // Mostrar selecionado
  switch (metodo) {
    case 'pix':
      els.pixContainer.classList.add('show');
      break;
    case 'card':
      els.cardContainer.classList.add('show');
      break;
    case 'money':
      els.moneyContainer.style.display = 'block';
      break;
  }
}

// ===== INICIALIZAÇÃO =====

async function init() {
  try {
    log('Inicializando página de pagamento...');
    
    // 1. Validar sessão
    const user = await verificarSessao();
    if (!user) {
      showError('Você precisa fazer login para acessar o pagamento');
      setTimeout(() => { window.location.href = '/login.html'; }, 1500);
      return;
    }
    
    log(`Usuário autenticado: ${user.nomepessoa || user.username}`);
    
    // 2. Validar pedido
    const pedidoId = sessionStorage.getItem('idPedidoAtual');
    if (!pedidoId) {
      showError('Pedido não encontrado. Por favor, confirme um pedido antes de pagar.');
      setTimeout(() => { window.location.href = '/index.html'; }, 2000);
      return;
    }
    
    log(`Pedido ID: ${pedidoId}`);
    
    // 3. Carregar pedido e itens
    await carregarPedido(pedidoId);
    
    // 4. Carregar formas de pagamento
    await carregarFormas();
    
    // 5. Configurar listeners
    configurarListeners();
    
    // 6. Gerar PIX inicial
    if (totalPagamento > 0) {
      gerarPixQrCode(totalPagamento);
    }
    
    log('✓ Página carregada com sucesso');
  } catch (err) {
    log(`Erro na inicialização: ${err.message}`);
    showError(`Erro ao carregar página: ${err.message}`);
  }
}

/**
 * Carrega pedido da API
 */
async function carregarPedido(id) {
  try {
    log(`Carregando pedido ${id}...`);
    
    const resp = await fetch(`/api/pedidos/${encodeURIComponent(id)}`, {
      credentials: 'include'
    });
    
    if (!resp.ok) {
      throw new Error(`HTTP ${resp.status}`);
    }
    
    const json = await resp.json();
    
    if (!json.success) {
      throw new Error(json.message || 'Resposta inválida');
    }
    
    pedidoAtual = json.data;
    itensCarrinho = pedidoAtual.itens || [];
    
    log(`Pedido carregado: ${itensCarrinho.length} itens`);
    
    renderizarItens(itensCarrinho);
  } catch (err) {
    log(`Erro ao carregar pedido: ${err.message}`);
    throw err;
  }
}

/**
 * Renderiza itens do pedido
 */
function renderizarItens(itens) {
  els.itemsSummary.innerHTML = '';
  totalPagamento = 0;
  
  if (!Array.isArray(itens) || itens.length === 0) {
    els.itemsSummary.innerHTML = '<p style="text-align: center; color: #999;">Nenhum item no pedido</p>';
    els.totalAmount.textContent = '0,00';
    return;
  }
  
  itens.forEach(item => {
    const nome = item.nomeproduto || item.nome || 'Item';
    const preco = parseFloat(item.precounitario || item.preco || 0) || 0;
    const qtd = parseInt(item.quantidade || 1, 10) || 1;
    const subtotal = preco * qtd;
    
    totalPagamento += subtotal;
    
    const row = document.createElement('div');
    row.className = 'item-row';
    row.innerHTML = `
      <span class="item-name">${qtd}× ${nome}</span>
      <span class="item-price">R$ ${preco.toFixed(2)}</span>
    `;
    els.itemsSummary.appendChild(row);
  });
  
  // Exibir total
  els.totalAmount.textContent = totalPagamento.toFixed(2).replace('.', ',');
  
  log(`Total calculado: R$ ${totalPagamento.toFixed(2)}`);
}

/**
 * Carrega formas de pagamento da API
 */
async function carregarFormas() {
  try {
    log('Carregando formas de pagamento...');
    
    const resp = await fetch('/api/formas-pagamento', {
      credentials: 'include'
    });
    
    if (!resp.ok) {
      throw new Error(`HTTP ${resp.status}`);
    }
    
    const json = await resp.json();
    
    if (!json.success) {
      throw new Error(json.message || 'Resposta inválida');
    }
    
    const formas = json.data || json.formas || [];
    log(`Formas carregadas: ${formas.length}`);
    
  } catch (err) {
    log(`Erro ao carregar formas (usando defaults): ${err.message}`);
    // Fallback para defaults
  }
}

/**
 * Configura listeners dos eventos
 */
function configurarListeners() {
  // Mudança de método de pagamento
  document.querySelectorAll('input[name="payment-method"]').forEach(input => {
    input.addEventListener('change', atualizarContainerPagamento);
  });
  
  // Formatação de cartão
  els.cardNumber.addEventListener('input', (e) => {
    let v = e.target.value.replace(/\D/g, '').slice(0, 16);
    v = v.match(/.{1,4}/g)?.join(' ') || v;
    e.target.value = v;
  });
  
  // Formatação de validade
  els.cardExpiry.addEventListener('input', (e) => {
    let v = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (v.length > 2) v = v.slice(0, 2) + '/' + v.slice(2);
    e.target.value = v;
  });
  
  // Apenas números em CVV
  els.cardCvv.addEventListener('input', (e) => {
    e.target.value = e.target.value.replace(/\D/g, '').slice(0, 4);
  });
  
  // Cálculo de troco
  els.moneyGiven.addEventListener('input', (e) => {
    const valor = parseFloat(e.target.value) || 0;
    const troco = valor - totalPagamento;
    
    if (troco < 0) {
      els.changeInfo.textContent = `Faltam R$ ${Math.abs(troco).toFixed(2)}`;
      els.changeInfo.style.color = '#c62828';
    } else {
      els.changeInfo.textContent = `Troco: R$ ${troco.toFixed(2)}`;
      els.changeInfo.style.color = '#2e7d32';
    }
  });
}

/**
 * Concluir pagamento
 */
window.completePayment = async function() {
  try {
    log('Iniciando conclusão do pagamento...');
    
    // Desabilitar botão
    els.completeBtn.disabled = true;
    els.completeBtn.textContent = 'Processando...';
    
    const metodo = document.querySelector('input[name="payment-method"]:checked').value;
    const pedidoId = sessionStorage.getItem('idPedidoAtual');
    
    log(`Método: ${metodo}, Pedido: ${pedidoId}`);
    
    // Validações específicas por método
    if (metodo === 'card') {
      const num = els.cardNumber.value.replace(/\s/g, '');
      const titular = els.cardHolder.value;
      const validade = els.cardExpiry.value;
      const cvv = els.cardCvv.value;
      
      if (!validarCartao(num)) {
        throw new Error('Número de cartão inválido');
      }
      if (!validarTitular(titular)) {
        throw new Error('Nome do titular inválido');
      }
      if (!validarValidade(validade)) {
        throw new Error('Data de validade inválida ou expirada');
      }
      if (!validarCVV(cvv)) {
        throw new Error('CVV inválido');
      }
      
      log('✓ Validação de cartão concluída');
    } else if (metodo === 'money') {
      const valor = parseFloat(els.moneyGiven.value) || 0;
      
      if (!validarTroco(valor, totalPagamento)) {
        throw new Error('Valor entregue insuficiente');
      }
      
      log('✓ Validação de dinheiro concluída');
    } else if (metodo === 'pix') {
      log('✓ PIX selecionado');
    }
    
    // Enviar para backend
    log('Enviando para backend...');
    
    const body = {
      idpedido: pedidoId,
      idformadepagamento: metodo === 'pix' ? 3 : (metodo === 'card' ? 1 : 4), // IDs das formas
      valorpagamento: totalPagamento
    };
    
    log(`Payload: ${JSON.stringify(body)}`);
    
    const resp = await fetch('/api/pagamentos', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    
    const json = await resp.json();
    
    log(`Resposta HTTP ${resp.status}: ${JSON.stringify(json)}`);
    
    if (!resp.ok || !json.success) {
      throw new Error(json.message || `HTTP ${resp.status}`);
    }
    
    // SUCESSO
    log('✓ Pagamento criado com sucesso!');
    
    els.paymentSection.style.display = 'none';
    els.successSection.classList.add('show');
    
    // Limpar sessão
    sessionStorage.removeItem('idPedidoAtual');
    localStorage.removeItem('carrinho');
    
    // Redirecionar
    setTimeout(() => {
      window.location.href = '/confirmacao.html';
    }, 3000);
    
  } catch (err) {
    log(`Erro: ${err.message}`);
    showError(`Erro: ${err.message}`);
    els.completeBtn.disabled = false;
    els.completeBtn.textContent = 'Concluir Pagamento';
  }
};

/**
 * Voltar
 */
window.goBack = function() {
  window.location.href = '/index.html';
};

// ===== INICIAR =====
document.addEventListener('DOMContentLoaded', init);
