const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { gerarPayloadPix, gerarQRCodePix, validarPayloadPix, gerarRespostaPix } = require('../lib/pix');

function log(msg) {
  console.log(`[pagamento] ${msg}`);
}

function logError(msg) {
  console.error(`[pagamento] ❌ ${msg}`);
}

router.get('/health', (req, res) => {
  res.json({ success: true, message: 'payment route alive' });
});

// POST /api/pix/gerar — Gera payload PIX EMV-Co BR Code
router.post('/pix/gerar', express.json(), (req, res) => {
  try {
    log('➡️  POST /api/pix/gerar');
    
    const valor = req.body?.valor || req.query?.valor;
    
    if (valor === undefined || valor === null) {
      return res.status(400).json({ 
        success: false, 
        message: 'Parâmetro "valor" é obrigatório' 
      });
    }
    
    const numValor = Number(valor);
    if (!isFinite(numValor) || numValor < 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Valor deve ser um número não-negativo' 
      });
    }
    
    // Gerar resposta PIX (payload + QR)
    const resposta = gerarRespostaPix(numValor);
    
    log(`✓ PIX gerado para R$ ${numValor.toFixed(2)}`);
    log(`  Payload: ${resposta.payload.slice(0, 50)}...`);
    log(`  CRC validado: ${resposta.validado}`);
    
    return res.json({ 
      success: true, 
      message: 'PIX gerado com sucesso',
      data: resposta
    });
  } catch (err) {
    const logMsg = `Erro ao gerar PIX: ${err.message}`;
    console.error(`[pagamento] ❌ ${logMsg}`);
    return res.status(500).json({ 
      success: false, 
      message: logMsg
    });
  }
});

// GET /api/pix/validar — Valida um payload PIX existente
router.get('/pix/validar', (req, res) => {
  try {
    log('➡️  GET /api/pix/validar');
    
    const payload = req.query?.payload;
    
    if (!payload) {
      return res.status(400).json({ 
        success: false, 
        message: 'Parâmetro "payload" é obrigatório' 
      });
    }
    
    const isValid = validarPayloadPix(payload);
    
    log(`✓ Validação de payload: ${isValid ? 'VÁLIDO' : 'INVÁLIDO'}`);
    
    return res.json({ 
      success: true, 
      valido: isValid,
      payload: payload.slice(0, 50) + '...',
      mensagem: isValid ? 'Payload PIX válido' : 'Payload PIX inválido'
    });
  } catch (err) {
    console.error(`[pagamento] ❌ Erro ao validar PIX: ${err.message}`);
    return res.status(500).json({ 
      success: false, 
      message: `Erro ao validar PIX: ${err.message}`
    });
  }
});


// GET /api/pix-config — Retorna configuração PIX
router.get('/pix-config', (req, res) => {
  const config = {
    pixKey: process.env.PIX_KEY || 'uperesmarcon@gmail.com',
    merchantName: process.env.MERCHANT_NAME || 'UENER LINGUÇO',
    merchantCity: process.env.MERCHANT_CITY || 'CAMPO MOURAO',
    merchantDocument: process.env.MERCHANT_DOCUMENT || '00000000000000'
  };
  log(`✓ Configuração PIX retornada: chave=${config.pixKey}`);
  return res.json({ success: true, config });
});

// GET /api/formas-pagamento — Lista formas de pagamento
router.get('/formas-pagamento', async (req, res) => {
  try {
    log('➡️  GET /api/formas-pagamento');
    const q = 'SELECT idformapagamento, nomeformapagamento FROM formadepagamento ORDER BY idformapagamento';
    const { rows } = await pool.query(q);
    log(`✓ ${rows.length} forma(s) encontrada(s)`);
    
    // Transformar para múltiplos formatos de compatibilidade
    const formas = rows.map(row => ({
      idformapagamento: row.idformapagamento,
      nomeformapagamento: row.nomeformapagamento,
      id: row.idformapagamento,
      nome: row.nomeformapagamento
    }));
    
    return res.json({ success: true, formas, data: formas });
  } catch (err) {
    logError(`Erro ao listar formas: ${err.message}`);
    return res.status(500).json({ success:false, message: 'Erro ao buscar formas de pagamento', error: err.message });
  }
});

