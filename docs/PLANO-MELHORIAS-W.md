# Plano de melhorias com metodo em W

Este plano organiza proximas rodadas de evolucao do Bosque da Fantasia. A regra de trabalho e: toda funcionalidade nasce com requisito, passa por desenho, implementacao, verificacao e aprendizado antes de ser considerada pronta.

## Metodo em W adotado

O W aqui e um ciclo de ida e volta entre produto, experiencia, codigo e validacao.

```text
W1 Descoberta       W3 Implementacao       W5 Aprendizado
 \                 / \                    /
  W2 Desenho -----     W4 Verificacao ----
```

### W1 Descoberta

Objetivo: entender problema, usuario, risco e valor.

Perguntas:
- Qual usuario ganha algo com isso?
- Qual comportamento atual esta ruim, ausente ou fragil?
- O que fica fora do escopo desta rodada?
- Existe impacto em login, dados locais, API, offline ou deploy?

Saida esperada:
- Requisito escrito.
- Criterios de aceite.
- Riscos conhecidos.

### W2 Desenho

Objetivo: definir como a solucao deve aparecer e se encaixar.

Perguntas:
- Qual estado visual inicial, carregando, erro, vazio e sucesso?
- Em quais arquivos a mudanca entra?
- O componente segue o estilo do site?
- Precisa alterar dados em `site-data.js`, IndexedDB, API ou service worker?

Saida esperada:
- Desenho de fluxo.
- Contrato de dados.
- Lista de arquivos afetados.

### W3 Implementacao

Objetivo: construir com menor ruptura possivel.

Perguntas:
- A mudanca respeita padroes atuais?
- Evita duplicacao desnecessaria?
- Tem degradacao para offline/API indisponivel?
- Evita introduzir dependencia nova sem necessidade?

Saida esperada:
- Codigo alterado.
- Documentacao atualizada quando necessario.
- Sem mudancas laterais fora do escopo.

### W4 Verificacao

Objetivo: provar que funciona e nao quebrou o restante.

Checklist minimo:
- `npm run check`
- `npm run build`
- Teste manual no fluxo alterado.
- Teste de regressao do login.
- Teste de mobile ou largura estreita quando houver UI.
- Conferencia de console.

Saida esperada:
- Evidencia do que foi testado.
- Bugs encontrados ou riscos aceitos.

### W5 Aprendizado

Objetivo: registrar o que ficou melhor e o que precisa da proxima rodada.

Perguntas:
- O requisito foi atendido?
- O que ficou pendente?
- A arquitetura ficou mais simples ou mais complexa?
- Ha nova divida tecnica?

Saida esperada:
- Nota de release/commit.
- Proximo passo priorizado.
- Atualizacao do levantamento se a funcionalidade mudou de comportamento.

## Rodadas planejadas

### Rodada 0: fechar a autorizacao administrativa antes de producao

**Prioridade:** P0 / fundacao implementada; segue bloqueador para disponibilizar operacoes administrativas ate a validacao em staging e implementacao das rotas de produto.

**Requisito detalhado:** `docs/REQUISITOS-FUNCIONALIDADES.md`, secao "Requisito prioritario: autenticacao e autorizacao administrativa".

Objetivo:
- Remover a credencial Master embutida no navegador e garantir que toda permissao administrativa seja decidida pelo backend.

Entregas:
- Papel `reader` aplicado por padrao e papel `admin` concedido apenas por provisionamento operacional.
- Migracao conservadora: contas antigas sem papel viram `reader`; nenhuma elevacao automatica.
- Middleware de autorizacao deny-by-default com verificacao do usuario e papel atuais no backend.
- Frontend sem segredo Master, sem fallback administrativo local e com estados claros para nao autenticado, sem permissao, sessao expirada e API indisponivel.
- Runbook para segredo JWT, HTTPS, provisionamento, rotacao e recuperacao de acesso.

Checagem em W:
- W1: inventariar operacoes privilegiadas e decidir se admin precisa de revogacao imediata de sessao.
- W2: fechar contrato de papel, migration, provisionamento, rotas e resposta de erros.
- W3: implementar backend e frontend em etapas pequenas, mantendo cadastro publico sempre como leitor.
- W4: testar anonimo, token local, leitor, admin, papel revogado, usuario desativado, segredo ausente e regressao de leitor.
- W5: validar em staging, revisar artefato publico e logs, registrar procedimento operacional antes do rollout.

