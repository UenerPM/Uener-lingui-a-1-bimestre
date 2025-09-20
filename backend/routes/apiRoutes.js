const express = require('express');
const router = express.Router();
const apiController = require('../controllers/apiController');
const authController = require('../controllers/authController');

// Compatibilidade: rota de sessão usada por frontend antigo
router.get('/session', authController.session);

// Rota pública para listar linguicas (frontend usa /api/linguicas)
router.get('/linguicas', apiController.listLinguicas);

// Example CRUDs required by the assignment
// 1) CRUD sem dependências: categorias
router.get('/categorias', apiController.listCategorias);
router.post('/categorias', apiController.createCategoria);
router.put('/categorias/:id', apiController.updateCategoria);
router.delete('/categorias/:id', apiController.deleteCategoria);

// 2) CRUD 1:n: produtos -> categoriaId
router.get('/produtos', apiController.listProdutos);
router.post('/produtos', apiController.createProduto);
router.put('/produtos/:id', apiController.updateProduto);
router.delete('/produtos/:id', apiController.deleteProduto);

// 3) CRUD n:m: produto <-> atributo (produtoAtributos)
router.get('/atributos', apiController.listAtributos);
router.post('/atributos', apiController.createAtributo);
router.put('/atributos/:id', apiController.updateAtributo);
router.delete('/atributos/:id', apiController.deleteAtributo);
router.post('/produto-atributo', apiController.addProdutoAtributo);
router.delete('/produto-atributo', apiController.removeProdutoAtributo);

// 4) CRUD 1:1: pedido -> pagamento (cada pedido tem 1 pagamento)
router.get('/pedidos', apiController.listPedidos);
router.post('/pedidos', apiController.createPedido);
router.put('/pedidos/:id', apiController.updatePedido);
router.delete('/pedidos/:id', apiController.deletePedido);
router.get('/pagamentos', apiController.listPagamentos);
router.post('/pagamentos', apiController.createPagamento);
router.put('/pagamentos/:id', apiController.updatePagamento);
router.delete('/pagamentos/:id', apiController.deletePagamento);

module.exports = router;
