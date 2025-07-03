# Documentação do arquivo data.json

Este arquivo armazena os dados persistentes do sistema Uener Linguço.

## Estrutura

```json
{
  "users": [ ... ],
  "linguicas": [ ... ]
}
```

### users (array de objetos)
- **username**: string — nome de login do usuário
- **password**: string — senha do usuário
- **isAdmin**: boolean — indica se o usuário é administrador
- **bloqueado**: boolean (opcional) — indica se o usuário está bloqueado

### linguicas (array de objetos)
- **id**: número — identificador único da linguiça
- **nome**: string — nome da linguiça
- **preco**: string — preço da linguiça
- **imagem**: string — nome do arquivo da imagem da linguiça (sempre no formato `<id>.<extensão>`, ex: `3.jpg`)

## Observações
- Não adicione comentários dentro do arquivo `data.json`, pois JSON não permite comentários.
- Sempre que uma linguiça for criada ou editada, a imagem deve ser salva/renomeada para `<id>.<extensão>`.
- O campo `bloqueado` em usuários é opcional e, se ausente, considera-se que o usuário não está bloqueado.