Bloqueio de producao:
- Nao disponibilizar interface ou operacao administrativa remota ate todos os criterios RF-SEC-001 a RF-SEC-010 e de aceite serem atendidos.
- Confirmar o fluxo real de provisionamento do primeiro administrador e remover a credencial publicada do historico/artefatos conforme a estrategia de resposta a segredo exposto.

### Rodada 1: consolidar login e API legada

**Status:** indicador de modo/conectividade, estados de erro e guia generico de backend separado implementados; conta local mantida como modo padrao e fallback explicito. A sessao remota em cache nao bloqueia a experiencia publica quando a API cai, mas tambem nao e considerada verificada.

Objetivo:
- Garantir que o site funcione em GitHub Pages e tambem com backend real.

Melhorias:
- Mostrar indicador discreto "modo local" no painel de conta.
- Adicionar `GET /api/health` visual no portal para informar se a API esta conectada.
- Separar melhor mensagens de erro: credencial invalida, API fora, sessao expirada.
- Criar guia de deploy do backend em provedor separado.

Checagem em W:
- W1: confirmar se a meta e conta local, conta remota ou as duas.
- W2: desenhar estado de conectividade no painel.
- W3: implementar sem bloquear acesso offline.
- W4: testar com API ligada, API desligada e GitHub Pages.
- W5: decidir se conta local continua como fallback permanente.

### Rodada 2: melhoria visual do portal e densidade de interface

**Status:** implementada em CSS compartilhado, sem reescrever as paginas.

Objetivo:
- Refinar a primeira impressao e reduzir excesso visual onde atrapalha leitura.

Melhorias:
- Revisar hierarquia tipografica em secoes densas.
- Reduzir cards grandes em areas operacionais.
- Melhorar contraste de textos secundarios.
- Padronizar botoes, chips e estados ativos.
- Revisar mobile: topo, conta, busca e ficha de livro.

Checagem em W:
- W1-W2: pontos de friccao identificados; contraste, borda, sombra e estados refinados.
- W3: estilos compartilhados aplicados em `assets/site-polish.css`; sistema visual carregado antes da camada de polimento.
- W4: quatro paginas verificadas em 360px, 768px e 1366px, sem overflow horizontal; cartoes do acervo compactos e responsivos.
- W5: testes, check e build passaram. Proxima etapa: Rodada 3, arquitetura de frontend.

### Rodada 3: arquitetura de frontend

**Status:** em andamento; renderizadores de livros, autores, glossário e afinidade extraídos e cobertos por testes.

Objetivo:
- Reduzir tamanho e acoplamento de `app.js` e `index.html`.

Melhorias:
- Extrair renderizadores restantes de estado e componentes editoriais ainda acoplados ao `app.js`.
- Criar modulo de estado para UI, favoritos e recentes.
- Separar CSS inline de `index.html` em arquivo dedicado.
- Remover duplicidade entre `index-page.js` e `app.js` se uma versao nao for mais usada.
- Criar contratos claros para `Book`, `Author`, `ReadingPath` em documentacao.

Checagem em W:
- W1: extração incremental, priorizando renderização de livros e conteúdo editorial.
- W2: `render-books.js`, `render-profile.js` e `render-affinity.js` isolam templates e renderização por dados/elementos recebidos, sem ler estado global.
- W3: renderizadores de cartões de livros, curadoria, favoritos, temas, afinidade, autores e glossário separados sem alterar os seletores de interação.
- W4: testes isolados de livros, perfil e afinidade, testes existentes, verificação de arquivos e build passaram.
- W5: `app.js` não contém templates de livros, autores, glossário ou renderizadores do resultado de afinidade; extração do estado de UI e separação do CSS ainda estão pendentes.

### Rodada 4: dados editoriais e curadoria

**Status:** implementada; dados separados por dominio e validados no check.

Objetivo:
- Tornar a curadoria mais facil de manter e expandir.

Melhorias:
- Separar `site-data.js` em arquivos por dominio: livros, autores, glossario, temas.
- Criar validação de schema no `scripts/check.mjs`.
- Adicionar IDs estaveis e campos obrigatorios documentados.
- Criar checklist de licencas para imagens novas.
- Incluir status editorial: rascunho, revisado, publicado.