// GET /api/pedidos/:id — Recupera pedido e itens
router.get('/pedidos/:id', async (req, res) => {
  const id = parseInt(req.params.id,10);
  if (isNaN(id)) return res.status(400).json({ success:false, message: 'ID de pedido inválido' });
  try {
    const pedidoQ = 'SELECT idpedido, datadopedido, clientepessoacpfpessoa, funcionariopessoacpfpessoa FROM pedido WHERE idpedido=$1';
    const pRes = await pool.query(pedidoQ, [id]);
    if (pRes.rowCount === 0) return res.status(404).json({ success:false, message: 'Pedido não encontrado' });
    const pedido = pRes.rows[0];

    // Verificar propriedade: cliente só vê seus pedidos, funcionário/adm podem ver
    const sessionUser = req.session && req.session.user;
    if (!sessionUser) return res.status(401).json({ success:false, message: 'Login requerido' });
    const isCliente = sessionUser.userType === 'cliente' || sessionUser.role === 'cliente';
    const isFuncionario = sessionUser.userType === 'funcionario' || sessionUser.role === 'funcionario' || sessionUser.isAdmin;
    if (isCliente && String(sessionUser.cpfpessoa) !== String(pedido.clientepessoacpfpessoa)) {
      return res.status(403).json({ success:false, message: 'Acesso negado ao pedido' });
    }

    // Buscar itens com produto e imagem
    const itensQ = `SELECT php.produtoidproduto, php.quantidade, php.precounitario, prod.nomeproduto, prod.id_imagem, img.caminho
                    FROM pedidohasproduto php
                    JOIN produto prod ON prod.idproduto = php.produtoidproduto
                    LEFT JOIN imagem img ON img.id = prod.id_imagem
                    WHERE php.pedidoidpedido = $1`;
    const itensRes = await pool.query(itensQ, [id]);
    return res.json({ success:true, pedido, itens: itensRes.rows });
  } catch (err) {
    console.error('get pedido error', err);
    return res.status(500).json({ success:false, message: 'Erro ao buscar pedido' });
  }
});

// POST /api/pedidos — Criar pedido (transactional)
router.post('/pedidos', express.json(), async (req, res) => {
  const body = req.body || {};
  const itens = body.itens;
  if (!Array.isArray(itens) || itens.length === 0) return res.status(400).json({ success:false, message: 'Enviar array de itens' });
  const sessionUser = req.session && req.session.user;
  if (!sessionUser) return res.status(401).json({ success:false, message: 'Login requerido' });

  const clientCpf = sessionUser.cpfpessoa;
  const funcionarioCpf = (sessionUser.userType === 'funcionario' || sessionUser.role === 'funcionario') ? sessionUser.cpfpessoa : null;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const insertPedido = 'INSERT INTO pedido (datadopedido, clientepessoacpfpessoa, funcionariopessoacpfpessoa) VALUES (CURRENT_DATE, $1, $2) RETURNING idpedido';
    const pRes = await client.query(insertPedido, [clientCpf, funcionarioCpf]);
    const idpedido = pRes.rows[0].idpedido;

    // Para cada item: buscar preço atual e inserir
    const insertItem = 'INSERT INTO pedidohasproduto (produtoidproduto, pedidoidpedido, quantidade, precounitario) VALUES ($1, $2, $3, $4)';
    for (const it of itens) {
      const produtoId = it.produtoId || it.produtoid || it.idproduto || it.productId;
      const quantidade = parseInt(it.quantidade || it.qtd || 1, 10) || 1;
      if (!produtoId) throw new Error('produtoId ausente em um dos itens');
      const prodRes = await client.query('SELECT precounitario FROM produto WHERE idproduto=$1', [produtoId]);
      if (prodRes.rowCount === 0) throw new Error(`Produto ${produtoId} não encontrado`);
      const preco = prodRes.rows[0].precounitario;
      await client.query(insertItem, [produtoId, idpedido, quantidade, preco]);
    }

    await client.query('COMMIT');
    console.log('[pedidos] criado idpedido=', idpedido, 'user=', sessionUser && sessionUser.cpfpessoa);
    // Retornar objeto compatível com frontend (data.pedido.idpedido)
    return res.json({ success:true, pedido: { idpedido } });
  } catch (err) {
    await client.query('ROLLBACK').catch(()=>{});
    console.error('criar pedido error', err);
    return res.status(500).json({ success:false, message: err.message || 'Erro ao criar pedido' });
  } finally {
    client.release();
  }
});

