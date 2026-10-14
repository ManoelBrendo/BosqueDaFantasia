# Bosque da Fantasia API

Backend opcional para conta centralizada, arquivos e integracao Amazon. O site funciona com login local mesmo sem este processo rodando.

## Autorizacao administrativa

A fundacao de autenticacao e autorizacao esta implementada no backend: cadastro publico sempre cria `reader`, contas antigas sem papel sao migradas para `reader`, e somente o provisionamento operacional pode criar o primeiro `admin`. Tokens locais do navegador nao autenticam no backend; cada requisicao protegida consulta o usuario e o papel atuais no banco.

O prefixo `/api/admin/*` exige sessao remota de administrador e nega por padrao. Ainda nao existem rotas administrativas de produto: uma chamada autorizada para uma rota inexistente recebe `404`. Nao publique operacoes administrativas antes de implementar e testar cada rota de produto.

Em producao, configure `BOSQUE_JWT_SECRET` com pelo menos 32 caracteres aleatorios e use HTTPS. A conta bootstrap precisa de senha exclusiva com pelo menos 12 caracteres. Segredos ficam somente no ambiente do processo; nunca no frontend, repositorio ou logs.

### Primeiro administrador

Defina `BOSQUE_BOOTSTRAP_ADMIN_EMAIL` e `BOSQUE_BOOTSTRAP_ADMIN_PASSWORD` no ambiente do processo da API. Use senha exclusiva com pelo menos 12 caracteres, configure ambas apenas durante o primeiro inicio e remova-as do ambiente depois que o log confirmar o provisionamento. A inicializacao cria apenas o primeiro administrador; se ja houver admin, a mesma identidade e aceita como repeticao idempotente, e qualquer tentativa de promover outra conta falha. Contas antigas sem papel sao migradas para `reader`.

`BOSQUE_JWT_SECRET` e obrigatorio em producao e deve ter ao menos 32 caracteres aleatorios. Restrinja a API a HTTPS. A senha de bootstrap e o segredo JWT nao devem ser commitados nem registrados em logs.

O espaco `/api/admin/*` exige sessao remota com papel `admin`; como ainda nao ha rotas administrativas de produto implementadas, requests autorizados recebem `404`. Tokens de contas locais nao sao reconhecidos pela API. O endpoint `/api/me` retorna o papel efetivo consultado no servidor.

O teste de integracao isolado da autenticacao roda com `npm test`; ele cria seu banco temporario e nao altera `backend/data/bosque-db.json`.

## Banco de dados local

As contas e os registros de arquivos ficam em `backend/data/bosque-db.json`.
O arquivo usa colecoes separadas para `users` e `files`, mantendo os dados em um unico banco local.
Para zerar as contas criadas, deixe `users` como uma lista vazia.

## Rodar

```bash
npm run api
```

Servidor:

```text
http://127.0.0.1:4180
```

## Frontend com API centralizada

Quando quiser usar conta centralizada, publique este backend em um host separado e configure a origem publica em `site-config.js`:

```js
window.BOSQUE_API_BASE = "https://sua-api.example.com";
```

O mesmo arquivo e carregado pelo portal e pela pagina de login. Sem essa configuracao, o frontend usa conta local salva apenas no navegador do usuario. A tela de acesso informa o estado da API; se o servidor estiver fora, contas remotas nao podem autenticar e o site mantem a experiencia publica/dados locais disponiveis.

## Rotas

- `GET /api/health`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/me`
- `GET /api/files`
- `POST /api/files`
- `GET /api/files/:id`
- `GET /api/amazon/search?q=tolkien`

## Amazon

As chaves devem ficar em variaveis de ambiente. Copie `.env.example` como referencia.

A PA-API exige assinatura AWS SigV4. Este backend ja assina `SearchItems` quando `AMAZON_ACCESS_KEY`, `AMAZON_SECRET_KEY` e `AMAZON_PARTNER_TAG` estiverem definidos.

Como a documentacao atual indica depreciacao da PA-API e migracao para Creators API, a integracao foi isolada em `lib/amazon.mjs` para troca futura sem mexer no frontend.
