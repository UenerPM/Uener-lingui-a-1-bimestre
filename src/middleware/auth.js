/**
 * Middleware de autenticação
 * Funciona com o novo sistema baseado em sessão (avap2)
 */

function requireLogin(req, res, next) {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ success: false, error: 'Autenticação requerida' });
  }
  next();
}

function requireAdmin(req, res, next) {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ success: false, error: 'Autenticação requerida' });
  }
  if (!req.session.user.isAdmin) {
    return res.status(403).json({ success: false, error: 'Acesso negado - Admin requerido' });
  }
  next();
}

module.exports = { requireLogin, requireAdmin };
