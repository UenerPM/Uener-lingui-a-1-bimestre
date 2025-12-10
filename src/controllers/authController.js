const authService = require('../services/authService');

function jsonError(res, message = 'Erro', statusCode = 400) {
  return res.status(statusCode).json({ success: false, message });
}

function jsonSuccess(res, data = {}, message = 'OK', statusCode = 200) {
  return res.status(statusCode).json({ success: true, message, ...data });
}

const AuthController = {
  /**
   * POST /api/login
   * Autentica usuário usando tabela pessoa (email + senha_pessoa)
   */
  async login(req, res) {
    try {
      const { email, senha } = req.body || {};

      if (!email || email.trim() === '') {
        return jsonError(res, 'Email é obrigatório', 400);
      }

      if (!senha || senha === '') {
        return jsonError(res, 'Senha é obrigatória', 400);
      }

      const user = await authService.login(email.trim(), senha);

      if (!user) {
        return jsonError(res, 'Email ou senha inválidos', 401);
      }

      req.session.user = {
        cpfpessoa: user.cpf,
        nomepessoa: user.nome,
        email: user.email,
        isAdmin: user.isAdmin
      };

      return jsonSuccess(
        res,
        { user: req.session.user },
        'Login realizado com sucesso',
        200
      );
    } catch (err) {
      console.error('❌ Erro ao fazer login:', err.message);
      return jsonError(res, err.message || 'Erro ao fazer login', 500);
    }
  },

  /**
   * POST /api/logout
   * Logout do usuário
   */
  async logout(req, res) {
    try {
      req.session.destroy(() => {});
      return jsonSuccess(res, {}, 'Logout realizado', 200);
    } catch (err) {
      console.error('❌ Erro ao fazer logout:', err.message);
      return jsonError(res, err.message || 'Erro ao fazer logout', 500);
    }
  },

  /**
   * GET /api/me
   * Retorna dados do usuário logado
   */
  async getCurrentUser(req, res) {
    try {
      if (!req.session || !req.session.user) {
        return jsonError(res, 'Usuário não autenticado', 401);
      }

      return jsonSuccess(res, { user: req.session.user }, 'Usuário encontrado', 200);
    } catch (err) {
      console.error('❌ Erro ao buscar usuário:', err.message);
      return jsonError(res, err.message || 'Erro ao buscar usuário', 500);
    }
  }
};

module.exports = AuthController;
