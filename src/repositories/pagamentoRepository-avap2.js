/**
 * ========================================
 * PAGAMENTO REPOSITORY - VERSÃO 2025
 * Validação de dados antes de INSERT
 * ========================================
 * 
 * Responsabilidades:
 * - Executar queries SQL seguras
 * - Verificar Foreign Keys antes de insert
 * - Tratar erros PostgreSQL específicos
 * - Logs para auditoria
 */

const pool = require('../config/db');

function log(msg) {
  console.log(`[pagamento-repo] ${msg}`);
}

function logError(msg) {
  console.error(`[pagamento-repo] ❌ ${msg}`);
}

// ===== QUERIES AUXILIARES DE VERIFICAÇÃO =====

/**
 * Verifica se um pedido existe
 */
async function verificarPedido(pedidoId) {
  try {
    log(`Verificando pedido ${pedidoId}...`);
    // No schema AVAP2 a tabela se chama `pedido` e os valores do total estão em `pedidohasproduto`.
    const query = `
      SELECT p.idpedido AS idpedido,
             p.clientepessoacpfpessoa AS user_id,
             COALESCE(SUM(ph.precounitario * ph.quantidade), 0)::numeric AS total
      FROM pedido p
      LEFT JOIN pedidohasproduto ph ON ph.pedidoidpedido = p.idpedido
      WHERE p.idpedido = $1
      GROUP BY p.idpedido, p.clientepessoacpfpessoa
      LIMIT 1
    `;

    const result = await pool.query(query, [pedidoId]);
    
    if (result.rows.length === 0) {
      logError(`Pedido não encontrado: ${pedidoId}`);
      return null;
    }
    
    const row = result.rows[0];
    const pedido = {
      idpedido: row.idpedido,
      user_id: row.user_id,
      total: parseFloat(row.total) || 0
    };
    log(`✓ Pedido encontrado: ID ${pedido.idpedido}`);

    return pedido;
  } catch (err) {
    logError(`Erro ao verificar pedido: ${err.message}`);
    throw err;
  }
}

/**
 * Verifica se uma forma de pagamento existe e está ativa
 */
async function verificarFormaPagamento(formaId) {
  try {
    log(`Verificando forma de pagamento ${formaId}...`);
    
    const query = `
      SELECT idformapagamento, nomeformapagamento
      FROM formadepagamento
      WHERE idformapagamento = $1
      LIMIT 1
    `;
    const result = await pool.query(query, [formaId]);
    if (result.rows.length === 0) {
      logError(`Forma não encontrada: ${formaId}`);
      return null;
    }
    const row = result.rows[0];
    // Normalizar nomes de propriedade para o controller: { nome, id, ativo }
    const forma = {
      id: row.idformapagamento,
      nome: row.nomeformapagamento,
      // A tabela atual não possui coluna 'ativo' no schema avap2; assumir ativa por padrão
      ativo: row.ativo !== undefined ? row.ativo : true
    };
    log(`✓ Forma encontrada: ${forma.nome}`);
    return forma;
  } catch (err) {
    logError(`Erro ao verificar forma: ${err.message}`);
    throw err;
  }
}

/**
 * Verifica se um pedido pertence a um usuário (ownership)
 */
async function verificarBelongsToPedido(pedidoId, userId) {
  try {
    log(`Verificando ownership: pedido ${pedidoId} → usuário ${userId}`);
    const query = `
      SELECT p.idpedido, p.clientepessoacpfpessoa
      FROM pedido p
      WHERE p.idpedido = $1 AND p.clientepessoacpfpessoa = $2
      LIMIT 1
    `;

    const result = await pool.query(query, [pedidoId, userId]);
    
    const belongs = result.rows.length > 0;
    log(belongs ? `✓ Pedido pertence ao usuário` : `✗ Pedido NÃO pertence ao usuário`);
    
    return belongs;
  } catch (err) {
    logError(`Erro ao verificar ownership: ${err.message}`);
    throw err;
  }
}

// ===== MAIN FUNCTIONS =====

/**
 * Cria um novo pagamento
 * Precondições: pedido e forma já foram validados
 */
