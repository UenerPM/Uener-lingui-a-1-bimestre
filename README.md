# 🌭 UENER LINGUÇO - Sistema de E-Commerce

**Versão**: 1.0 (Clean Architecture)  
**Data**: 9 de Dezembro de 2025  
**Status**: ✅ Pronto para Produção

Sistema moderno de e-commerce para venda de linguiças, desenvolvido com **Node.js + Express + PostgreSQL** e padrão **Clean Architecture**.

---

## 📋 Estrutura do Projeto

A partir de **dezembro de 2025**, o projeto foi refatorado para separação clara entre backend e frontend.

```
uener-linguica/
├── 📁 backend/                 # ⭐ BACKEND CONSOLIDADO
│   ├── app.js                  # Servidor principal (Express)
│   ├── package.json            # Dependências do backend
│   ├── .env                    # Variáveis de ambiente
│   ├── src/
│   │   ├── controllers/        # Controladores HTTP
│   │   │   ├── pixController.js
│   │   │   ├── produtosController.js
│   │   │   ├── imagensController.js
│   │   │   └── ...
│   │   ├── services/           # Lógica de negócio
│   │   ├── repositories/       # Acesso a dados (PostgreSQL)
│   │   ├── middleware/         # Middlewares customizados
│   │   ├── utils/              # Utilitários
│   │   │   └── pix.js         # Geração e validação de PIX (CRC16-CCITT)
│   │   ├── config/             # Configuração (db.js, etc.)
│   │   └── routes/             # Definição de rotas
│   │       ├── api.js          # Rotas /api/*
│   │       ├── api-avap2.js    # Rotas AVAP2
│   │       ├── pix.js          # Rotas de PIX
│   │       ├── imagens.js      # Rotas /imgs/*
│   │       └── ...
│   └── public/img/             # Imagens padrão (no-image.png)
│
├── 📁 frontend/                # ⭐ FRONTEND REFATORADO
│   └── public/                 # Arquivos estáticos servidos em /
│       ├── index.html          # Página inicial
│       ├── pagamento.html      # Página de pagamento
│       ├── login.html          # Login
│       ├── confirmacao.html    # Confirmação
│       ├── admin.html          # Painel admin
│       ├── verificar-pix.html  # Teste de PIX
│       ├── test-pix-console.html
│       ├── css/                # Estilos (agora 100% externalizado)
│       │   ├── style.css       # Global styles
│       │   ├── index.css       # Estilos de index.html
│       │   ├── login.css       # Estilos de login.html
│       │   ├── pagamento.css   # Estilos de pagamento.html
│       │   ├── confirmacao.css # Estilos de confirmacao.html
│       │   ├── admin.css       # Estilos de admin.html
│       │   ├── verificar-pix.css
│       │   ├── test-pix-console.css
│       │   └── pagamento-pix-demo.css
│       ├── js/                 # JavaScript frontend (100% externalizado)
│       │   ├── script.js       # Scripts globais
│       │   ├── app-avap2.js    # Configuração AVAP2
│       │   ├── pix-frontend.js # Funções PIX no frontend
│       │   ├── index.js        # Lógica de index.html
│       │   ├── login.js        # Lógica de login.html
│       │   ├── pagamento.js    # Lógica de pagamento (chama /api/pix)
│       │   ├── confirmacao.js  # Lógica de confirmacao
│       │   ├── verificar-pix.js
│       │   ├── test-pix-console.js
│       │   └── pagamento-pix-demo.js
│       └── img/                # Imagens estáticas
│
├── 📁 config/                  # Configuração legada (compatibilidade)
├── 📁 src/                     # Código legado (compatibilidade)
├── 📁 docs/                    # 📚 DOCUMENTAÇÃO ATIVA
│   ├── ARQUITETURA.md
│   ├── API.md
│   ├── PIX.md
│   └── IMAGENS.md
│
├── 📁 tests/                   # 🧪 TESTES
└── 📁 _archived/               # 📦 ARQUIVO (conteúdo antigo)
```

**Mudanças principais (Dezembro 2025):**
- ✅ Backend consolidado em `backend/` (antes: raiz)
- ✅ Frontend estático em `frontend/public/` (antes: `public/`)
- ✅ Todos os CSS e JS do frontend foram externalizados (antes: inline em HTMLs)
- ✅ Paths de require corrigidos para `./src/...` (antes: referências mistas)
- ✅ `backend/package.json` é agora o manifest principal

---

## 🚀 Começar

### 1. Instalação (Backend)
```bash
cd backend
npm install
```

### 2. Configurar variáveis de ambiente
```bash
cp .env.example .env
# Editar backend/.env com suas configurações
```

### 3. Iniciar servidor
```bash
# Do diretório backend/
npm start

# Ou com nodemon (dev mode)
npm run dev
```

O servidor iniciará em `http://localhost:3000`

**Nota**: O frontend está servido automaticamente a partir de `frontend/public/` quando o backend inicia.

---

## 📚 Documentação

- **[ARQUITETURA.md](./docs/ARQUITETURA.md)** — Estrutura do projeto e padrões de código
- **[API.md](./docs/API.md)** — Endpoints disponíveis e exemplos de uso
- **[PIX.md](./docs/PIX.md)** — Sistema de pagamento PIX (EMV-Co, CRC16-CCITT)
- **[IMAGENS.md](./docs/IMAGENS.md)** — Sistema de imagens com streaming

---

## 🏗️ Arquitetura

### Backend
O backend segue padrão MVC com separação clara de responsabilidades:

```
Controlador (HTTP) → Serviço (Lógica) → Repositório (BD) → Utilidades
```

**Exemplo: Geração de PIX**
1. `GET /api/pix/generate?amount=X` chama `pixController.gerarPix()`
2. Controller chama `pixUtil.gerarPayloadPix()`
3. Util usa `crc16Ccitt()` para calcular CRC
4. Retorna `{ success: true, data: { payload, qr, crc, validado, txid } }`

### Frontend
Frontend é **UI-only**: coleta entradas do usuário e chama APIs do backend via `fetch()`.

```javascript
// Exemplo: Gerar PIX no frontend
async function gerarPix(valor) {
  const response = await fetch(`/api/pix/generate?amount=${valor}`);
  const { data } = await response.json();
  // Exibir payload, QR code, etc.
}
```

---

## 🔐 Credenciais de Teste

```
Usuário: adm
Senha: 123
```

---

## ✅ Funcionalidades Principais

- ✅ **Autenticação** — Login com session
- ✅ **Produtos** — CRUD com imagens
- ✅ **Pagamentos** — PIX com QR code
- ✅ **Pedidos** — Completo
- ✅ **Clientes** — Gestão
- ✅ **Funcionários** — Gestão
- ✅ **Imagens** — Streaming com proteção contra traversal

---

## 🛠️ Tecnologias

- **Backend**: Node.js 22.16, Express.js
- **Banco**: PostgreSQL (avap2)
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Sessão**: express-session com PostgreSQL
- **PIX**: EMV-Co BRCode com CRC16-CCITT (XModem poly=0x1021, init=0xFFFF)

---

## 📞 Troubleshooting

Para erros ou problemas:

1. **Servidor não inicia**: Verifique se PostgreSQL está rodando
2. **Erro de autenticação**: Verifique `.env` com credenciais corretas
3. **Imagens não carregam**: Verifique `EXTERNAL_IMAGES_DIR` em `.env`
4. **PIX com CRC inválido**: Verifique se backend está gerando (não frontend)

---

**Última atualização**: 2 de dezembro de 2025
