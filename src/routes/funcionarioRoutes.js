const express = require('express');
const router = express.Router();
const funcionarioCtrl = require('../controllers/funcionarioController');
const { requireAdmin } = require('../middleware/auth');

// Admin-only
router.get('/funcionarios', requireAdmin, funcionarioCtrl.listar);
router.get('/funcionarios/:id', requireAdmin, funcionarioCtrl.obter);
router.post('/funcionarios', requireAdmin, funcionarioCtrl.criar);
router.put('/funcionarios/:id', requireAdmin, funcionarioCtrl.atualizar);
router.delete('/funcionarios/:id', requireAdmin, funcionarioCtrl.deletar);

module.exports = router;
