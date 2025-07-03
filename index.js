// Importa o módulo Express, que facilita a criação de servidores web em Node.js
const express = require('express');

// Cria uma instância do aplicativo Express
const app = express();

// Define a porta na qual o servidor irá escutar
const PORT = 3000;

// Rota de exemplo: responde com uma mensagem quando acessar http://localhost:3000/
app.get('/', (req, res) => {
  res.send('Servidor funcionando!');
});

// Inicia o servidor e exibe uma mensagem no console quando estiver pronto
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
