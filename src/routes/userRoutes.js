const express = require('express');
const router = express.Router();
const userCtrl = require('../controllers/userController');
const { requireLogin, requireAdmin } = require('../middleware/auth');

// ===== ROTAS PÚBLICAS =====

/**
 * POST /api/register
 * Registra um novo usuário
 */
router.post('/register', userCtrl.register);

/**
 * POST /api/login
 * Autentica um usuário
 */
router.post('/login', userCtrl.login);

/**
 * GET /api/logout
 * Faz logout do usuário
 */
router.post('/logout', userCtrl.logout);

// ===== ROTAS PROTEGIDAS (Requer login) =====

/**
 * GET /api/users
 * Lista todos os usuários (admin only)
 */
router.get('/users', requireAdmin, userCtrl.listUsers);

/**
 * POST /api/users
 * Cria novo usuário (admin only)
 */
router.post('/users', requireAdmin, userCtrl.addUser);

/**
 * DELETE /api/users/:username
 * Remove usuário (admin only)
 */
router.delete('/users/:username', requireAdmin, userCtrl.removeUser);

/**
 * PATCH /api/users/:username/bloquear
 * Toggle bloquear/desbloquear usuário
 */
router.put('/users/:username/bloqueio', requireAdmin, userCtrl.toggleBloqueio);

/**
 * PUT /api/users/:username/promover
 * Promove usuário a admin
 */
router.put('/users/:username/promover', requireAdmin, userCtrl.promover);

/**
 * PUT /api/users/:username/despromover
 * Remove permissão de admin
 */
router.put('/users/:username/despromover', requireAdmin, userCtrl.despromover);

module.exports = router;
