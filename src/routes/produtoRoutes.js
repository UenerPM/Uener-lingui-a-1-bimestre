const express = require('express');
const router = express.Router();
const produtoCtrl = require('../controllers/produtoController');
const { requireAdmin } = require('../middleware/auth');

/**
 * GET /api/produtos
 * Listar todos os produtos (público)
 */
router.get('/produtos', produtoCtrl.listar);

/**
 * GET /api/produtos/:id
 * Obter produto por ID (público)
 */
router.get('/produtos/:id', produtoCtrl.obter);

/**
 * POST /api/produtos
 * Criar novo produto (admin)
 */
router.post('/produtos', requireAdmin, produtoCtrl.criar);

/**
 * PUT /api/produtos/:id
 * Atualizar produto (admin)
 */
router.put('/produtos/:id', requireAdmin, produtoCtrl.atualizar);

/**
 * DELETE /api/produtos/:id
 * Deletar produto (admin)
 */
router.delete('/produtos/:id', requireAdmin, produtoCtrl.deletar);

module.exports = router;
