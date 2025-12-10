/**
 * Validators - Funções de validação
 */

/**
 * Validar email
 */
function validateEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

/**
 * Validar CPF
 */
function validateCPF(cpf) {
  cpf = cpf.replace(/\D/g, '');
  if (cpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false;
  
  let sum = 0;
  let remainder;
  
  // Primeiro dígito verificador
  for (let i = 1; i <= 9; i++) {
    sum += parseInt(cpf.substring(i - 1, i)) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cpf.substring(9, 10))) return false;
  
  // Segundo dígito verificador
  sum = 0;
  for (let i = 1; i <= 10; i++) {
    sum += parseInt(cpf.substring(i - 1, i)) * (12 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cpf.substring(10, 11))) return false;
  
  return true;
}

/**
 * Validar telefone
 */
function validatePhone(phone) {
  const regex = /^(\d{10}|\d{11})$/;
  return regex.test(phone.replace(/\D/g, ''));
}

/**
 * Validar campo obrigatório
 */
function validateRequired(value) {
  return value && value.trim().length > 0;
}

/**
 * Validar comprimento mínimo
 */
function validateMinLength(value, minLength) {
  return value && value.length >= minLength;
}

/**
 * Validar comprimento máximo
 */
function validateMaxLength(value, maxLength) {
  return value && value.length <= maxLength;
}

/**
 * Validar número
 */
function validateNumber(value) {
  return !isNaN(parseFloat(value)) && isFinite(value);
}

/**
 * Validar campo de formulário
 */
function validateField(value, rules = {}) {
  const errors = [];
  
  if (rules.required && !validateRequired(value)) {
    errors.push('Campo obrigatório');
  }
  
  if (rules.email && !validateEmail(value)) {
    errors.push('Email inválido');
  }
  
  if (rules.cpf && !validateCPF(value)) {
    errors.push('CPF inválido');
  }
  
  if (rules.phone && !validatePhone(value)) {
    errors.push('Telefone inválido');
  }
  
  if (rules.minLength && !validateMinLength(value, rules.minLength)) {
    errors.push(`Mínimo ${rules.minLength} caracteres`);
  }
  
  if (rules.maxLength && !validateMaxLength(value, rules.maxLength)) {
    errors.push(`Máximo ${rules.maxLength} caracteres`);
  }
  
  if (rules.number && !validateNumber(value)) {
    errors.push('Deve ser um número');
  }
  
  return errors;
}

export {
  validateEmail,
  validateCPF,
  validatePhone,
  validateRequired,
  validateMinLength,
  validateMaxLength,
  validateNumber,
  validateField
};
