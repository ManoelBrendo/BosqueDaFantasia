# Levantamento de melhorias de alto impacto

Este levantamento identifica evolucoes que podem mudar de forma perceptivel a utilidade, a continuidade e a capacidade de evolucao do Bosque da Fantasia. As propostas foram comparadas com o que ja existe em `README.md`, `docs/REQUISITOS-FUNCIONALIDADES.md`, `docs/PLANO-MELHORIAS-W.md` e na implementacao atual.

**Escopo:** recomendacoes para o produto como um todo; nenhuma funcionalidade deste documento foi implementada nesta rodada. A prioridade considera impacto para leitores e editores, risco operacional e dependencias entre as entregas.

## Resumo executivo

As maiores oportunidades sao transformar a conta em uma experiencia realmente continua entre dispositivos, permitir que a curadoria cresca sem edicao manual de arquivos e preparar o backend para guardar dados de usuarios de forma confiavel. A sequencia recomendada e primeiro estabelecer persistencia e operacao seguras, depois sincronizar a biblioteca pessoal e disponibilizar ferramentas editoriais.

| Prioridade | Melhoria | Impacto esperado | Esforco relativo | Dependencia |
| --- | --- | --- | --- | --- |
| P0 | Persistencia transacional e rotina de backup | Reduz risco de perda/corrupcao de dados e libera evolucao do backend | Alto | Hospedagem do backend e banco a definir |
| P1 | Biblioteca pessoal sincronizada na conta | Mantem favoritos e leitura entre dispositivos, com continuidade online/offline | Alto | P0 e contrato de conta remota |
| P1 | Painel editorial com rascunho e publicacao | Permite ampliar e corrigir a curadoria sem editar arquivos JavaScript | Alto | P0 e rotas administrativas autorizadas |
| P1 | Ciclo de vida completo da conta | Reduz abandono e suporte por conta inacessivel ou cadastro nao confirmado | Medio/alto | Servico de e-mail e politica de privacidade |
| P2 | Descoberta guiada com feedback do leitor | Torna busca e recomendacao mais pessoais e ajuda a escolher a proxima leitura | Medio | Biblioteca pessoal |
| P2 | Qualidade continua de ponta a ponta | Detecta regressao antes de publicar e torna releases mais previsiveis | Medio | Pipeline de CI e ambiente de teste |

## 1. Persistencia transacional e operacao do backend — P0

**Por que faz diferenca:** a API atualmente persiste contas e arquivos em `backend/data/bosque-db.json`. As atualizacoes sao serializadas dentro de um processo, mas o proprio guia do backend alerta que esse armazenamento nao oferece transacoes entre processos, multiplas instancias ou backup automatico. Isso limita a confiabilidade de qualquer sincronizacao futura e torna expansao de uso arriscada.

**Escopo sugerido:**
- Migrar usuarios, metadados/bytes de arquivos e futuras bibliotecas pessoais para PostgreSQL com migracoes versionadas.
- Preservar IDs, papeis e hashes de senha; validar a migracao em copia do banco e preparar procedimento de retorno.
- Definir politica automatizada de backup, retencao e teste periodico de restauracao.
- Documentar ambientes, variaveis, limites e alertas operacionais.

**Aceite:** migracao repetivel e testada; dados e papeis preservados; falha durante migracao nao apaga a origem; backup restaurado em ambiente isolado; escrita/leitura validada com mais de uma sessao e apos reinicio do servico.

**Progresso local:** Railway foi escolhido como alvo. A API reconhece `PORT`, usa bind publico em producao, exige `DATABASE_URL`, possui armazenamento transacional com migracoes de schema e o importador legado preserva a origem e nao sobrescreve um destino com dados. O health check agora confirma a conectividade PostgreSQL.

**Pendente para concluir:** provisionar Railway/PostgreSQL, executar a importacao com copia de seguranca, ativar backups agendados, testar restauracao isolada e validar deploy/health no servico real. Hospedar o dominio do site, por si so, nao fornece necessariamente hospedagem de API ou banco.

## 2. Biblioteca pessoal sincronizada — P1

**Por que faz diferenca:** o relicario, status de leitura e trilhas recentes sao salvos no IndexedDB do navegador. A conta remota autentica usuarios, mas nao sincroniza esses dados; trocar de aparelho ou navegador significa recomecar.

