# Levantamento de requisitos e funcionalidades

Este documento organiza o que o Bosque da Fantasia entrega hoje, o que cada funcionalidade faz por dentro e quais requisitos devem ser conferidos a cada nova implementacao.

## Visao do produto

O Bosque da Fantasia e uma experiencia web/PWA para orientar leitores iniciantes e curiosos em literatura fantastica. O site combina curadoria editorial, busca em acervo aberto, recomendacao por afinidade, glossario, favoritos locais, login e modo offline.

## Personas principais

- Leitor iniciante: quer descobrir por onde comecar sem se perder em catalogos longos.
- Leitor explorador: pesquisa autores, temas, criaturas e atmosferas para montar uma trilha propria.
- Administrador/editor: precisa manter dados editoriais, autores, temas, textos e links confiaveis.
- Operador tecnico: precisa publicar, validar e conectar backend/API sem quebrar o site estatico.

## Funcionalidades atuais

| Funcionalidade | Arquivos principais | O que faz | Requisitos centrais | Checagem minima |
| --- | --- | --- | --- | --- |
| Portal inicial | `index.html`, `app.js`, `fantasy-effects.js` | Apresenta proposta, secoes e jornada inicial. | Carregar sem backend, navegar por ancoras, manter responsividade. | Abrir desktop/mobile, testar links e console. |
| Autenticacao e conta | `account-api.js`, `account-panel.js`, `backend/lib/auth.mjs` | Login local por padrao e login remoto somente quando API for configurada. | Nao exigir API rodando, limpar sessao no logout, nao enviar token local como bearer. | Login local, cadastro local, logout e API opcional. |
| Acervo pesquisavel | `catalog-api.js`, `open-library-api.js`, `library-db.js` | Busca na Open Library, normaliza metadados e usa cache local. | Ter fallback offline, capa alternativa, paginacao e status de erro. | Buscar termo, carregar mais, simular falha de rede. |
| Filtros avancados | `app.js`, `site-data.js` | Filtra por clima, dificuldade e motivo central. | Mapear para `book.filters`, preservar estado, limpar filtros. | Ativar filtros, estado vazio, limpar. |
| Oraculo de afinidade | `recommendation-engine.js`, `app.js`, `site-data.js` | Calcula trilha de leitura por respostas. | Exigir todas as respostas, pontuar trilhas, iniciar busca sugerida. | Responder, resetar, explorar trilha. |
| Autores | `app.js`, `site-data.js` | Lista autores e ficha editorial do autor ativo. | Cada autor precisa de obras, legado, clima e porta de entrada. | Trocar autor e validar ficha. |
| Glossario | `app.js`, `site-data.js` | Busca termos de apoio e mostra contador. | Buscar por termo/definicao/tags, mostrar vazio util. | Buscar termo existente e inexistente. |
| Relicario | `app.js`, `catalog-api.js`, `library-db.js` | Salva favoritos no navegador. | Favoritos unicos, persistentes e sincronizados na UI. | Guardar/remover livro e recarregar. |
| Ficha de livro | `app.js`, `compra.html`, `assets/js/purchase-page.js` | Mostra capa, descricao, sinais editoriais e link de compra/leitura. | Atualizar ao selecionar livro, proteger link vazio, `alt` adequado. | Clicar livro, verificar ficha e botao. |
| PWA/offline | `pwa.js`, `sw.js`, `manifest.webmanifest` | Instala app, cacheia shell e mostra status de rede. | Nao interceptar `/api/`, versionar cache, funcionar em HTTPS. | Registrar SW, testar offline e status. |
| Audio ambiente | `index.html`, `audio-player.js` | Toca trilhas medievais opcionais com player customizado. | Usar `<audio>` com fontes MP3/OGG, Play/Pause, volume, seletor de faixa, persistencia e erro compreensivel. | Alternar botao, trocar faixa, mudar volume, recarregar e confirmar estado inicial. |
| Densidade visual global | `index.html` | Reduz altura dos cards e paineis sem remover conteudo. | Usar truncamento visual, grids responsivos, botoes acessiveis e leitura clara no mobile. | Conferir acervo, estante, glossario, autores, oraculo e ficha em desktop/mobile. |
| Navegacao mobile | `index.html`, `app.js` | Compacta o menu principal em telas pequenas. | Botao com `aria-expanded`, fechamento ao tocar em link e menu completo no desktop. | Abrir/fechar menu no celular e navegar para secoes. |
| Filtros mobile | `index.html`, `app.js` | Recolhe filtros no celular para reduzir rolagem inicial. | Manter filtros ativos visiveis, preservar limpar filtros e abrir no desktop. | Alternar painel, aplicar filtro e limpar filtros. |
| Backend legado/local | `backend/server.mjs`, `backend/lib/*.mjs` | API de auth, usuario, arquivos e Amazon. | Health JSON, CORS, hash de senha, payload limitado. | `/api/health`, cadastro, login, `/api/me`. |

