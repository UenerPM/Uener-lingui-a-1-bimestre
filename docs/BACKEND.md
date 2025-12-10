# BACKEND — Arquitetura proposta

Padrões e camadas propostos:
- `controllers/` — handle HTTP, validação de request, JSDoc para documentação
- `services/` — regras de negócio, orquestração de operações
- `repositories/` — acesso a banco; queries SQL isoladas aqui
- `routes/` — definição de rotas (apenas mapeamento para controllers)
- `config/` — centralizar variáveis de ambiente, pool DB, constantes
- `utils/` — helpers genéricos (logger, formatação, validators)

Boas práticas adotadas:
- Respostas JSON padronizadas
- Logs centralizados (util `logger`) com níveis
- Validar entrada no controller e regras no service
- Não expor queries diretamente em controllers

Migração incremental:
1. Criar a estrutura de pasta (já scaffoldada neste repositório).
2. Mover controllers um a um, mantendo compatibilidade com `app.js`.
3. Substituir referências de require/import para apontar para novo local.
4. Validar testes manuais após cada migração.
