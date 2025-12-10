/**
 * DOM Utils - Funções auxiliares para manipulação do DOM
 */

/**
 * Selecionar elemento por ID
 */
function id(elementId) {
  return document.getElementById(elementId);
}

/**
 * Selecionar elemento por CSS selector
 */
function select(selector) {
  return document.querySelector(selector);
}

/**
 * Selecionar múltiplos elementos
 */
function selectAll(selector) {
  return document.querySelectorAll(selector);
}

/**
 * Mostrar elemento
 */
function show(element) {
  if (element) element.style.display = '';
}

/**
 * Ocultar elemento
 */
function hide(element) {
  if (element) element.style.display = 'none';
}

/**
 * Adicionar classe CSS
 */
function addClass(element, className) {
  if (element) element.classList.add(className);
}

/**
 * Remover classe CSS
 */
function removeClass(element, className) {
  if (element) element.classList.remove(className);
}

/**
 * Definir texto de elemento
 */
function setText(element, text) {
  if (element) element.textContent = text;
}

/**
 * Definir HTML de elemento
 */
function setHTML(element, html) {
  if (element) element.innerHTML = html;
}

/**
 * Criar elemento
 */
function createElement(tag, attributes = {}, content = '') {
  const el = document.createElement(tag);
  
  Object.entries(attributes).forEach(([key, value]) => {
    if (key === 'className') {
      el.className = value;
    } else if (key.startsWith('on')) {
      el.addEventListener(key.substring(2).toLowerCase(), value);
    } else {
      el.setAttribute(key, value);
    }
  });
  
  if (content) {
    el.textContent = content;
  }
  
  return el;
}

/**
 * Mostrar notificação (toast)
 */
function showNotification(message, type = 'info') {
  const toast = createElement('div', {
    className: `notification notification-${type}`
  }, message);
  
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 15px 20px;
    background: ${type === 'error' ? '#f44336' : type === 'success' ? '#4caf50' : '#2196f3'};
    color: white;
    border-radius: 4px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    z-index: 10000;
    animation: slideIn 0.3s ease;
  `;
  
  document.body.appendChild(toast);
  
  setTimeout(() => toast.remove(), 3000);
}

export {
  id,
  select,
  selectAll,
  show,
  hide,
  addClass,
  removeClass,
  setText,
  setHTML,
  createElement,
  showNotification
};
