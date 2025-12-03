/* pagamento.js
   Lógica da página de pagamento:
   - Carrega pedido a partir de sessionStorage.idPedidoAtual
   - Busca formas de pagamento em /api/formas-pagamento
   - Gera payload EMV PIX (simplificado) e QR via api.qrserver
   - Envia POST /api/pagamentos para criar pagamento (backend valida schema.json)
   Observação: O backend só realizará SQL real após você gerar e colar `schema.json`.
*/

(function () {
  'use strict';

  const els = {
    alerts: document.getElementById('alerts'),
    pedidoList: document.getElementById('pedido-list'),
    totalValor: document.getElementById('total-valor'),
    selectForma: document.getElementById('select-forma'),
    pixArea: document.getElementById('pix-area'),
    qrImg: document.getElementById('qr-img'),
    pixPayload: document.getElementById('pix-payload'),
    copyBtn: document.getElementById('copy-payload'),
    concluirBtn: document.getElementById('concluir'),
    voltarBtn: document.getElementById('voltar')
  };

  function log(msg) { console.log('[pagamento]', msg); }
  function showAlert(msg, type='info') {
    els.alerts.textContent = msg;
    els.alerts.style.color = (type==='error')? 'crimson' : 'inherit';
  }

  async function init() {
    try {
      const user = await verificarSessao();
      if (!user) {
        showAlert('Você precisa estar logado para pagar. Redirecionando...');
        setTimeout(() => location.href = '/login.html', 900);
        return;
      }

      const idPedido = sessionStorage.getItem('idPedidoAtual');
      if (!idPedido) {
        showAlert('Pedido não encontrado. Confirme o pedido antes de pagar.', 'error');
        return;
      }

      await carregarPedido(idPedido);
      await carregarFormasPagamento();
      attachEvents();
    } catch (err) {
      console.error(err);
      showAlert('Erro ao iniciar a página: ' + err.message, 'error');
    }
  }

  async function carregarPedido(id) {
    try {
      const resp = await fetch('/api/pedidos/' + encodeURIComponent(id), { credentials: 'include' });
      if (!resp.ok) {
        const text = await resp.text();
        throw new Error('Erro carregando pedido: ' + text);
      }
      const json = await resp.json();
      if (!json.success) throw new Error(json.message || 'Resposta inválida do servidor');

      const pedido = json.pedido || json.data || json;
      renderPedido(pedido);
    } catch (err) {
      console.error(err);
      showAlert('Não foi possível carregar o pedido: ' + err.message, 'error');
    }
  }

  function renderPedido(pedido) {
    const itens = pedido.itens || pedido.items || pedido.pedidohasproduto || [];
    els.pedidoList.innerHTML = '';
    let total = 0;
    if (!Array.isArray(itens)) {
      // tentar extrair
      els.pedidoList.textContent = 'Pedido sem itens';
      return;
    }
    itens.forEach(i => {
      const nome = i.nomeproduto || i.nome || i.produto || 'Item';
      const preco = parseFloat(i.precounitario ?? i.preco ?? i.valor ?? 0) || 0;
      const qtd = parseInt(i.quantidade ?? i.qtd ?? i.quantidadepedido ?? 1) || 1;
      const div = document.createElement('div');
      div.textContent = `${qtd} x ${nome} — R$ ${preco.toFixed(2)}`;
      els.pedidoList.appendChild(div);
      total += preco * qtd;
    });
    els.totalValor.textContent = total.toFixed(2).replace('.', ',');
    els.totalValor.dataset.total = total.toFixed(2);
    // preparar PIX automático com base no total
    preparePix(total);
  }

  async function carregarFormasPagamento() {
    try {
      const resp = await fetch('/api/formas-pagamento', { credentials: 'include' });
      if (!resp.ok) {
        const text = await resp.text();
        throw new Error('Erro ao buscar formas: ' + text);
      }
      const j = await resp.json();
      if (!j.success) throw new Error(j.message || 'Resposta inválida');
      const formas = j.formas || j.data || j;
      populateFormas(formas || []);
    } catch (err) {
      console.error(err);
      showAlert('Não foi possível carregar formas de pagamento: ' + err.message, 'error');
    }
  }

  function populateFormas(formas) {
    els.selectForma.innerHTML = '';
    if (!Array.isArray(formas) || formas.length === 0) {
      const opt = document.createElement('option'); opt.value = 'pix'; opt.textContent = 'PIX (padrão)'; opt.dataset.id = 'pix';
      els.selectForma.appendChild(opt);
      return;
    }
    formas.forEach(f => {
      const opt = document.createElement('option');
      const nome = f.nomeformapagamento || f.name || f.nome || `Forma ${f.id || f.idformapagamento || ''}`;
      const id = f.idformapagamento || f.id || f.forma_pagamento_id || f.idformapagamento || nome.toLowerCase();
      opt.textContent = nome;
      opt.value = (String(nome).toLowerCase().includes('pix') ? 'pix' : id);
      opt.dataset.id = id;
      els.selectForma.appendChild(opt);
    });
  }

  function attachEvents() {
    els.selectForma.addEventListener('change', (e) => {
      if (e.target.value === 'pix') els.pixArea.style.display = 'block'; else els.pixArea.style.display = 'none';
    });
    els.copyBtn.addEventListener('click', () => {
      els.pixPayload.select();
      document.execCommand('copy');
      alert('Código copiado');
    });
    els.concluirBtn.addEventListener('click', concluirPagamento);
    els.voltarBtn.addEventListener('click', () => { location.href = '/index.html'; });
  }

  // Geração do payload EMV (simplificado) + CRC16
  function buildPixPayload({pixKey='00000000000', merchantName='Loja', merchantCity='SAO PAULO', txid, amount}) {
    function tag(id, value) { const v = String(value||''); const len = String(v.length).padStart(2,'0'); return id + len + v; }
    let payload = '';
    payload += tag('00','01');
    payload += tag('52','0000');
    payload += tag('53','986');
    if (amount) payload += tag('54', Number(amount).toFixed(2));
    payload += tag('58','BR');
    payload += tag('59', merchantName);
    payload += tag('60', merchantCity);
    const mai = tag('00','BR.GOV.BCB.PIX') + tag('01', pixKey);
    payload += tag('26', mai);
    if (txid) payload += tag('62', tag('05', txid));
    const withoutCrc = payload + '6304';
    const crc = crc16(withoutCrc).toString(16).toUpperCase().padStart(4,'0');
    payload += '63' + '04' + crc;
    return payload;
  }

  function crc16(str) {
    let crc = 0x0000;
    for (let i=0;i<str.length;i++){
      crc ^= str.charCodeAt(i) << 8;
      for (let j=0;j<8;j++){
        if (crc & 0x8000) crc = ((crc << 1) ^ 0x1021) & 0xFFFF; else crc = (crc << 1) & 0xFFFF;
      }
    }
    return crc & 0xFFFF;
  }

  function preparePix(amount) {
    const pixKey = '00000000000'; // substituir pela sua chave real após integração
    const txid = 'TID' + Date.now();
    const p = buildPixPayload({pixKey, merchantName:'Loja Exemplo', merchantCity:'SAO PAULO', txid, amount});
    els.pixPayload.value = p;
    const qr = 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=' + encodeURIComponent(p);
    els.qrImg.src = qr;
    els.pixArea.style.display = 'block';
  }

  async function concluirPagamento() {
    try {
      const formaOpt = els.selectForma.options[els.selectForma.selectedIndex];
      const formaId = formaOpt ? formaOpt.dataset.id || formaOpt.value : null;
      const pedidoId = sessionStorage.getItem('idPedidoAtual');
      if (!pedidoId) return alert('Pedido não encontrado');
      const total = parseFloat(els.totalValor.dataset.total || '0');

      // chama a API que criará o pagamento
      const body = { pedidoId, formaPagamentoId: formaId, valor: total };
      const resp = await fetch('/api/pagamentos', {
        method: 'POST', headers: { 'Content-Type':'application/json' }, credentials: 'include', body: JSON.stringify(body)
      });
      const j = await resp.json().catch(()=>({success:false,message:'Resposta inválida'}));
      if (!resp.ok || !j.success) {
        const msg = j.message || `Erro HTTP ${resp.status}`;
        throw new Error(msg);
      }
      alert('Pagamento registrado com sucesso');
      // limpar estado local
      sessionStorage.removeItem('cart');
      sessionStorage.removeItem('idPedidoAtual');
      location.href = '/confirmacao.html';
    } catch (err) {
      console.error(err);
      alert('Erro ao registrar pagamento: ' + err.message);
    }
  }

  // iniciar
  document.addEventListener('DOMContentLoaded', init);

})();