async function createPagamento(pedidoId, formaPagamentoId, valor) {
  let client;
  
  try {
    // Usar transaction para garantir integridade
    client = await pool.connect();
    await client.query('BEGIN');
    
    log(`Iniciando transação para pagamento...`);

    // ===== VERIFICAÇÃO FINAL ANTES DE INSERT =====
    log(`[TX] Verificando pedido ${pedidoId}...`);
    const pedidoRes = await client.query(
      `SELECT idpedido FROM pedido WHERE idpedido = $1`,
      [pedidoId]
    );
    
    if (pedidoRes.rows.length === 0) {
      await client.query('ROLLBACK');
      logError(`[TX] Pedido não encontrado: ${pedidoId}`);
      throw new Error(`Pedido não encontrado: ${pedidoId}`);
    }

    log(`[TX] Verificando forma ${formaPagamentoId}...`);
    const formaRes = await client.query(
      `SELECT idformapagamento FROM formadepagamento WHERE idformapagamento = $1`,
      [formaPagamentoId]
    );
    if (formaRes.rows.length === 0) {
      await client.query('ROLLBACK');
      logError(`[TX] Forma não encontrada: ${formaPagamentoId}`);
      throw new Error(`Forma de pagamento não encontrada: ${formaPagamentoId}`);
    }

    // ===== INSERT PAGAMENTO =====
    log(`[TX] Inserindo pagamento...`);
    // Usar a tabela `pagamento` do schema avap2
    const insertQuery = `
      INSERT INTO pagamento (pedidoidpedido, valortotalpagamento, forma_pagamento_id, datapagamento)
      VALUES ($1, $2, $3, NOW())
      RETURNING pedidoidpedido, valortotalpagamento, forma_pagamento_id, datapagamento
    `;

    const insertResult = await client.query(insertQuery, [
      pedidoId,
      valor,
      formaPagamentoId
    ]);

    const row = insertResult.rows[0];
    // Normalizar objeto retornado para manter compatibilidade com o controller
    const pagamento = {
      id: row.pedidoidpedido, // não há id separado no schema atual; usar pedidoid como identificador lógico
      pedido_id: row.pedidoidpedido,
      forma_pagamento_id: row.forma_pagamento_id,
      valor: parseFloat(row.valortotalpagamento) || parseFloat(valor),
      status: 'pendente',
      created_at: row.datapagamento || new Date()
    };

    log(`[TX] Pagamento inserido (pedidoid): ${pagamento.pedido_id}`);

    // ===== COMMIT =====
    await client.query('COMMIT');
    
    log(`✓ Transação concluída com sucesso`);
    
    return pagamento;

  } catch (err) {
    if (client) {
      try {
        await client.query('ROLLBACK');
        log(`[TX] Rollback executado`);
      } catch (rollbackErr) {
        logError(`Erro ao fazer rollback: ${rollbackErr.message}`);
      }
    }
    
    // Tratamento específico de erros PostgreSQL
    if (err.code === '23503') {
      // Foreign key violation
      logError(`Violação de FK: ${err.message}`);
      throw new Error('Dados de referência não encontrados');
    } else if (err.code === '23505') {
      // Unique violation
      logError(`Violação de UNIQUE: ${err.message}`);
      throw new Error('Registro duplicado');
    } else {
      logError(`Erro ao criar pagamento: ${err.message}`);
      throw err;
    }
  } finally {
    if (client) {
      client.release();
    }
  }
}

/**
 * Busca um pagamento específico
 */
async function getPagamentoById(idPagamento) {
  try {
    log(`Buscando pagamento ${idPagamento}...`);
    
    const query = `
      SELECT 
        p.pedidoidpedido,
        p.datapagamento,
        p.valortotalpagamento,
        p.forma_pagamento_id,
        fp.nomeformapagamento
      FROM pagamento p
      LEFT JOIN formadepagamento fp ON p.forma_pagamento_id = fp.idformapagamento
      WHERE p.pedidoidpedido = $1
      LIMIT 1
    `;
    const result = await pool.query(query, [idPagamento]);
    if (result.rows.length === 0) {
      logError(`Pagamento não encontrado: ${idPagamento}`);
      return null;
    }
    const pagamento = result.rows[0];
    log(`✓ Pagamento encontrado: ${pagamento.pedidoidpedido}`);
    return pagamento;
  } catch (err) {
    logError(`Erro ao buscar pagamento: ${err.message}`);
    throw err;
  }
}

/**
 * Lista todos os pagamentos de um pedido
 */
async function getPagamentosPorPedido(pedidoId) {
  try {
    log(`Listando pagamentos do pedido ${pedidoId}...`);
    
    const query = `
      SELECT 
        p.pedidoidpedido,
        p.datapagamento,
        p.valortotalpagamento,
        p.forma_pagamento_id,
        fp.nomeformapagamento
      FROM pagamento p
      LEFT JOIN formadepagamento fp ON p.forma_pagamento_id = fp.idformapagamento
      WHERE p.pedidoidpedido = $1
      ORDER BY p.datapagamento DESC
    `;
    const result = await pool.query(query, [pedidoId]);
    log(`✓ ${result.rows.length} pagamento(s) encontrado(s)`);
    return result.rows;
  } catch (err) {
    logError(`Erro ao listar pagamentos: ${err.message}`);
    throw err;
  }
}

/**
 * Lista todas as formas de pagamento ativas
 */
async function getAllFormasPagamento() {
  try {
    log(`Listando formas de pagamento...`);
    
    const query = `
      SELECT idformapagamento, nomeformapagamento
      FROM formadepagamento
      ORDER BY nomeformapagamento ASC
    `;
    const result = await pool.query(query);
    log(`✓ ${result.rows.length} forma(s) encontrada(s)`);
    return result.rows;
  } catch (err) {
    logError(`Erro ao listar formas: ${err.message}`);
    throw err;
  }
}

/**
 * Atualiza status de um pagamento
 * Uso interno apenas (admin)
 */
async function atualizarStatusPagamento(idPagamento, novoStatus) {
  try {
    log(`Atualizando status do pagamento ${idPagamento} → ${novoStatus}...`);
    
    const statusValidos = ['pendente', 'aprovado', 'rejeitado', 'cancelado'];
    if (!statusValidos.includes(novoStatus)) {
      throw new Error(`Status inválido: ${novoStatus}`);
    }
    
    const query = `
      UPDATE pagamentos
      SET status = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING id, status, updated_at
    `;
    
    const result = await pool.query(query, [novoStatus, idPagamento]);
    
    if (result.rows.length === 0) {
      logError(`Pagamento não encontrado: ${idPagamento}`);
      return null;
    }
    
    log(`✓ Status atualizado: ${result.rows[0].status}`);
    
    return result.rows[0];
  } catch (err) {
    logError(`Erro ao atualizar status: ${err.message}`);
    throw err;
  }
}

module.exports = {
  createPagamento,
  getPagamentoById,
  getPagamentosPorPedido,
  getAllFormasPagamento,
  atualizarStatusPagamento,
  verificarPedido,
  verificarFormaPagamento,
  verificarBelongsToPedido
};
