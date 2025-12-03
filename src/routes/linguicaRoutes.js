const express = require('express');
const router = express.Router();
const linguicaCtrl = require('../controllers/linguicaController');
const { requireLogin, requireAdmin } = require('../middleware/auth');

/**
 * GET /api/linguicas
 * Listar todas as linguiças (público)
 */
router.get('/', linguicaCtrl.listar);

/**
 * GET /api/linguicas/:id
 * Obter linguiça por ID (público)
 */
router.get('/:id', linguicaCtrl.obter);

/**
 * POST /api/linguicas
 * Criar nova linguiça (admin)
 */
router.post('/', requireAdmin, linguicaCtrl.criar);

/**
 * PUT /api/linguicas/:id
 * Atualizar linguiça (admin)
 */
router.put('/:id', requireAdmin, linguicaCtrl.atualizar);

/**
 * DELETE /api/linguicas/:id
 * Deletar linguiça (admin)
 */
router.delete('/:id', requireAdmin, linguicaCtrl.deletar);

module.exports = router;
