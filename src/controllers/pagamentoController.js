/**
 * ========================================
 * PAGAMENTO CONTROLLER - VERSÃO 2025
 * Validação Completa e Robusta
 * ========================================
 * 
 * Responsabilidades:
 * - Validar autenticação de usuário
 * - Validar cada campo de entrada (pedido, forma, valor)
 * - Logs estruturados para auditoria
 * - Respostas JSON claras e específicas
 * - Integração com repository
 */

const pagamentoRepo = require('../repositories/pagamentoRepository-avap2');
const pedidoRepo = require('../repositories/pedidoRepository-avap2');
const pagamentoService = require('../services/pagamentoService');

// ===== HELPERS DE LOG E RESPOSTA =====

function log(msg) {
  console.log(`[pagamento] ${msg}`);
}

function logError(msg) {
  console.error(`[pagamento] ❌ ${msg}`);
}

function jsonError(res, message = 'Erro', statusCode = 400) {
  return res.status(statusCode).json({
    success: false,
    message
  });
}

function jsonSuccess(res, data = {}, message = 'OK', statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    message,
    ...data
  });
}

// ===== VALIDADORES =====

/**
 * Valida se um valor é um número inteiro positivo
 */
function isValidPositiveInteger(val) {
  const num = Number(val);
  return Number.isInteger(num) && num > 0;
}

/**
 * Valida se um valor é um número decimal positivo
 */
function isValidPositiveDecimal(val) {
  const num = parseFloat(val);
  return !Number.isNaN(num) && num > 0;
}

/**
 * Normaliza idPedido (aceita múltiplos aliases)
 */
function normalizePedidoId(body) {
  return body.idpedido ||
         body.pedidoId ||
         body.pedidoidpedido ||
         body.pedido ||
         body.pedido_id ||
         null;
}

/**
 * Normaliza idFormaPagamento (aceita múltiplos aliases)
 */
function normalizeFormaPagamentoId(body) {
  return body.idformadepagamento ||
         body.formaPagamentoId ||
         body.forma_pagamento_id ||
         body.formaId ||
         body.forma ||
         null;
}

/**
 * Normaliza valor (aceita múltiplos aliases)
 */
function normalizeValor(body) {
  const raw = body.valorpagamento ||
              body.valor ||
              body.valortotal ||
              body.total ||
              body.valortotalpagamento ||
              body.valorpor ||
              null;
  
  if (raw === null) return null;
  
  // Converter string com vírgula em ponto
  const str = String(raw).replace(',', '.');
  return parseFloat(str);
}

// ===== CONTROLLER PRINCIPAL =====

