# FRONTEND — Organização e convenções

Estrutura proposta:
- `frontend/` — código fonte do UI (HTML/CSS/JS)
  - `public/` — páginas servidas estaticamente
  - `public/js/` — módulos JS por responsabilidade: `api.js`, `cart.js`, `payments.js`, `images.js`, `utils.js`
  - `public/css/` — folhas consolidada: `main.css` (importar partials se usar preprocessor)

Regras:
- Remover duplicações de HTML (ex.: `pagamento.html` duplicado) consolidando templates.
- Centralizar URLs do backend em `public/js/api.js` (const API_BASE = '/api').
- Evitar código inline e usar módulos.

Observações práticas:
- O repositório já contém `/public`, `/html` e `/frontend`. Recomenda-se consolidar em `frontend/public` ou manter `public/` e mover JS para `public/js/modules`.