**Escopo sugerido:**
- Associar favoritos e status (`quero ler`, `lendo`, `lido`) a um usuario autenticado no servidor.
- Manter a experiencia local sem conta e definir claramente o que fica apenas neste dispositivo.
- Sincronizar quando houver conexao e enfileirar alteracoes offline para envio posterior.
- Definir conflitos com regra simples e visivel (por exemplo, alteracao mais recente por item), alem de importacao da biblioteca local ao entrar na conta pela primeira vez.
- Apresentar estados de sincronizacao, erro e modo somente local; nunca sinalizar sincronizacao concluida antes da confirmacao do servidor.

**Aceite:** mesma conta apresenta os mesmos itens em dois navegadores; alteracoes offline convergem apos reconexao; repeticao de requisicao nao duplica itens; sessao expirada e API indisponivel nao apagam dados locais; usuario pode exportar ou remover sua biblioteca.

## 3. Painel editorial com fluxo de publicacao — P1

**Por que faz diferenca:** os dados editoriais estao separados por dominio e contam com validacao de schema, mas a manutencao ainda depende de alterar arquivos do projeto. A autorizacao de administrador esta estabelecida no backend, porem as rotas administrativas de produto ainda nao existem.

**Escopo sugerido:**
- Criar operacoes administrativas explicitas para livros, autores, temas, trilhas e glossario, sempre protegidas no backend.
- Oferecer formulario com campos obrigatorios, validacao de referencias e preview antes de publicar.
- Separar rascunho de conteudo publico e manter historico minimo de alteracoes, autor e data.
- Importar/exportar os dados atuais para facilitar transicao e revisao editorial.
- Comecar com um MVP somente para os registros editoriais mais alterados; evitar construir um CMS generico.

**Aceite:** leitor nao consegue criar, editar ou publicar conteudo; editor autorizado pode salvar rascunho, visualizar preview e publicar; registros invalidos nao entram no catalogo; dados atuais sao importados sem perda e exportados em formato documentado.

## 4. Ciclo de vida completo da conta — P1

**Por que faz diferenca:** cadastro e login remoto existem, mas o backend e a documentacao ainda nao oferecem recuperacao de conta. Sem um caminho de recuperacao, uma senha esquecida pode tornar a conta inacessivel, especialmente depois que a biblioteca for sincronizada.

**Escopo sugerido:**
- Confirmar e-mail antes de habilitar recursos que dependam de identidade recuperavel.
- Implementar redefinicao de senha com token de uso unico, prazo curto e resposta que nao revele se um e-mail esta cadastrado.
- Permitir revogar sessoes apos troca de senha e orientar sobre sessao expirada.
- Registrar a ultima atividade autenticada e excluir contas remotas apos dois meses sem uso, junto com os dados privados vinculados; o modo local sem cadastro permanece intacto.
- Definir retencao, exclusao de conta, exportacao de dados e comunicacao de privacidade antes de coletar dados adicionais.

**Aceite:** fluxo de confirmacao e redefinicao testado com token invalido, expirado e reutilizado; tokens nao aparecem em logs; conta remota sem atividade por dois meses e removida junto com seus dados privados; conta ativa e conta local nao sao apagadas; usuario consegue excluir sua conta e recebe confirmacao clara do que foi removido.

## 5. Descoberta guiada com feedback do leitor — P2

**Por que faz diferenca:** ja existem pesquisa, filtros e recomendacao por afinidade. O proximo ganho nao e adicionar mais filtros por si so, mas ajudar o leitor a transformar resultados em uma decisao e permitir que a recomendacao aprenda com escolhas explicitas.

**Escopo sugerido:**
- Permitir marcar uma recomendacao como relevante ou nao e usar essa resposta para ajustar futuras sugestoes.
- Explicar em linguagem simples por que cada obra apareceu (tema, atmosfera, nivel de leitura ou trilha).
- Dar continuidade a uma jornada: sugerir proxima leitura a partir do que o leitor marcou como lido ou favorito.
- Manter recomendacoes editoriais utilizaveis sem conta e sem depender de telemetria invasiva.

**Aceite:** cada recomendacao apresenta motivos compreensiveis; feedback negativo reduz sugestoes equivalentes na sessao seguinte; os resultados continuam disponiveis sem login; nenhuma informacao pessoal e enviada a servico externo sem consentimento.

