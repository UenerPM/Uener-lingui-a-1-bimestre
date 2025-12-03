/**
 * ===== EXEMPLO DE INTEGRAÇÃO PIX NO FRONTEND =====
 * Integra o módulo PIX EMV-Co BR Code com o frontend
 * 
 * Como usar:
 * 1. Abra a página: http://localhost:3000/pagamento-pix-demo.html
 * 2. Informe um valor
 * 3. Clique "Gerar PIX"
 * 4. Escaneie o QR com seu app bancário
 * 5. Ou copie o código "copia e cola"
 */

// Estado global
const state = {
  pixPayload: null,
  pixConfig: null,
  valor: null
};

// ===== ELEMENTOS DO DOM =====
const elementos = {
  valorInput: document.getElementById('valor-pix'),
  gerarBtn: document.getElementById('gerar-pix-btn'),
  qrImg: document.getElementById('qr-pix-img'),
  payloadText: document.getElementById('payload-pix'),
  copyBtn: document.getElementById('copy-pix-btn'),
  statusDiv: document.getElementById('status-pix'),
  resultadoDiv: document.getElementById('resultado-pix')
};

// ===== VALIDAR ELEMENTOS (segurança) =====
function verificarElementos() {
  const ausentes = [];
  for (const [nome, el] of Object.entries(elementos)) {
    if (!el) ausentes.push(nome);
  }
  if (ausentes.length > 0) {
    console.warn('[PIX] Elementos ausentes:', ausentes);
  }
}

// ===== UTILITY: LOG E STATUS =====
function log(msg) {
  console.log('[PIX]', msg);
}

function mostrarStatus(msg, tipo = 'info') {
  if (!elementos.statusDiv) return;
  
  const classes = {
    'info': 'status-info',
    'sucesso': 'status-sucesso',
    'erro': 'status-erro',
    'aviso': 'status-aviso'
  };
  
  elementos.statusDiv.textContent = msg;
  elementos.statusDiv.className = `status-pix ${classes[tipo] || classes.info}`;
  elementos.statusDiv.style.display = 'block';
  
  if (tipo === 'sucesso' || tipo === 'info') {
    setTimeout(() => {
      elementos.statusDiv.style.display = 'none';
    }, 3000);
  }
}

// ===== CARREGAR CONFIGURAÇÃO PIX DO BACKEND =====
async function carregarConfigPix() {
  try {
    const response = await fetch('/api/pix-config');
    const json = await response.json();
    
    if (json.success && json.config) {
      state.pixConfig = json.config;
      log(`✓ Configuração PIX carregada: ${state.pixConfig.pixKey}`);
      return true;
    }
  } catch (err) {
    log('⚠️  Não foi possível carregar config PIX do backend');
  }
  
  // Usar defaults
  state.pixConfig = {
    pixKey: 'uperesmarcon@gmail.com',
    merchantName: 'UENER LINGUÇO',
    merchantCity: 'CAMPO MOURAO'
  };
  log('✓ Usando configuração PIX padrão');
  return true;
}

// ===== GERAR PIX (CHAMAR BACKEND) =====
async function gerarPix() {
  try {
    // Validar valor
    const valor = parseFloat(elementos.valorInput.value);
    if (!valor || valor <= 0) {
      mostrarStatus('Informe um valor válido e maior que 0', 'erro');
      return;
    }
    
    state.valor = valor;
    log(`Gerando PIX para R$ ${valor.toFixed(2)}...`);
    mostrarStatus('Gerando PIX...', 'info');
    
    // Chamar API
    const response = await fetch('/api/pix/gerar', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ valor: valor })
    });
    
    const json = await response.json();
    
    if (!json.success) {
      throw new Error(json.message || 'Erro desconhecido');
    }
    
    const { data } = json;
    state.pixPayload = data.payload;
    
    // Exibir resultados
    elementos.payloadText.value = data.payload;
    elementos.qrImg.src = data.qrcode;
    elementos.qrImg.style.display = 'block';
    elementos.resultadoDiv.style.display = 'block';
    
    mostrarStatus(`✓ PIX gerado com sucesso! R$ ${valor.toFixed(2)}`, 'sucesso');
    log(`✓ Payload: ${data.payload.slice(0, 50)}...`);
    log(`✓ CRC validado: ${data.validado}`);
    
  } catch (err) {
    mostrarStatus(`Erro: ${err.message}`, 'erro');
    log(`❌ ${err.message}`);
  }
}

// ===== COPIAR PARA CLIPBOARD =====
async function copiarPix() {
  if (!state.pixPayload) {
    mostrarStatus('Gere um PIX primeiro', 'aviso');
    return;
  }
  
  try {
    // Tentar Clipboard API moderna
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(state.pixPayload);
      mostrarStatus('✓ Código PIX copiado para a área de transferência!', 'sucesso');
      log('Código PIX copiado via Clipboard API');
      return;
    }
    
    // Fallback: execCommand
    elementos.payloadText.select();
    elementos.payloadText.setSelectionRange(0, 99999);
    document.execCommand('copy');
    mostrarStatus('✓ Código PIX copiado! (modo compatibilidade)', 'sucesso');
    log('Código PIX copiado via execCommand');
    
  } catch (err) {
    mostrarStatus('Erro ao copiar. Tente copiar manualmente.', 'erro');
    log(`❌ Erro ao copiar: ${err.message}`);
  }
}

// ===== INICIALIZAR =====
async function inicializar() {
  log('Inicializando módulo PIX...');
  
  // Verificar elementos
  verificarElementos();
  
  // Carregar configuração
  await carregarConfigPix();
  
  // Configurar listeners
  if (elementos.gerarBtn) {
    elementos.gerarBtn.addEventListener('click', gerarPix);
  }
  
  if (elementos.copyBtn) {
    elementos.copyBtn.addEventListener('click', copiarPix);
  }
  
  // Permitir Enter na entrada de valor
  if (elementos.valorInput) {
    elementos.valorInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') gerarPix();
    });
  }
  
  log('✓ Módulo PIX pronto');
}

// ===== QUANDO DOM ESTIVER PRONTO =====
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', inicializar);
} else {
  inicializar();
}