## Requisito prioritario: autenticacao e autorizacao administrativa

**Prioridade:** P0 — bloqueador para disponibilizar qualquer operacao administrativa em producao.

**Status:** fundacao de autenticacao/autorizacao implementada; painel/rotas administrativas de produto ainda nao existem.

**Escopo:** substituir a credencial Master embutida no frontend por identidade e permissoes verificadas exclusivamente pelo backend. A conta local pode continuar existindo para leitura e personalizacao local, mas nunca representa uma sessao administrativa.

### Problema e usuarios impactados

A versao anterior reconhecia uma credencial Master em `account-api.js` e permitia que uma sessao local parecesse administrativa. Esse caminho foi removido: tokens locais nao autenticam no backend. A fundacao atual armazena papeis no servidor, provisiona o primeiro administrador por ambiente operacional e protege o prefixo `/api/admin/*`; ainda nao ha rotas administrativas de produto. Usuarios impactados: administrador/editor, leitores cujos dados estejam no backend e operador responsavel pelo deploy.

### Decisoes de produto e seguranca

- A autoridade para identificar administradores fica no backend, nunca em email/senha/chave compartilhados no cliente.
- Cadastro publico sempre cria usuario comum. Nenhum campo recebido do navegador pode conceder papel ou permissao.
- A primeira conta administrativa e provisionada por operador, fora do cadastro publico, usando configuracao secreta do ambiente ou comando operacional documentado. Segredo inicial nao e persistido no frontend nem exposto em logs/respostas.
- Conta local funciona apenas para preferencias e recursos locais. Nao acessa dados ou operacoes protegidas do backend.
- Se a API estiver indisponivel, o painel administrativo fica inacessivel e informa a indisponibilidade; nao existe fallback Master local.
- O papel administrativo e consultado no registro atual do usuario no servidor em cada requisicao protegida; papel ou permissao presentes apenas no JWT nao bastam.

### Comportamento esperado

- Visitante sem sessao: nao ve controles administrativos e recebe `401` em chamadas protegidas.
- Usuario autenticado comum: pode usar recursos de leitor autorizados, mas recebe `403` ao acessar qualquer operacao administrativa.
- Administrador autenticado: acessa somente as operacoes explicitamente autorizadas ao seu papel.
- Token expirado, invalido, usuario removido/desativado ou papel revogado: requisicao protegida recebe `401`; a UI limpa a sessao e orienta novo login.
- API indisponivel ou erro de rede: a UI distingue indisponibilidade de credenciais incorretas e nao mostra conteudo administrativo como se estivesse autenticado.

### Requisitos funcionais