// POST /api/pagamentos — Criar pagamento
router.post('/pagamentos', express.json(), async (req, res) => {
  const client = await pool.connect();
  try {
    log('➡️  POST /api/pagamentos');
    
    const b = req.body || {};
    const pedidoId = b.pedidoId || b.idpedido || b.pedidoidpedido;
    const formaId = b.formaPagamentoId || b.idformadepagamento || b.forma_pagamento_id || b.formaId;
    const valor = b.valorpagamento || b.valor || b.valortotal || b.valortotalpagamento;
    
    log(`Dados: pedidoId=${pedidoId}, formaId=${formaId}, valor=${valor}`);
    
    if (!pedidoId || !formaId || typeof valor === 'undefined') {
      logError('Campos obrigatórios ausentes');
      return res.status(400).json({ success:false, message: 'Enviar { pedidoId, formaPagamentoId, valor }' });
    }

    const pedidoIdNum = Number(pedidoId);
    const formaIdNum = Number(formaId);
    const valorNum = Number(valor);
    
    if (isNaN(pedidoIdNum) || isNaN(formaIdNum) || isNaN(valorNum)) {
      logError('Valores não são números');
      return res.status(400).json({ success:false, message: 'pedidoId, formaPagamentoId e valor devem ser números' });
    }

    // Iniciar transação
    await client.query('BEGIN');
    
    // Verificar pedido
    log(`[TX] Verificando pedido ${pedidoIdNum}...`);
    const pRes = await client.query('SELECT idpedido, clientepessoacpfpessoa FROM pedido WHERE idpedido=$1', [pedidoIdNum]);
    if (pRes.rowCount === 0) {
      await client.query('ROLLBACK');
      logError(`Pedido não encontrado: ${pedidoIdNum}`);
      return res.status(404).json({ success:false, message: 'Pedido não encontrado' });
    }
    
    log(`[TX] ✓ Pedido encontrado`);
    
    // Verificar forma
    log(`[TX] Verificando forma ${formaIdNum}...`);
    const fRes = await client.query('SELECT idformapagamento FROM formadepagamento WHERE idformapagamento=$1', [formaIdNum]);
    if (fRes.rowCount === 0) {
      await client.query('ROLLBACK');
      logError(`Forma não encontrada: ${formaIdNum}`);
      return res.status(404).json({ success:false, message: 'Forma de pagamento não encontrada' });
    }
    
    log(`[TX] ✓ Forma encontrada`);

    // Inserir pagamento
    log(`[TX] Inserindo pagamento...`);
    const insert = 'INSERT INTO pagamento (pedidoidpedido, datapagamento, valortotalpagamento, forma_pagamento_id) VALUES ($1, NOW(), $2, $3) RETURNING *';
    const insRes = await client.query(insert, [pedidoIdNum, valorNum, formaIdNum]);
    
    await client.query('COMMIT');
    
    log(`✓ Pagamento criado com sucesso!`);
    return res.status(201).json({ success:true, message: 'Pagamento registrado com sucesso', pagamento: insRes.rows[0], data: insRes.rows[0] });
  } catch (err) {
    try {
      await client.query('ROLLBACK');
      log('[TX] Rollback executado');
    } catch (rollbackErr) {
      logError(`Erro ao fazer rollback: ${rollbackErr.message}`);
    }
    
    logError(`Erro ao criar pagamento: ${err.message}`);
    return res.status(500).json({ success:false, message: 'Erro ao criar pagamento', error: err.message });
  } finally {
    client.release();
  }
});

module.exports = router;
