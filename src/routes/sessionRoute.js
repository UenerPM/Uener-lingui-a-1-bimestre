const express = require('express');
const router = express.Router();

/**
 * GET /api/session
 * Retorna informações da sessão do usuário logado
 * 
 * Resposta:
 * - Logado: { success: true, user: { username, isAdmin } }
 * - Deslogado: { success: false, user: null }
 */
router.get('/session', (req, res) => {
  if (req.session && req.session.user) {
    return res.json({
      success: true,
      user: {
        username: req.session.user.username,
        isAdmin: req.session.user.isAdmin
      }
    });
  }
  
  return res.json({
    success: false,
    user: null
  });
});

module.exports = router;
