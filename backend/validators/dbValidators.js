const { body, param } = require('express-validator');

const cpf = (field='cpf') => body(field).isLength({ min: 11 }).withMessage('CPF inválido (mínimo 11 caracteres)');
const requiredName = (field='nome') => body(field).isLength({ min: 1 }).withMessage('Nome obrigatório');
const optionalName = (field='nome') => body(field).optional().isLength({ min: 1 }).withMessage('Nome inválido');
const positiveFloat = (field) => body(field).isFloat({ gt: 0 }).withMessage(`${field} deve ser número maior que 0`);
const optionalFloat = (field) => body(field).optional().isFloat({ gt: 0 }).withMessage(`${field} deve ser número maior que 0`);
const intId = (field='id') => body(field).isInt().withMessage(`${field} deve ser inteiro`);
const optionalInt = (field='id') => body(field).optional().isInt().withMessage(`${field} deve ser inteiro`);

module.exports = {
  cpf,
  requiredName,
  optionalName,
  positiveFloat,
  optionalFloat,
  intId,
  optionalInt
};
