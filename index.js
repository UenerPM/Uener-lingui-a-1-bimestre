backendconst express = require('express');
const app = express();
const PORT = 3000;

// Rota de exemplo
app.get('/', (req, res) => {
  res.send('Servidor funcionando!');
});

// Iniciar o servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
