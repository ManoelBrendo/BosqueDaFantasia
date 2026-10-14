# Runbook de deploy

Este runbook descreve o caminho seguro para publicar o Bosque da Fantasia e checar cada rodada pelo metodo em W.

## Ambientes

| Ambiente | Uso | Observacao |
| --- | --- | --- |
| Local estatico | Desenvolvimento padrao | `npm run dev`; login local funciona sem backend. |
| Local com API | Teste opcional de login remoto | `npm run api` em `http://127.0.0.1:4180` ou definir `window.BOSQUE_API_BASE`. |
| Producao estatica | GitHub Pages | Site sem backend embutido; usa modo local por padrao. |
| Producao com API | Backend Node publicado | Definir `window.BOSQUE_API_BASE` antes de `account-api.js`. |

## Pre-deploy

1. Confirmar escopo da rodada no documento de requisitos.
2. Rodar `npm run check`.
3. Rodar `npm run build`.
4. Testar manualmente:
   - Login/cadastro com API desligada.
   - Busca no acervo.
   - Oraculo de afinidade.
   - Guardar/remover livro do relicario.
   - Ficha do livro.
5. Conferir `git status --short`.
6. Garantir que estes caminhos nao entram no commit:
   - `dist/`
   - `backend/data/`
   - `backend/uploads/`
   - `backend/.env`

## Deploy do site estatico

1. Fazer commit com mensagem clara.
2. Fazer push para `main`.
3. Aguardar GitHub Actions concluir.
4. Conferir GitHub Pages.
5. Abrir o site publicado e testar login local, busca e favoritos.

## Deploy do backend

O site nao precisa do backend para login local. O backend Node e opcional e serve para conta centralizada, arquivos e integracoes.

### Publicar em host Node separado

1. Crie um servico Node.js com Node 20 ou superior e publique o repositorio com `npm run api` como comando de inicio.
2. Configure as variaveis de ambiente abaixo no painel seguro do provedor. Nao adicione valores reais ao repositorio nem ao arquivo `site-config.js`.
3. Ative HTTPS e configure `BOSQUE_CORS_ORIGIN` com a origem exata do site estatico (sem barra final).
4. Configure armazenamento persistente para `backend/data` e `backend/uploads`. O banco atual e JSON local; um sistema de arquivos efemero perde dados ao reiniciar, e multiplas instancias nao devem compartilhar esse banco sem migracao para storage transacional.
5. Aplique temporariamente `BOSQUE_BOOTSTRAP_ADMIN_EMAIL` e `BOSQUE_BOOTSTRAP_ADMIN_PASSWORD` para provisionar o primeiro admin; remova as duas variaveis depois da inicializacao confirmada.
6. Confira `https://sua-api.example.com/api/health` e depois defina `window.BOSQUE_API_BASE` em `site-config.js` com essa origem HTTPS.
7. Rode `npm run build`, publique o conteudo de `dist` no host estatico e teste login remoto, credencial invalida, API indisponivel e acesso local.

O contrato de bootstrap ainda nao implementa recuperacao de conta, sincronizacao de favoritos ou rotas administrativas de produto. Nao trate o endpoint de health como verificacao da sessao do usuario.

Variaveis importantes:

```text
BOSQUE_API_HOST=0.0.0.0
BOSQUE_API_PORT=4180
BOSQUE_JWT_SECRET=<segredo-aleatorio-com-pelo-menos-32-caracteres>
BOSQUE_CORS_ORIGIN=https://seu-site.example.com
BOSQUE_BOOTSTRAP_ADMIN_EMAIL=
BOSQUE_BOOTSTRAP_ADMIN_PASSWORD=
AMAZON_ACCESS_KEY=
AMAZON_SECRET_KEY=
AMAZON_PARTNER_TAG=
```

Depois de publicar, configurar `site-config.js`:

```js
window.BOSQUE_API_BASE = "https://sua-api.example.com";
```

## Checagem em W por deploy

- W1 Descoberta: o que mudou e qual usuario impacta?
- W2 Desenho: estados de UI/API/offline foram previstos?
- W3 Implementacao: codigo e docs foram atualizados?
- W4 Verificacao: `check`, `build` e testes manuais passaram?
- W5 Aprendizado: quais riscos sobraram para a proxima rodada?

## Rollback

1. Identificar o ultimo commit estavel no GitHub.
2. Criar um revert do commit problemático, sem reescrever historico publico.
3. Rodar `npm run check` e `npm run build`.
4. Fazer push para `main`.
5. Confirmar GitHub Actions e testar producao.
