Projeto de exemplo — backend em Node/Express com PostgreSQL e front-end estático.

Instruções rápidas (Windows / PowerShell)

1) Preparar variáveis de ambiente

- Edite `backend/.env` e defina `DATABASE_URL` com sua string de conexão PostgreSQL.

Exemplo:

```powershell
$env:DATABASE_URL = 'postgres://usuario:senha@localhost:5432/nomedb'
```

2) Instalar dependências (dentro da pasta `backend`)

```powershell
Set-Location 'C:\Users\upere\Uener-lingui-a-1-bimestre\backend'
npm install
```

3) Rodar migrations / seed (opcional)

Se houver um arquivo SQL de seed em `documentacao/avapScriptPostgre.sql`, você pode executá-lo com a ferramenta `scripts/run_sql_file.js`:

```powershell
Set-Location 'C:\Users\upere\Uener-lingui-a-1-bimestre\backend'
node .\scripts\run_sql_file.js ..\documentacao\avapScriptPostgre.sql
```

4) Iniciar servidor

```powershell
Set-Location 'C:\Users\upere\Uener-lingui-a-1-bimestre\backend'
node .\server\server.js
```

O servidor por padrão inicia em `http://localhost:3000`.

5) Executar scripts de teste automatizados

Os scripts de teste estão em `backend/scripts`. Para executar todos os scripts principais:

```powershell
Set-Location 'C:\Users\upere\Uener-lingui-a-1-bimestre\backend'
node .\scripts\test_db_endpoints.js
node .\scripts\test_more_entities.js
node .\scripts\test_more_endpoints.js
node .\scripts\test_validation_errors.js
```

Observações
- Os testes de escrita requerem um usuário admin pré-criado. O servidor cria um usuário `adm` com senha `adm` na primeira execução (utilizando o armazenamento `entities`).
- As requisições para a API usam sessão via `express-session`; os scripts de teste cuidam de autenticar e reutilizar o cookie de sessão.
- Validações de entrada usam `express-validator` e retornarão 400 com formato `{ erros: [...] }` quando falharem.

Contribuições
- Este repositório é um exemplo para demonstração de integração Node + PostgreSQL; sinta-se livre para abrir issues ou PRs com melhorias.

