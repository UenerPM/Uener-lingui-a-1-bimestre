const express = require('express');
const router = express.Router();
const authCtrl = require('../controllers/authController');
const produtoCtrl = require('../controllers/produtoController');
const pedidoCtrl = require('../controllers/pedidoController');
const pagamentoCtrl = require('../controllers/pagamentoController');
const imagemCtrl = require('../controllers/imagemController');
const linguicasPublicCtrl = require('../controllers/linguicasPublicController');
const { requireLogin } = require('../middleware/auth');

// Endpoint simples para expor configuração PIX ao frontend
router.get('/pix-config', (req, res) => {
	const config = {
		pixKey: process.env.PIX_KEY || 'uperesmarcon@gmail.com',
		merchantName: process.env.PIX_MERCHANT_NAME || 'UENER LINGUÇO',
		merchantCity: process.env.PIX_MERCHANT_CITY || 'CAMPO MOURAO'
	};
	return res.json({ success: true, config });
});

// ===== ROTAS PÚBLICAS =====

/**
 * POST /api/login
 * Login do usuário (email + senha)
 */
router.post('/login', authCtrl.login);

/**
 * POST /api/logout
 * Logout do usuário
 */
router.post('/logout', authCtrl.logout);

/**
 * GET /api/me
 * Retorna dados do usuário logado
 */
router.get('/me', authCtrl.getCurrentUser);

/**
 * GET /api/imagem/:idProduto
 * Serve imagem do produto com fallback
 * Busca: local → CRUD → no-image.png
 * 
 * Exemplo: GET /api/imagem/1
 */
router.get('/imagem/:idProduto', imagemCtrl.servirImagemProduto);

/**
 * GET /api/linguicas
 * Retorna linguiças com URLs de imagem
 * 
 * Resposta:
 * {
 *   success: true,
 *   message: "linguiças listadas",
 *   data: [
 *     { id: 1, nome: "Calabresa", preco: "15.90", imagem: "/api/imagem/1" },
 *     ...
 *   ]
 * }
 */
router.get('/linguicas', linguicasPublicCtrl.listar);

/**
 * GET /api/linguicas/:id
 * Obter linguiça específica
 */
router.get('/linguicas/:id', linguicasPublicCtrl.obter);

/**
 * GET /api/produtos
 * Lista todos os produtos com imagens
 */
router.get('/produtos', produtoCtrl.getAllProdutos);

/**
 * GET /api/produtos/:id
 * Busca um produto específico
 */
router.get('/produtos/:id', produtoCtrl.getProdutoById);

/**
 * GET /api/formas-pagamento
 * Lista formas de pagamento
 */
router.get('/formas-pagamento', pagamentoCtrl.getFormasPagamento);

// ===== ROTAS PROTEGIDAS (Requer login) =====

/**
 * POST /api/pedidos
 * Cria um novo pedido
 */
router.post('/pedidos', requireLogin, pedidoCtrl.createPedido);

/**
 * GET /api/pedidos
 * Lista pedidos do usuário logado
 */
router.get('/pedidos', requireLogin, pedidoCtrl.getPedidosUsuario);

/**
 * GET /api/pedidos/:id
 * Busca um pedido específico
 */
router.get('/pedidos/:id', requireLogin, pedidoCtrl.getPedidoById);

/**
 * POST /api/pagamentos
 * Registra um pagamento
 */
router.post('/pagamentos', requireLogin, pagamentoCtrl.createPagamento);

/**
 * GET /api/pagamentos/:idpagamento
 * Busca um pagamento específico
 */
router.get('/pagamentos/:idpagamento', requireLogin, pagamentoCtrl.getPagamentoById);

module.exports = router;