- **RF-SEC-001:** remover do frontend a senha, email privilegiado e qualquer caminho especial de autenticacao Master.
- **RF-SEC-002:** modelo de usuario no backend possui papel com allowlist (no minimo `reader` e `admin`), com `reader` como padrao obrigatorio no registro publico.
- **RF-SEC-003:** provisionar o primeiro administrador por fluxo operacional seguro; repetir o comando nao deve criar contas duplicadas nem rebaixar ou elevar usuarios silenciosamente.
- **RF-SEC-004:** fornecer middleware de autenticacao e autorizacao que consulta usuario atual, confirma estado ativo e papel exigido antes da logica de cada rota protegida.
- **RF-SEC-005:** rotas administrativas novas devem declarar permissao requerida e negar por padrao quando nao houver politica explicita.
- **RF-SEC-006:** `/api/me` retorna apenas dados publicos e o papel efetivo obtido do servidor; resposta de cadastro/login nao aceita papel vindo do cliente.
- **RF-SEC-007:** a interface exibe opcoes administrativas somente apos confirmar sessao remota e papel `admin`; essa exibicao e conveniencia de UI, nao controle de acesso.
- **RF-SEC-008:** logout, sessao invalida e revogacao removem estado administrativo do cliente. O backend rejeita tokens apos expiracao e, quando houver revogacao implementada, apos logout/revogacao.
- **RF-SEC-009:** credenciais e segredos sao configurados fora do repositorio; logs nunca incluem senha, token, segredo de provisionamento ou conteudo sensivel.
- **RF-SEC-010:** limitar tentativas de login e provisionamento, validar entradas e devolver erros sem revelar se uma conta privilegiada existe.

### Requisitos nao funcionais

- **Seguranca:** apenas HTTPS em producao; senha armazenada com funcao de derivacao resistente a brute force e salt unico; comparacao segura; protecao contra tentativa repetida; segredo JWT forte e obrigatorio em producao; nenhuma autorizacao baseada em dados controlados pelo browser.
- **Disponibilidade:** falha do backend deve bloquear somente recursos remotos/admin, mantendo a experiencia publica e recursos locais do leitor.
- **Privacidade:** respostas publicas omitem hash, segredos e atributos internos; auditoria registra acao administrativa, ator e horario sem registrar credenciais.
- **Compatibilidade:** usuarios existentes sem papel explicito recebem papel comum por migracao; nenhuma conta existente ganha permissao administrativa automaticamente.
- **Operacao:** procedimento de provisionamento, rotacao de segredo e recuperacao de acesso documentado e verificavel.

### Criterios de aceite

1. Dado um build publico, quando seus arquivos JavaScript sao inspecionados, entao nao existe credencial privilegiada ou segredo de provisionamento.
2. Dado um cadastro publico, quando o corpo inclui `role: "admin"`, entao a conta persistida continua como `reader`.
3. Dado um token local criado no navegador, quando e enviado a rota administrativa, entao o backend responde `401`.
4. Dado um usuario comum autenticado, quando chama uma rota administrativa, entao recebe `403` e nenhuma alteracao ocorre.
5. Dado um administrador provisionado e autenticado, quando chama uma rota permitida, entao a operacao funciona e a auditoria identifica o ator.
6. Dado papel rebaixado, conta desativada ou usuario removido, quando um token anterior tenta acessar rota protegida, entao o backend nega com `401` ou `403` de acordo com o contrato documentado.
7. Dada API indisponivel, quando o usuario tenta abrir o painel administrativo, entao a UI informa indisponibilidade e nao autentica localmente.
8. Dado o cadastro/login normal, quando o usuario autentica, entao `/api/me` apresenta perfil comum sem interromper os fluxos existentes de leitor.
9. Dado o banco atual com usuarios sem papel, quando a migracao roda, entao todos recebem papel `reader`, sem perda de conta ou elevacao de privilegio.

### Plano de implementacao e verificacao

1. Definir contrato de papeis, rotas administrativas reais e ambiente de producao; inventariar se existe painel/operacao privilegiada alem da interface atual.
2. Implementar migracao de usuarios, provisionamento do primeiro admin e politica de segredo forte obrigatorio em producao.
3. Implementar middleware deny-by-default e testes automatizados de leitor/admin/anonimo/token local/usuario desativado.
4. Remover o caminho Master de `account-api.js`; ajustar `/api/me` e UI para distinguir local, remoto comum, remoto admin e indisponivel.
5. Documentar HTTPS, variaveis obrigatorias, provisionamento, rotacao e recuperacao; validar build publico para ausencia de segredos.
6. Fazer rollout primeiro em staging, provisionar admin, validar matriz de permissoes e observar logs antes de habilitar operacao em producao.

