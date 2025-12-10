/**
 * USER CONTROLLER
 * Implementa registro, login, gerenciamento de usuários e sessão
 */

const userRepo = require('../repositories/userRepository');

function jsonSuccess(res, data = {}, message = 'OK', statusCode = 200) {
  return res.status(statusCode).json({ success: true, message, ...data });
}

function jsonError(res, message = 'Erro', statusCode = 400) {
  return res.status(statusCode).json({ success: false, message });
}

const UserController = {
  // POST /api/register
  async register(req, res) {
    try {
      const { username, password } = req.body || {};
      if (!username || !password) return jsonError(res, 'username e password são obrigatórios', 400);

      // Criar usuário padrão (não admin)
      const created = await userRepo.createUser(username, password, false);
      return jsonSuccess(res, { data: created }, 'usuário registrado', 201);
    } catch (err) {
      console.error('❌ Erro ao registrar usuário:', err.message);
      return jsonError(res, err.message || 'Erro ao registrar usuário', 500);
    }
  },

  // POST /api/login
  async login(req, res) {
    try {
      const { username, password } = req.body || {};
      if (!username || !password) return jsonError(res, 'username e password são obrigatórios', 400);

      const user = await userRepo.validateCredentials(username, password);
      if (!user) return jsonError(res, 'Credenciais inválidas ou usuário bloqueado', 401);

      // Normalizar nome da flag para sessão
      req.session.user = {
        username: user.username,
        isAdmin: !!user.is_admin
      };

      return jsonSuccess(res, { data: { username: user.username, isAdmin: !!user.is_admin } }, 'login realizado');
    } catch (err) {
      console.error('❌ Erro ao efetuar login:', err.message);
      return jsonError(res, 'Erro ao efetuar login', 500);
    }
  },

  // POST /api/logout
  async logout(req, res) {
    try {
      if (req.session) {
        req.session.destroy(err => {
          if (err) {
            console.error('❌ Erro ao destruir sessão:', err.message);
            return jsonError(res, 'Erro ao encerrar sessão', 500);
          }
          return jsonSuccess(res, {}, 'logout realizado');
        });
        return;
      }
      return jsonSuccess(res, {}, 'logout realizado');
    } catch (err) {
      console.error('❌ Erro no logout:', err.message);
      return jsonError(res, 'Erro ao encerrar sessão', 500);
    }
  },

  // GET /api/users (admin)
  async listUsers(req, res) {
    try {
      const users = await userRepo.getAllUsers();
      return jsonSuccess(res, { data: users }, 'usuários listados');
    } catch (err) {
      console.error('❌ Erro ao listar usuários:', err.message);
      return jsonError(res, 'Erro ao listar usuários', 500);
    }
  },

  // POST /api/users (admin)
  async addUser(req, res) {
    try {
      const { username, password, isAdmin } = req.body || {};
      if (!username || !password) return jsonError(res, 'username e password são obrigatórios', 400);
      const created = await userRepo.createUser(username, password, !!isAdmin);
      return jsonSuccess(res, { data: created }, 'usuário criado', 201);
    } catch (err) {
      console.error('❌ Erro ao criar usuário:', err.message);
      return jsonError(res, 'Erro ao criar usuário', 500);
    }
  },

  // DELETE /api/users/:username (admin)
  async removeUser(req, res) {
    try {
      const { username } = req.params;
      if (!username) return jsonError(res, 'username é obrigatório', 400);
      await userRepo.deleteUser(username);
      return jsonSuccess(res, {}, 'usuário removido');
    } catch (err) {
      console.error('❌ Erro ao remover usuário:', err.message);
      return jsonError(res, 'Erro ao remover usuário', 500);
    }
  },

  // PUT /api/users/:username/bloqueio (admin)
  async toggleBloqueio(req, res) {
    try {
      const { username } = req.params;
      if (!username) return jsonError(res, 'username é obrigatório', 400);
      const result = await userRepo.toggleBloqueio(username);
      if (!result) return jsonError(res, 'Usuário não encontrado', 404);
      return jsonSuccess(res, { data: result }, 'bloqueio alterado');
    } catch (err) {
      console.error('❌ Erro ao alternar bloqueio:', err.message);
      return jsonError(res, 'Erro ao alternar bloqueio', 500);
    }
  },

  // PUT /api/users/:username/promover (admin)
  async promover(req, res) {
    try {
      const { username } = req.params;
      if (!username) return jsonError(res, 'username é obrigatório', 400);
      const result = await userRepo.setAdmin(username, true);
      if (!result) return jsonError(res, 'Usuário não encontrado', 404);
      return jsonSuccess(res, { data: result }, 'usuário promovido a admin');
    } catch (err) {
      console.error('❌ Erro ao promover usuário:', err.message);
      return jsonError(res, 'Erro ao promover usuário', 500);
    }
  },

  // PUT /api/users/:username/despromover (admin)
  async despromover(req, res) {
    try {
      const { username } = req.params;
      if (!username) return jsonError(res, 'username é obrigatório', 400);
      const result = await userRepo.setAdmin(username, false);
      if (!result) return jsonError(res, 'Usuário não encontrado', 404);
      return jsonSuccess(res, { data: result }, 'usuário removido de admin');
    } catch (err) {
      console.error('❌ Erro ao despromover usuário:', err.message);
      return jsonError(res, 'Erro ao despromover usuário', 500);
    }
  }
};

module.exports = UserController;
