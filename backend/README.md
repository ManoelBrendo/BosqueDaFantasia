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

## Armazenamento local e PostgreSQL

Sem `DATABASE_URL`, o desenvolvimento local continua usando `backend/data/bosque-db.json` e `backend/uploads`. Esse armazenamento e apenas para desenvolvimento/testes em uma instancia.

Em producao, `DATABASE_URL` e obrigatoria. O backend cria/atualiza o schema PostgreSQL por migracoes versionadas na inicializacao. As colecoes de usuarios, arquivos e bibliotecas usam JSONB transacional com bloqueio da linha da colecao durante atualizacoes; conteudos de arquivos ficam em `BYTEA`, separados dos metadados. Arquivos continuam limitados a 4 MB.

Para importar o armazenamento legado para um banco PostgreSQL vazio:

1. Configure `DATABASE_URL` e garanta que o banco de destino esta acessivel.
2. Preserve uma copia de seguranca de `backend/data/bosque-db.json` e `backend/uploads`.
3. Execute `npm run migrate:postgres` a partir da raiz do projeto. O comando importa usuarios, metadados e conteudo dos arquivos em uma unica transacao, nao altera os arquivos de origem e interrompe se faltar conteudo ou se o destino ja tiver dados.
4. Repita o comando para confirmar que a importacao e idempotente; valide login, papeis, listagem e leitura de arquivos antes de apontar usuarios para a API.

O ID de importacao `legacy-json-v1` fica registrado no banco. Se a origem mudar apos a primeira importacao, o comando falha de forma explicita em vez de sobrescrever dados.

As migracoes criam tabelas de colecao, registro de importacao e blobs de arquivos. O modelo atual mantem as colecoes em JSONB para preservar a API interna existente; se o volume crescer, normalizar usuarios, arquivos e bibliotecas em tabelas relacionais deve ser uma etapa propria.

O PostgreSQL garante transacoes e concorrencia entre processos, mas backup e recuperacao ainda precisam ser ativados e testados no provedor. Nao considere o deploy pronto antes de executar e documentar uma restauracao isolada.

No modo local, o arquivo usa colecoes separadas para `users` e `files`, mantendo os dados em um unico banco JSON.
Para zerar as contas criadas, deixe `users` como uma lista vazia.
Atualizacoes de colecoes sao serializadas dentro de um processo, e a gravacao usa arquivo temporario seguido de substituicao atomica. JSON invalido ou colecoes corrompidas interrompem a inicializacao sem recriar o arquivo vazio; restaure um backup antes de reiniciar.

Esse armazenamento local nao oferece transacoes entre processos, multiplas instancias, backup automatico ou recuperacao ponto a ponto. Nunca use o JSON local como persistencia de producao.

## Rodar

```bash
npm run api
```

Servidor:

```text
http://127.0.0.1:4180
```

## Deploy sugerido no Railway

O frontend pode continuar no GitHub Pages com dominio proprio; a API Node e o PostgreSQL ficam em servicos separados no mesmo projeto Railway.

1. Configure o servico Node com a raiz do repositorio, Node 20 ou superior e comando `npm run api`.
2. Adicione PostgreSQL ao projeto e defina `DATABASE_URL` usando a referencia privada fornecida pelo Railway.
3. Configure `BOSQUE_JWT_SECRET` com pelo menos 32 caracteres aleatorios, `BOSQUE_CORS_ORIGIN` com a origem HTTPS exata do frontend e as variaveis de bootstrap do primeiro admin somente durante o provisionamento.
4. Configure o health check do servico para `/api/health`. O endpoint confirma conectividade com o banco e retorna falha quando o PostgreSQL nao responde.
5. Execute a importacao do legado uma unica vez, de um ambiente confiavel com acesso ao banco e aos arquivos locais, usando `npm run migrate:postgres`.
6. Na aba Backups do servico PostgreSQL, habilite os agendamentos diarios, semanais e mensais. A retencao documentada pelo Railway e de 6, 27 e 89 dias, respectivamente; confirme os limites e custos atuais antes de ativar.
7. Antes de usar contas reais, faca um teste de restauracao em ambiente isolado e confira login, papeis e leitura de arquivos. Nao teste uma restauracao sobre o banco de producao em uso.
8. A API usa `PORT` automaticamente e escuta em `0.0.0.0` em producao.

O repositorio nao esta conectado nem implantado no Railway. Sao necessarios projeto, banco e DNS configurados para validar conectividade, backup, restore e deploy real.

Railway informa que backups de volume podem ser agendados ou criados manualmente e que uma restauracao so pode ser feita no mesmo projeto e ambiente. A restauracao prepara uma alteracao de volume para revisao antes do deploy; planeje o teste para nao aplicar essa alteracao ao servico de producao. Consulte [Backups do Railway](https://docs.railway.com/volumes/backups) e [PostgreSQL no Railway](https://docs.railway.com/databases/postgresql).

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