## 6. Qualidade continua de ponta a ponta — P2

**Por que faz diferenca:** o projeto ja possui testes de busca, autenticacao, renderizacao, schema e navegacao/accessibilidade. O ganho esta em executar verificacoes de forma consistente antes de publicar e cobrir os fluxos que dependem de API, offline e persistencia.

**Escopo sugerido:**
- Executar `npm run check`, `npm test` e `npm run build` em cada pull request.
- Rodar `npm run test:e2e` em ambiente controlado para busca, login, biblioteca, falha da API, offline, acessibilidade e telas estreitas; validar no Brave oficialmente suportado.
- Manter teste de acessibilidade focado em teclado, rotulos, dialogos e contraste nas paginas principais.
- Guardar artefatos e logs de falha no pipeline, sem incluir dados de usuarios ou segredos.
- Executar smoke test pos-deploy para a pagina publicada e `/api/health`, se `BOSQUE_API_HEALTH_URL` estiver configurada.

**Aceite:** pull request nao pode ser integrada com verificacoes obrigatorias falhando; testes sao repetiveis em ambiente limpo; falha identifica pagina/cenario; nenhum teste depende de conta real ou chave de servico externo.

## Sequencia de implementacao sugerida

1. **Fundacao:** escolher hospedagem e banco; preparar migracao e restauracao de backup (P0).
2. **Valor para o leitor:** sincronizar biblioteca pessoal e fechar exportacao/exclusao dos dados (P1).
3. **Escala editorial:** implementar rotas autorizadas e painel editorial com rascunho/publicacao (P1).
4. **Confianca da conta:** confirmacao de e-mail e recuperacao de acesso, antes de promover a conta como armazenamento confiavel (P1).
5. **Evolucao da descoberta:** validar feedback e explicacao das recomendacoes com leitores antes de ampliar o motor (P2).
6. **Entrega sustentavel:** automatizar verificacoes no CI e smoke test de deploy (P2; pode iniciar junto a etapa 1).

## Decisoes recebidas e pendencias

| Tema | Decisao registrada | Consequencia para o trabalho |
| --- | --- | --- |
| Hospedagem e banco | Railway escolhido para API e PostgreSQL. | Provisionar os servicos e `DATABASE_URL`; validar migracao, backups, restauracao isolada e health check antes de usar contas reais. |
| Conta e biblioteca | O modo local continua sem cadastro. Quando hospedado, contas remotas exigem e-mail valido e, se viavel, confirmacao por codigo enviado ao e-mail. | Manter a conta local independente; confirmar o endereco antes de habilitar a conta remota. Definir como usuarios atuais entram nesse fluxo antes do lancamento. |
| Administracao editorial | O proprietario do projeto sera o administrador/editor inicial e usara um endereco Gmail. | Nao gravar o e-mail pessoal em codigo ou documentacao publica. Provisionar a conta por configuracao operacional segura e permitir somente papeis explicitamente autorizados no servidor. |
| Mensagens transacionais | Ainda nao foi escolhido o servico que enviara codigos de confirmacao aos enderecos dos usuarios. | A preferencia por um endereco Gmail para o administrador nao define o remetente do site. Escolher e testar um servico de envio antes de implementar confirmacao por codigo; nunca colocar senha de e-mail no frontend ou repositorio. |
| Retencao de contas | Contas remotas DEVEM ser excluidas apos dois meses sem uso. | Requisito obrigatorio pendente de implementacao na etapa de ciclo de vida da conta. Apagar tambem dados privados vinculados; o modo local sem cadastro nao e afetado. |
| CI e navegadores | Preferencia por manter o CI no GitHub; Brave e o navegador oficialmente suportado. | GitHub Actions executa `npm run check`, `npm test`, `npm run test:e2e` e `npm run build`; testes de navegador e acessibilidade rodam no Brave e capturas ficam como artefato por sete dias. O deploy do Pages verifica o site e pode testar `/api/health` quando `BOSQUE_API_HEALTH_URL` estiver configurada nas variaveis do repositorio. |

### Recomendacao inicial de hospedagem (ainda nao aprovada)

