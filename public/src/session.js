/**
 * Session Manager - Gerencia estado de autenticação
 */

class SessionManager {
  constructor() {
    this.user = null;
    this.isAuthenticated = false;
    this.loadFromStorage();
  }

  /**
   * Carregar sessão do localStorage
   */
  loadFromStorage() {
    try {
      const stored = localStorage.getItem('user');
      if (stored) {
        this.user = JSON.parse(stored);
        this.isAuthenticated = true;
      }
    } catch (error) {
      console.error('[Session] Erro ao carregar:', error);
    }
  }

  /**
   * Salvar sessão no localStorage
   */
  saveToStorage() {
    try {
      localStorage.setItem('user', JSON.stringify(this.user));
    } catch (error) {
      console.error('[Session] Erro ao salvar:', error);
    }
  }

  /**
   * Iniciar sessão
   */
  setUser(user) {
    this.user = user;
    this.isAuthenticated = true;
    this.saveToStorage();
  }

  /**
   * Encerrar sessão
   */
  clear() {
    this.user = null;
    this.isAuthenticated = false;
    localStorage.removeItem('user');
  }

  /**
   * Obter usuário atual
   */
  getUser() {
    return this.user;
  }

  /**
   * Verificar se usuário está autenticado
   */
  isLoggedIn() {
    return this.isAuthenticated && this.user != null;
  }

  /**
   * Verificar se usuário é admin
   */
  isAdmin() {
    return this.isLoggedIn() && (this.user.isAdmin || this.user.isadmin);
  }
}

// Instância global
const session = new SessionManager();

export { SessionManager, session };