O teste de integracao da fundacao de autenticacao esta em `scripts/test-auth.mjs` e roda com `npm test`. Ele usa uma copia temporaria do backend e banco, sem modificar os dados locais do projeto.

### Fora do escopo desta rodada

- Reconstrucao completa do painel editorial, gestao de papeis por UI, SSO, MFA e migracao de contas locais para remotas. MFA deve ser avaliado antes de abrir administracao sensivel a internet.
- Redesenho de cadastro ou sincronizacao de favoritos.

### Dependencias e riscos em aberto

- Confirmar quais operacoes de negocio devem ser exclusivas de admin: hoje a API lista arquivos por usuario, aceita upload autenticado e faz busca Amazon publica; nao foi encontrada rota de edicao editorial administrativa.
- O banco JSON atual precisa suportar migracao segura antes de incluir campos de papel; gravacoes concorrentes permanecem risco operacional independente.
- O mecanismo atual de JWT nao oferece revogacao imediata por logout. Se revogacao imediata for requisito de producao, adotar versao de sessao/revogacao no servidor ou sessao opaca persistida.
- A conta Master local existente nao pode ser migrada como administradora por nome ou email. O operador devera provisionar explicitamente uma identidade remota apos validar posse do canal de acesso.

### Plano de testes

- Automatizado: cadastro tentando elevar papel; login comum; admin provisionado; sem token; token local; token invalido/expirado; papel alterado; conta desativada; rota sem politica; segredo ausente em producao.
- Regressao: cadastro/login comum, `/api/me`, arquivos proprios, modo local de leitor e site estatico sem backend.
- Operacional: busca por segredo no artefato de build, provisionamento em staging, rotacao de segredo e verificacao de logs sem dados sensiveis.
- Interface: desktop e largura mobile para estados anonimo, comum, admin, sessao expirada e API indisponivel.

## Modelo de requisito por nova funcionalidade

Use este bloco em toda implementacao nova.

```md
### Nome da funcionalidade

Problema:
- Qual dor ou oportunidade resolve?

Usuarios impactados:
- Quem usa ou opera?

Comportamento esperado:
- O que o usuario ve e faz?
- Quais estados existem: vazio, carregando, sucesso, erro, offline?

Funcionamento interno:
- Quais arquivos mudam?
- Quais dados entram, saem ou persistem?
- Usa API, IndexedDB, localStorage, cache, service worker ou arquivo editorial?

Requisitos funcionais:
- RF-001:
- RF-002:

Requisitos nao funcionais:
- Acessibilidade:
- Responsividade:
- Performance:
- Seguranca:
- Offline/degradacao:

Critérios de aceite:
- Dado que..., quando..., entao...

Plano de teste:
- Manual:
- Automatizado:
- Regressao:

Metodo em W:
- W1 Descoberta:
- W2 Desenho:
- W3 Implementacao:
- W4 Verificacao:
- W5 Aprendizado:
```

## Dependencias e riscos

- O login nao depende do backend por padrao. Autenticacao centralizada exige API publicada e configuracao explicita em `window.BOSQUE_API_BASE`.
- Open Library e Wikimedia sao fontes externas; falhas devem degradar para cache, curadoria local ou placeholder.
- Dados locais ficam por navegador; nao devem ser vendidos como conta sincronizada.
- Service worker pode servir cache antigo; sempre incrementar cache quando mudar shell essencial.
- Efeitos visuais podem prejudicar performance se crescerem sem limite; usar `prefers-reduced-motion`.
- Mobile deve usar experiencia visual leve por padrao: sem canvas animado, parallax, particulas, compasso fixo ou bibliotecas de motion nao essenciais.
- Uploads e Amazon dependem do backend; esconder ou degradar controles quando a API estiver indisponivel.