- **Site e dominio:** manter o frontend estatico no GitHub Pages e apontar o dominio proprio por DNS. GitHub Pages aceita dominios personalizados, mas nao hospeda a API Node nem o banco.
- **API e banco:** avaliar primeiro Railway para publicar a API Node e PostgreSQL no mesmo projeto, com `DATABASE_URL` entre servicos. A documentacao descreve PostgreSQL de no unico por padrao; backups e alta disponibilidade precisam ser configurados conforme o plano e a necessidade. O plano Hobby publicado atualmente e US$ 5 por mes com US$ 5 em uso incluido, sujeito a cobrancas por consumo e a mudancas de preco.
- **Alternativa:** Render tambem documenta deploy de servicos Node e PostgreSQL gerenciado. Comparar custo total, politica de suspensao, backups, limites e regiao antes de decidir.
- **CI:** GitHub Actions e a escolha mais direta para executar os scripts existentes a cada pull request, sem mover o repositorio.

**Adaptacoes obrigatorias antes de publicar:** a API atual usa `BOSQUE_API_HOST`/`BOSQUE_API_PORT` e por padrao escuta em `127.0.0.1`; deve aceitar a porta e o bind exigidos pelo provedor. O armazenamento JSON e uploads em disco local nao devem ser tratados como banco/armazenamento persistente de producao. A migracao precisa incluir PostgreSQL, estrategia para arquivos, migracoes de schema, backup e teste de restauracao. Nada foi implantado nem conectado a um provedor.