const PagamentoController = {
  /**
   * POST /api/pagamentos
   * Cria um novo pagamento
   * 
   * Body esperado (qualquer combinação):
   * {
   *   idpedido: 1,
   *   idformadepagamento: 2,
   *   valorpagamento: 50.00
   * }
   * 
   * Variações aceitas:
   * - pedidoId / pedidoidpedido / pedido / pedido_id
   * - formaPagamentoId / forma_pagamento_id / formaId / forma
   * - valor / valortotal / total / valortotalpagamento
   */
  async createPagamento(req, res) {
    try {
      log('➡️  POST /api/pagamentos iniciado');

      // ===== VALIDAÇÃO 1: AUTENTICAÇÃO =====
      if (!req.session || !req.session.user) {
        logError('Usuário não autenticado (sem session)');
        return jsonError(res, 'Usuário não autenticado', 401);
      }

      const userId = req.session.user.cpfpessoa || req.session.user.username || null;
      if (!userId) {
        logError('Session existe mas sem identificador de usuário');
        return jsonError(res, 'Sessão inválida', 401);
      }

      log(`✓ Usuário autenticado: ${userId}`);

      // ===== VALIDAÇÃO 2: BODY NÃO-VAZIO =====
      const body = req.body || {};
      if (Object.keys(body).length === 0) {
        logError('Body vazio ou inválido');
        return jsonError(res, 'Body vazio', 400);
      }

      log(`Body recebido: ${JSON.stringify(body)}`);

      // ===== VALIDAÇÃO 3: EXTRAIR E NORMALIZAR CAMPOS =====
      const idPedidoRaw = normalizePedidoId(body);
      const idFormaPagamentoRaw = normalizeFormaPagamentoId(body);
      const valorRaw = normalizeValor(body);

      log(`Campos normalizados: pedido=${idPedidoRaw}, forma=${idFormaPagamentoRaw}, valor=${valorRaw}`);

      // ===== VALIDAÇÃO 4: ID PEDIDO =====
      if (idPedidoRaw === null || idPedidoRaw === undefined || idPedidoRaw === '') {
        logError('idPedido ausente ou vazio');
        return jsonError(res, 'ID do pedido é obrigatório', 400);
      }

      const idPedido = Number(idPedidoRaw);
      if (!isValidPositiveInteger(idPedido)) {
        logError(`idPedido inválido: ${idPedidoRaw} não é inteiro positivo`);
        return jsonError(res, 'ID do pedido deve ser um número inteiro positivo', 400);
      }

      log(`✓ idPedido validado: ${idPedido}`);

      // ===== VALIDAÇÃO 5: FORMA DE PAGAMENTO ID =====
      if (idFormaPagamentoRaw === null || idFormaPagamentoRaw === undefined || idFormaPagamentoRaw === '') {
        logError('idFormaPagamento ausente ou vazio');
        return jsonError(res, 'Forma de pagamento é obrigatória', 400);
      }

      const idFormaPagamento = Number(idFormaPagamentoRaw);
      if (!isValidPositiveInteger(idFormaPagamento)) {
        logError(`idFormaPagamento inválido: ${idFormaPagamentoRaw} não é inteiro positivo`);
        return jsonError(res, 'ID da forma de pagamento deve ser um número inteiro positivo', 400);
      }

      log(`✓ idFormaPagamento validado: ${idFormaPagamento}`);

      // ===== VALIDAÇÃO 6: VALOR =====
      if (valorRaw === null || valorRaw === undefined || valorRaw === '') {
        logError('Valor ausente ou vazio');
        return jsonError(res, 'Valor do pagamento é obrigatório', 400);
      }

      if (!isValidPositiveDecimal(valorRaw)) {
        logError(`Valor inválido: ${valorRaw} não é número positivo`);
        return jsonError(res, 'Valor deve ser um número positivo', 400);
      }

      const valor = Number(valorRaw);
      if (valor < 0.01) {
        logError(`Valor muito pequeno: ${valor}`);
        return jsonError(res, 'Valor deve ser maior que R$ 0,01', 400);
      }

      log(`✓ Valor validado: R$ ${valor.toFixed(2)}`);

      // ===== VALIDAÇÃO 7: VERIFICAR PEDIDO NO BD =====
      log(`Verificando pedido ${idPedido} no banco...`);
      
      let pedido;
      try {
        pedido = await pedidoRepo.getPedidoById(idPedido);
      } catch (err) {
        logError(`Erro ao buscar pedido: ${err.message}`);
        return jsonError(res, 'Erro ao validar pedido', 500);
      }

      if (!pedido) {
        logError(`Pedido não encontrado: ${idPedido}`);
        return jsonError(res, 'Pedido não encontrado', 404);
      }

      log(`✓ Pedido encontrado: ${pedido.numero_pedido || `ID ${idPedido}`}`);

      // ===== VALIDAÇÃO 8: VERIFICAR OWNERSHIP DO PEDIDO =====
      const pedidoOwner = pedido.clientepessoacpfpessoa;

      log(`Pedido ${idPedido} pertence a: '${pedidoOwner}' (length: ${String(pedidoOwner).length}); usuário atual: '${userId}' (length: ${String(userId).length})`);
      log(`Pedido owner type: ${typeof pedidoOwner}, userId type: ${typeof userId}`);
      log(`Pedido owner trimmed: '${String(pedidoOwner).trim()}'`);
      log(`UserId trimmed: '${String(userId).trim()}'`);
      log(`Comparação (===): ${String(pedidoOwner).trim() === String(userId).trim()}`);
      log(`IsAdmin: ${req.session.user.isAdmin}`);

      const pedidoBelongsToUser = String(pedidoOwner).trim() === String(userId).trim() || req.session.user.isAdmin;

      if (!pedidoBelongsToUser) {
        logError(`Acesso negado: pedido ${idPedido} pertence a '${pedidoOwner}', não a '${userId}'`);
        return jsonError(res, 'Acesso negado a este pedido', 403);
      }

      log(`✓ Pedido pertence ao usuário (ou admin)`);

      // ===== VALIDAÇÃO 9: VERIFICAR FORMA DE PAGAMENTO NO BD =====
      log(`Verificando forma de pagamento ${idFormaPagamento}...`);
      
      let formaPagamento;
      try {
        formaPagamento = await pagamentoService.verificarFormaPagamento(idFormaPagamento);
      } catch (err) {
        logError(`Erro ao verificar forma: ${err.message}`);
        return jsonError(res, 'Erro ao validar forma de pagamento', 500);
      }

      if (!formaPagamento) {
        logError(`Forma de pagamento não encontrada: ${idFormaPagamento}`);
        return jsonError(res, 'Forma de pagamento não encontrada', 404);
      }

      if (!formaPagamento.ativo) {
        logError(`Forma de pagamento inativa: ${formaPagamento.nome}`);
        return jsonError(res, 'Esta forma de pagamento não está disponível', 400);
      }

      log(`✓ Forma de pagamento validada: ${formaPagamento.nome}`);

      // ===== VALIDAÇÃO 10: COMPARAR VALOR COM TOTAL DO PEDIDO =====
      const totalPedido = parseFloat(pedido.total || 0);
      const tolerance = 0.01; // tolerância de 1 centavo

      if (Math.abs(valor - totalPedido) > tolerance) {
        logError(`Valor não confere: esperado ${totalPedido.toFixed(2)}, recebido ${valor.toFixed(2)}`);
        // NÃO rejeitar por isso, apenas alertar em produção
        log(`⚠️  Aviso: valor pode estar errado (tolerância: R$ ${tolerance.toFixed(2)})`);
      }

      // ===== VALIDAÇÃO 11: CRIAR PAGAMENTO =====
      log(`Inserindo pagamento no banco...`);
      
      let pagamento;
      try {
        pagamento = await pagamentoService.createPagamento(
          idPedido,
          idFormaPagamento,
          valor
        );
      } catch (err) {
        logError(`Erro ao criar pagamento: ${err.message}`);
        return jsonError(res, 'Erro ao registrar pagamento', 500);
      }

      if (!pagamento) {
        logError('Pagamento criado mas sem retorno do banco');
        return jsonError(res, 'Erro ao confirmar pagamento', 500);
      }

      log(`✓ Pagamento criado com sucesso!`);
      log(`  ID: ${pagamento.id}`);
      log(`  Pedido: ${idPedido}`);
      log(`  Forma: ${idFormaPagamento}`);
      log(`  Valor: R$ ${valor.toFixed(2)}`);
      log(`  Status: ${pagamento.status}`);

      // ===== RESPOSTA DE SUCESSO =====
      return jsonSuccess(
        res,
        {
          idPagamento: pagamento.id,
          pedidoId: pagamento.pedido_id || pagamento.pedidoidpedido,
          formaPagamentoId: pagamento.forma_pagamento_id || pagamento.forma_pagamento_id,
          valor: parseFloat(pagamento.valor || pagamento.valortotalpagamento),
          status: pagamento.status || 'pendente',
          dataPagamento: pagamento.created_at || pagamento.datapagamento
        },
        'Pagamento registrado com sucesso',
        201
      );

    } catch (err) {
      logError(`Erro não tratado: ${err.message}`);
      logError(`Stack: ${err.stack}`);
      return jsonError(res, 'Erro ao processar pagamento', 500);
    }
  },

  /**
   * GET /api/formas-pagamento
   * Lista formas de pagamento disponíveis
   */
  async getFormasPagamento(req, res) {
    try {
      log('➡️  GET /api/formas-pagamento');

      const formas = await pagamentoRepo.getAllFormasPagamento();

      log(`✓ Formas retornadas: ${formas.length}`);

      return jsonSuccess(
        res,
        { data: formas, formas },
        'Formas de pagamento listadas',
        200
      );
    } catch (err) {
      logError(`Erro ao listar formas: ${err.message}`);
      return jsonError(res, 'Erro ao listar formas de pagamento', 500);
    }
  },

  /**
   * GET /api/pagamentos/:idpagamento
   * Busca um pagamento específico
   */
  async getPagamentoById(req, res) {
    try {
      const { idpagamento } = req.params;

      log(`➡️  GET /api/pagamentos/${idpagamento}`);

      if (!idpagamento) {
        logError('ID do pagamento ausente');
        return jsonError(res, 'ID do pagamento é obrigatório', 400);
      }

      const id = Number(idpagamento);
      if (!isValidPositiveInteger(id)) {
        logError(`ID inválido: ${idpagamento}`);
        return jsonError(res, 'ID deve ser um número inteiro positivo', 400);
      }

      const pagamento = await pagamentoRepo.getPagamentoById(id);

      if (!pagamento) {
        logError(`Pagamento não encontrado: ${id}`);
        return jsonError(res, 'Pagamento não encontrado', 404);
      }

      // Verificar ownership
      if (pagamento.user_id !== req.session.user.cpfpessoa &&
          pagamento.user_id !== req.session.user.username &&
          !req.session.user.isAdmin) {
        logError(`Acesso negado ao pagamento ${id}`);
        return jsonError(res, 'Acesso negado', 403);
      }

      log(`✓ Pagamento encontrado: ${id}`);

      return jsonSuccess(
        res,
        { data: pagamento },
        'Pagamento encontrado',
        200
      );
    } catch (err) {
      logError(`Erro ao buscar pagamento: ${err.message}`);
      return jsonError(res, 'Erro ao buscar pagamento', 500);
    }
  }
};

module.exports = PagamentoController;