Checagem em W:
- W1-W2: dominios e campos obrigatorios documentados em `docs/CONTRATO-DADOS-EDITORIAIS.md`.
- W3: livros, autores, glossario, temas e trilhas separados em `data/`; `site-data.js` mantido como barrel compatível.
- W4: `scripts/check.mjs` valida campos, IDs estaveis/unicos, status e referencias de livros nas trilhas; itens nao publicados sao filtrados da interface.
- W5: status `rascunho`, `revisado` e `publicado`, alem do checklist para imagens, documentados; testes automatizados, check de estrutura/schema e build passaram.

### Rodada 5: busca e recomendacao

**Status:** implementada; relevancia, deduplicacao, origem e explicacao do Oraculo verificadas.

Objetivo:
- Melhorar qualidade de resultados e explicabilidade.

Melhorias:
- Mostrar origem do resultado: Open Library, cache local ou curadoria.
- Evitar duplicatas por titulo/autor.
- Melhorar ranking local por titulo, autor, tema e trilha.
- Tornar o Oraculo mais explicavel: "por que recebi esta trilha".
- Adicionar trilhas salvas ou historico de recomendacoes.

Checagem em W:
- W1-W2: ranking deterministico prioriza titulo exato/parcial, depois autor e temas; edicoes do mesmo titulo/autor sao deduplicadas.
- W3: origem do catalogo indicada como Open Library ou cache local; curadoria identificada separadamente. Oraculo explica os sinais positivos da trilha escolhida.
- W4: historico local mantem ate cinco recomendacoes e permite restaurar respostas. Testes automatizados, check, build e validacao no navegador passaram; a busca sem rede identificou os resultados do cache local.
- W5: pesos iniciais cobertos por testes deterministas; revisar apos uso real e novos dados de relevancia.

### Rodada 6: PWA, performance e offline

Objetivo:
- Fazer o modo offline parecer confiavel, nao acidental.

Melhorias:
- Pagina/estado dedicado para offline.
- Botao "baixar trilha inicial" para cachear curadoria.
- Revisao de estrategia cache-first vs stale-while-revalidate.
- Versao de cache automatizada pelo build.
- Compressao/minificacao simples no build se necessario.

Checagem em W:
- W1: definir o que deve funcionar sem rede.
- W2: desenhar estrategia por tipo de recurso.
- W3: ajustar `sw.js` e build.
- W4: testar primeira visita, segunda visita, offline e cache antigo.
- W5: documentar comportamento esperado.

### Rodada 7: infraestrutura e deploy

Objetivo:
- Separar site estatico, backend e dados com clareza.

Melhorias:
- Documentar arquitetura de producao: GitHub Pages + backend Node.
- Criar variaveis obrigatorias para backend (`BOSQUE_JWT_SECRET`, Amazon etc.).
- Adicionar workflow de CI para `npm run check` e `npm run build`.
- Criar checklist pre-deploy.
- Definir ambiente de staging antes de producao.

Checagem em W:
- W1: escolher provedor e restricoes.
- W2: desenhar fluxo de deploy.
- W3: configurar scripts/workflow.
- W4: validar deploy limpo e rollback.
- W5: registrar runbook operacional.

## Checklist pre-commit

- Requisito atualizado em `docs/REQUISITOS-FUNCIONALIDADES.md`.
- Plano da rodada atualizado neste documento.
- Deploy/rollback atualizado em `docs/DEPLOY-RUNBOOK.md` quando mudar publicacao ou backend.
- `npm run check` executado.
- `npm run build` executado quando alterar JS/HTML/PWA.
- Fluxo de login testado se tocar `account-*`, `sw.js` ou backend.
- Cache do service worker versionado se mudar shell essencial.
- README atualizado se mudar forma de rodar, publicar ou configurar.

## Checklist pre-producao

- Branch limpa antes do push.
- Commit com mensagem clara.
- Sem `.env`, `backend/data`, `backend/uploads` ou `dist` no Git.
- GitHub Pages publicado na branch correta.
- Link de producao aberto apos deploy.
- Teste manual: login/cadastro, busca, oraculo, favoritos e offline basico.
