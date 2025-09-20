const express = require('express');
const router = express.Router();
const db = require('../controllers/dbController');
const { validationResult, body } = require('express-validator');
const validators = require('../validators/dbValidators');

function handleValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ erros: errors.array() });
  next();
}

// Pessoas
router.get('/pessoas', db.pessoas.list);
router.get('/pessoas/:cpf', db.pessoas.get);
router.post('/pessoas', [ validators.cpf('cpf'), validators.requiredName('nome') ], handleValidation, db.pessoas.create);
router.put('/pessoas/:cpf', [ validators.optionalName('nome') ], handleValidation, db.pessoas.update);
router.delete('/pessoas/:cpf', db.pessoas.remove);

// Funcionarios
router.get('/funcionarios', db.funcionarios.list);
router.get('/funcionarios/:cpf', db.funcionarios.get);
router.post('/funcionarios', [ validators.cpf('cpf') ], handleValidation, db.funcionarios.create);
router.put('/funcionarios/:cpf', [ body('salario').optional().isNumeric().withMessage('Salário inválido') ], handleValidation, db.funcionarios.update);
router.delete('/funcionarios/:cpf', db.funcionarios.remove);

// Produtos
router.get('/produtos', db.produtos.list);
router.get('/produtos/:id', db.produtos.get);
router.post('/produtos', [ validators.requiredName('nome_produto'), validators.positiveFloat('preco_unidade') ], handleValidation, db.produtos.create);
router.put('/produtos/:id', [ validators.optionalFloat('preco_unidade') ], handleValidation, db.produtos.update);
router.delete('/produtos/:id', db.produtos.remove);

// Clientes
router.get('/clientes', db.clientes.list);
router.get('/clientes/:id', db.clientes.get);
router.post('/clientes', [ validators.cpf('cpf') ], handleValidation, db.clientes.create);
router.put('/clientes/:id', [ validators.cpf('cpf') ], handleValidation, db.clientes.update);
router.delete('/clientes/:id', db.clientes.remove);

// Pagamentos (criacao exige id_pedido e valor_total)
router.get('/pagamentos', db.pagamentos.list);
router.get('/pagamentos/:id', db.pagamentos.get);
router.post('/pagamentos', [ validators.intId('id_pedido'), validators.positiveFloat('valor_total') ], handleValidation, db.pagamentos.create);
router.put('/pagamentos/:id', [ validators.optionalFloat('valor_total') ], handleValidation, db.pagamentos.update);
router.delete('/pagamentos/:id', db.pagamentos.remove);

// Rotas genéricas para recursos menos críticos
function makeResourceRoutes(name, controller){
  if (!controller) return;
  const paramName = (name === 'pessoas' || name === 'funcionarios') ? 'cpf' : 'id';
  if (typeof controller.list === 'function') router.get(`/${name}`, controller.list);
  if (typeof controller.get === 'function') router.get(`/${name}/:${paramName}`, controller.get);
  if (typeof controller.create === 'function') router.post(`/${name}`, controller.create);
  if (typeof controller.update === 'function') router.put(`/${name}/:${paramName}`, controller.update);
  if (typeof controller.remove === 'function') router.delete(`/${name}/:${paramName}`, controller.remove);
}

makeResourceRoutes('cargos', db.cargos);
makeResourceRoutes('pedidos', db.pedidos);
makeResourceRoutes('produto_pedido', db.produto_pedido);
makeResourceRoutes('forma_pagamento', db.forma_pagamento);
makeResourceRoutes('pagamento_forma_pagamento', db.pagamento_forma_pagamento);

module.exports = router;