Fontes oficiais consultadas:
- [Dominios personalizados no GitHub Pages](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site)
- [PostgreSQL no Railway](https://docs.railway.com/databases/postgresql)
- [Precos do Railway](https://railway.com/pricing)
- [Deploy de aplicacao Node no Render](https://render.com/docs/deploy-node-express-app)
- [PostgreSQL no Render](https://render.com/docs/postgresql)

### Pontos ainda pendentes antes de implementar

1. Qual servico enviara os codigos de confirmacao e como serao guardadas as credenciais de envio?
2. A confirmacao de e-mail sera obrigatoria para toda conta remota ou apenas antes de habilitar sincronizacao e recuperacao de conta?
3. Antes de automatizar a exclusao, confirmar se a politica se aplica tambem a contas administrativas; definir atividade como login bem-sucedido ou qualquer requisicao autenticada e se "dois meses" significa meses de calendario.

As demais decisoes permitem avancar sem escolher hospedagem imediatamente. A automacao de CI no GitHub pode ser tratada como uma entrega independente; a validacao oficial do navegador deve executar no Brave, nao apenas presumir equivalencia por usar Chromium.

## Fora do escopo imediato

- Reescrever o frontend ou trocar todas as fontes de catalogo de uma vez.
- Criar funcionalidades administrativas antes de concluir e testar autorizacao e persistencia.
- Sincronizar dados sem estrategia de conflito, exportacao e exclusao.
- Adicionar dependencias de animacao ou recursos visuais que prejudiquem carregamento e acessibilidade.

## Levantamento complementar: melhorias exclusivas de frontend

Esta secao complementa as propostas de produto acima com oportunidades que podem ser trabalhadas no site sem depender de novas rotas ou mudancas no backend. O frontend ja tem uma base relevante: busca com filtros e ordenacao, paginacao, preservacao do contexto do catalogo, estados de erro, suporte offline, navegacao por teclado e testes em larguras moveis. As propostas abaixo ampliam essa base em vez de substituir funcionalidades existentes.

| Prioridade | Melhoria | Impacto esperado | Esforco relativo | Dependencia |
| --- | --- | --- | --- | --- |
| P1 | Recuperacao visual de capas indisponiveis | Evita imagens quebradas e mantem os cartoes e fichas legiveis quando todas as fontes de capa falham | Baixo | Nenhuma; reutilizar o fallback visual existente |
| P1 | Refinar busca sem resultados e filtros ativos | Ajuda o leitor a recuperar a pesquisa sem ter de apagar todos os criterios ou recomecar | Medio | Busca e filtros atuais |
| P1 | Auditoria de acessibilidade WCAG nas paginas principais | Identifica problemas de contraste e ampliacao que os testes atuais de teclado e rotulos nao cobrem por completo | Medio | CI e navegadores ja existentes |
| P2 | Atualizacao do app instalado e frescor offline | Explica quando o conteudo esta salvo, desatualizado ou pronto para atualizar sem interromper a leitura | Medio | Service worker existente |
| P2 | Comparacao visual automatizada entre releases | Detecta regressao de layout e estilo que testes funcionais nao identificam | Medio | Capturas Playwright ja existentes |
| P2 | Preferencias visuais locais | Permite adaptar tamanho do texto e contraste, persistindo as escolhas apenas no dispositivo | Medio | Design system compartilhado |
| P3 | Melhorar compartilhamento das fichas de livros | Faz com que links de obras tenham titulo e resumo mais claros ao serem compartilhados | Baixo | Metadados editoriais atuais |

### 1. Recuperacao visual de capas indisponiveis — P1

**Observacao:** os cartoes do catalogo e a ficha da obra tentam fontes alternativas de capa, mas, quando todas falham, apenas desativam o manipulador de erro. A imagem permanece com falha visual.

**Escopo sugerido:**
- Exibir uma capa neutra do Bosque quando nenhuma fonte de imagem funcionar.
- Manter dimensoes e proporcao fixas para evitar saltos no layout durante o carregamento.
- Diferenciar imagem decorativa de capa informativa e manter texto alternativo util.
- Usar a mesma estrategia no catalogo, na pagina de detalhes e nos destaques da pagina inicial.

**Aceite:** bloquear ou invalidar todas as URLs de capa em teste deixa um fallback visivel, sem erro de imagem, deslocamento de layout ou perda do titulo/autor.

### 2. Refinar busca sem resultados e filtros ativos — P1

**Observacao:** o catalogo informa que nao encontrou obras e sugere alterar a pesquisa ou remover filtros, mas nao oferece uma acao contextual para remover cada criterio ativo ou explorar consultas proximas.

**Escopo sugerido:**
- Mostrar filtros ativos como etiquetas removiveis individualmente, alem da acao de limpar tudo.
- Preservar os criterios que ainda fazem sentido ao remover uma etiqueta.
- No estado vazio, oferecer sugestoes simples e deterministicas baseadas na consulta ou tema atual, sem enviar dados do leitor para servicos de analise.
- Anunciar a atualizacao do numero de resultados para tecnologias assistivas sem tornar cada cartao uma regiao de anuncio.

**Aceite:** leitor consegue remover um filtro sem perder os demais, entender por que nao ha resultados e iniciar uma alternativa; URL, controles e resultados permanecem sincronizados.

### 3. Auditoria de acessibilidade WCAG nas paginas principais — P1

**Observacao:** os testes existentes cobrem navegacao por teclado, skip links, rotulos de formularios, menu, dialogo e movimento reduzido. Ainda vale medir contraste, ampliacao e comportamento em configuracoes de acessibilidade do sistema.

**Escopo sugerido:**
- Auditar contraste de texto, controles, estados de foco, erros e componentes desabilitados nas paginas inicial, acervo, detalhes e login.
- Validar ampliacao de texto a 200% e zoom de pagina a 400% sem perda de operacoes ou rolagem horizontal desnecessaria.
- Verificar preferencias de movimento reduzido, alto contraste/cores forcadas e navegacao com leitor de tela nos fluxos mais usados.
- Corrigir tokens compartilhados do design system antes de adicionar excecoes locais.

**Aceite:** fluxos principais permanecem operaveis por teclado e leitor de tela; texto normal atende contraste WCAG AA de 4,5:1 e texto grande/elementos graficos atende os criterios aplicaveis; resultados e excecoes ficam cobertos por testes ou roteiro manual reproduzivel.

### 4. Atualizacao do app instalado e frescor offline — P2

**Observacao:** o site ja registra um service worker, guarda o app shell e comunica a disponibilidade do modo offline. A atualizacao do service worker e imediata, sem uma mensagem de interface que explique quando uma nova versao esta pronta.

**Escopo sugerido:**
- Avisar quando uma nova versao do app estiver pronta e oferecer atualizacao em um momento escolhido pelo leitor.
- Nao recarregar automaticamente enquanto houver uma busca, formulario ou leitura em andamento.
- Tornar visivel quando os resultados sao locais e podem estar desatualizados, incluindo uma acao clara para tentar atualizar quando houver rede.
- Explicar o estado da conexao com mensagens consistentes entre pagina inicial, catalogo e conta.

**Aceite:** teste controlado com duas versoes do service worker mostra o aviso da nova versao; aceitar atualiza sem deixar a interface em estado inconsistente; recusar mantem a leitura atual; modo offline nao e apresentado como sincronizacao de dados.

### 5. Comparacao visual automatizada entre releases — P2

**Observacao:** o Playwright ja gera capturas para paginas e larguras selecionadas, mas as capturas sao artefatos para inspecao, nao comparacoes automaticas com uma referencia aprovada.

**Escopo sugerido:**
- Escolher poucos estados estaveis e representativos: pagina inicial, catalogo com resultados, catalogo vazio, detalhe e login.
- Comparar desktop e mobile no navegador oficialmente suportado, mascarando areas dinamicas justificadas.
- Atualizar referencias apenas em mudancas visuais intencionais e revisadas.
- Evitar tolerancias tao amplas que escondam regressao de layout.

**Aceite:** uma alteracao visual inesperada em componente compartilhado falha com imagem comparativa clara; variacoes de fonte/ambiente sao controladas e a suite permanece repetivel no CI.

### 6. Preferencias visuais locais — P2

**Oportunidade:** oferecer controles explicitos para tamanho de texto e contraste reforcado, complementando o suporte atual a movimento reduzido do sistema operacional.

**Escopo sugerido:**
- Disponibilizar controles simples e reversiveis, sem criar temas numerosos ou opcoes redundantes.
- Persistir preferencias apenas no navegador e aplica-las por tokens CSS compartilhados.
- Respeitar as preferencias do sistema por padrao e nao reduzir contraste ao trocar tamanho ou tema.
- Tornar a interface utilizavel quando armazenamento local estiver indisponivel.

**Aceite:** preferencias sobrevivem a navegacao e recarregamento no mesmo dispositivo, podem ser restauradas ao padrao e nao causam overflow nas larguras testadas.

### 7. Melhorar compartilhamento das fichas de livros — P3

**Observacao:** a pagina de detalhes apresenta informacoes e links externos, mas pode ser mais clara quando aberta diretamente ou compartilhada fora do site.

**Escopo sugerido:**
- Definir descricao e metadados sociais a partir da obra carregada, sem incluir conteudo nao verificado.
- Oferecer um comando para copiar o link da ficha e confirmar o resultado com uma mensagem acessivel.
- Manter um comportamento de fallback quando a API ou a API de compartilhamento do navegador nao estiver disponivel.

**Aceite:** link copiado abre a mesma obra; metadados usam titulo, autor e descricao da ficha; falhas de permissao sao comunicadas e nao impedem a navegacao.

**Progresso das prioridades altas e da atualizacao offline (26/10/2026):** o fallback visual de capas foi integrado aos destaques, catalogo e ficha da obra; os estados vazios do catalogo agora oferecem rotas tematicas e remocao individual/contextual de filtros; e a verificacao automatizada inicial de acessibilidade foi ampliada para contraste AA dos tokens e campos de filtro, operacao por teclado e reflow a 320 px. A atualizacao do service worker agora aguarda uma acao explicita do leitor e so recarrega a pagina depois da ativacao da nova versao. A validacao manual com leitor de tela e ampliacao real de texto/zoom continua recomendada para completar a auditoria WCAG.

## Sequencia recomendada para o frontend

1. **Entrega pequena e verificavel:** fallback consistente de capas, cobrindo os pontos de renderizacao compartilhados.
2. **Descoberta no catalogo:** etiquetas de filtros removiveis e estados vazios com alternativas contextuais.
3. **Acessibilidade:** auditoria de contraste, ampliacao e tecnologia assistiva; ajustar tokens e ampliar os testes.
4. **Confianca offline:** aviso de atualizacao do app e estados de frescor dos dados.
5. **Qualidade visual:** comparacao automatizada de um conjunto reduzido de paginas/estados antes de aumentar a cobertura.
6. **Personalizacao e compartilhamento:** preferencia local de leitura e metadados das fichas, apos validar o ganho com leitores.

As etapas 1 a 3 podem ser iniciadas sem decisao de produto ou alteracao de backend. As preferencias visuais devem ser prototipadas antes de ampliar o escopo; a comparacao visual depende de selecionar e aprovar capturas de referencia.
