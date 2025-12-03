/**
 * USER CONTROLLER
 * Lógica de autenticação e gerenciamento de usuários
 */

const userRepo = require('../repositories/userRepository');
const authRepo = require('../repositories/authRepository');

function jsonError(res, message = 'Erro', statusCode = 400) {
  return res.status(statusCode).json({ success: false, message });
}

function jsonSuccess(res, data = {}, message = 'OK', statusCode = 200, redirect = null) {
  const payload = { success: true, message, ...data };
  if (redirect) payload.redirect = redirect;
  return res.status(statusCode).json(payload);
}

const UserController = {
  /**
   * POST /api/login
   * Fazer login de usuário
   */
  async login(req, res) {
    try {
      const { username, password } = req.body || {};

      if (!username || username.trim() === '') {
        return jsonError(res, 'Usuário é obrigatório', 400);
      }

      if (!password || password === '') {
        return jsonError(res, 'Senha é obrigatória', 400);
      }

      // use flexible auth repository which can detect the correct table/columns
      const user = await authRepo.validateCredentials(username.trim(), password);

      if (!user) {
        return jsonError(res, 'Credenciais inválidas ou usuário não encontrado', 401);
      }

      req.session.user = { username: user.username, isAdmin: !!user.isAdmin, id: user.id };
      return jsonSuccess(
        res,
        { user: { username: user.username, isAdmin: !!user.isAdmin } },
        'Login realizado com sucesso',
        200,
        '/index.html'
      );
    } catch (err) {
      console.error('❌ Erro ao fazer login:', err.message);
      return jsonError(res, err.message || 'Erro ao fazer login', 500);
    }
  },

  /**
   * POST /api/register
   * Registrar novo usuário
   */
  async register(req, res) {
    try {
      const { username, password } = req.body || {};

      if (!username || username.trim() === '') {
        return jsonError(res, 'Usuário é obrigatório', 400);
      }

      if (!password || password === '') {
        return jsonError(res, 'Senha é obrigatória', 400);
      }

      if (password.length < 3) {
        return jsonError(res, 'Senha deve ter pelo menos 3 caracteres', 400);
      }

      // Registration supported only if the project uses the legacy `users` table.
      // If the configured auth table is not `users`, respond with 501 Not Implemented.
      const authCfg = await authRepo.initialize();
      if (authCfg.table !== 'users') {
        return jsonError(res, 'Registro direto não suportado quando autenticação externa é usada', 501);
      }

      const exists = await userRepo.getUserByUsername(username.trim());
      if (exists) return jsonError(res, 'Usuário já existe', 409);

      const user = await userRepo.createUser(username.trim(), password, false);
      return jsonSuccess(res, { user: { username: user.username, isAdmin: user.is_admin } }, 'Usuário registrado com sucesso', 201);
    } catch (err) {
      console.error('❌ Erro ao registrar:', err.message);
      return jsonError(res, err.message || 'Erro ao registrar', 500);
    }
  },

  /**
   * POST /api/logout
   * Fazer logout
   */
  async logout(req, res) {
    try {
      req.session.destroy(() => {});
      return jsonSuccess(res, {}, 'Logout realizado', 200, '/login.html');
    } catch (err) {
      console.error('❌ Erro ao fazer logout:', err.message);
      return jsonError(res, err.message || 'Erro ao fazer logout', 500);
    }
  },

  /**
   * GET /api/users
   * Listar todos os usuários (admin)
   */
  async listUsers(req, res) {
    try {
      const users = await userRepo.getAllUsers();
      return jsonSuccess(res, { data: users }, 'Usuários listados');
    } catch (err) {
      console.error('❌ Erro ao listar usuários:', err.message);
      return jsonError(res, err.message || 'Erro ao listar usuários', 500);
    }
  },

  /**
   * POST /api/users
   * Criar novo usuário (admin)
   */
  async addUser(req, res) {
    try {
      const { username, password } = req.body;

      if (!username || username.trim() === '') {
        return jsonError(res, 'Usuário é obrigatório', 400);
      }

      if (!password || password === '') {
        return jsonError(res, 'Senha é obrigatória', 400);
      }

      if (password.length < 3) {
        return jsonError(res, 'Senha deve ter pelo menos 3 caracteres', 400);
      }

      const exists = await userRepo.getUserByUsername(username.trim());

      if (exists) {
        return jsonError(res, 'Usuário já existe', 409);
      }

      const user = await userRepo.createUser(username.trim(), password, false);

      return jsonSuccess(
        res,
        { user: { username: user.username, isAdmin: user.is_admin } },
        'Usuário criado com sucesso',
        201
      );
    } catch (err) {
      console.error('❌ Erro ao criar usuário:', err.message);
      return jsonError(res, err.message || 'Erro ao criar usuário', 500);
    }
  },

  /**
   * DELETE /api/users/:username
   * Deletar usuário (admin)
   */
  async removeUser(req, res) {
    try {
      const { username } = req.params;

      if (username === 'adm') {
        return jsonError(res, 'Não é possível remover o admin principal', 403);
      }

      await userRepo.deleteUser(username);
      return jsonSuccess(res, {}, 'Usuário removido com sucesso');
    } catch (err) {
      console.error('❌ Erro ao remover usuário:', err.message);
      return jsonError(res, err.message || 'Erro ao remover usuário', 500);
    }
  },

  /**
   * PUT /api/users/:username/bloqueio
   * Alternar bloqueio de usuário (admin)
   */
  async toggleBloqueio(req, res) {
    try {
      const { username } = req.params;

      if (username === 'adm') {
        return jsonError(res, 'Não é possível bloquear o admin principal', 403);
      }

      const row = await userRepo.toggleBloqueio(username);
      return jsonSuccess(
        res,
        { bloqueado: row.bloqueado },
        `Usuário ${row.bloqueado ? 'bloqueado' : 'desbloqueado'}`
      );
    } catch (err) {
      console.error('❌ Erro ao alternar bloqueio:', err.message);
      return jsonError(res, err.message || 'Erro ao alternar bloqueio', 500);
    }
  },

  /**
   * PUT /api/users/:username/promover
   * Promover usuário a admin (admin)
   */
  async promover(req, res) {
    try {
      const { username } = req.params;

      await userRepo.setAdmin(username, true);
      return jsonSuccess(res, {}, 'Usuário promovido a admin');
    } catch (err) {
      console.error('❌ Erro ao promover usuário:', err.message);
      return jsonError(res, err.message || 'Erro ao promover usuário', 500);
    }
  },

  /**
   * PUT /api/users/:username/despromover
   * Remover permissões de admin (admin)
   */
  async despromover(req, res) {
    try {
      const { username } = req.params;

      if (username === 'adm') {
        return jsonError(res, 'Não é possível remover permissões do admin principal', 403);
      }

      await userRepo.setAdmin(username, false);
      return jsonSuccess(res, {}, 'Permissões de admin removidas');
    } catch (err) {
      console.error('❌ Erro ao remover permissões de admin:', err.message);
      return jsonError(res, err.message || 'Erro ao remover permissões de admin', 500);
    }
  }
};

module.exports = UserController;
