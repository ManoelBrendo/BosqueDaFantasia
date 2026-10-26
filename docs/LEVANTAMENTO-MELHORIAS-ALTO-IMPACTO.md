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
- Rodar testes de navegador em ambiente controlado para busca, login, biblioteca, falha da API, offline e telas estreitas.
- Manter teste de acessibilidade focado em teclado, rotulos, dialogos e contraste nas paginas principais.
- Guardar artefatos e logs de falha no pipeline, sem incluir dados de usuarios ou segredos.
- Adicionar um smoke test pos-deploy para paginas principais e `/api/health`, se o backend estiver publicado.

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
| CI e navegadores | Preferencia por manter o CI no GitHub; Brave e o navegador oficialmente suportado. | GitHub Actions agora executa `npm run check`, `npm test` e `npm run build` antes do deploy do Pages. Seguem pendentes testes de navegador para os fluxos de API/offline e validacao com Brave real; teste apenas em Chromium nao comprova sozinho compatibilidade com Brave. |

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
