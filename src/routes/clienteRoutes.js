const express = require('express');
const router = express.Router();
const clienteCtrl = require('../controllers/clienteController');
const { requireLogin, requireAdmin } = require('../middleware/auth');

// Usuário logado pode ver/editar seu perfil
router.get('/clientes/meu-perfil', requireLogin, clienteCtrl.meuPerfil);
router.put('/clientes/meu-perfil', requireLogin, clienteCtrl.atualizarMeu);

// Admin
router.get('/clientes', requireAdmin, clienteCtrl.listar);
router.get('/clientes/:id', requireAdmin, clienteCtrl.obter);
router.post('/clientes', requireAdmin, clienteCtrl.criar);
router.put('/clientes/:id', requireAdmin, clienteCtrl.atualizar);
router.delete('/clientes/:id', requireAdmin, clienteCtrl.deletar);

module.exports = router;
