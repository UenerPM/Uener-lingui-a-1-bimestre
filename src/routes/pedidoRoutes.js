const express = require('express');
const router = express.Router();
const pedidoCtrl = require('../controllers/pedidoController');
const { requireLogin, requireAdmin } = require('../middleware/auth');

/**
 * GET /api/pedidos
 * Listar pedidos do usuário logado
 */
router.get('/pedidos', requireLogin, pedidoCtrl.listar);

/**
 * GET /api/pedidos/:id
 * Obter detalhes de um pedido
 */
router.get('/pedidos/:id', requireLogin, pedidoCtrl.obter);

/**
 * POST /api/pedidos
 * Criar novo pedido
 */
router.post('/pedidos', requireLogin, pedidoCtrl.criar);

/**
 * PUT /api/pedidos/:id
 * Atualizar status de pedido
 */
router.put('/pedidos/:id', requireLogin, pedidoCtrl.atualizar);

/**
 * GET /api/pedidos-admin
 * Listar todos os pedidos (admin)
 */
router.get('/pedidos-admin', requireAdmin, pedidoCtrl.listarTodos);

/**
 * DELETE /api/pedidos/:id
 * Deletar pedido (admin)
 */
router.delete('/pedidos/:id', requireAdmin, pedidoCtrl.deletar);

module.exports = router;
