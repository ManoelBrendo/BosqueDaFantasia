# Diagnóstico e atualização — etapas 1 e 2

Data: 10/09/2026.

## Escopo e referência

Projeto estático com quatro páginas principais, módulos JavaScript, IndexedDB e service worker. Backend Node opcional para autenticação e arquivos, com armazenamento JSON. A busca de livros chama a Open Library diretamente; não depende do backend de contas.

Referência técnica: https://openlibrary.org/dev/docs/api/search . O filtro language:eng seleciona obras com edição inglesa; lang=en influencia a seleção. O título do work não comprova o idioma da edição, por isso a normalização usa editions.title e editions.language e sinaliza metadados ausentes.

## Achados priorizados

| Prioridade | Achado | Resultado |
|---|---|---|
| Alta | Ficha aceitava qualquer livro salvo na sessão, ignorando o ID do link | Corrigido: valida ID e resolve links diretos; livro inexistente tem estado próprio |
| Alta | Título inglês podia usar capa e link de outra edição | Corrigido: edição identificada fornece título, capa e link; usa placeholder se não houver capa |
| Alta | Arquivos internos acessíveis pelo servidor estático | Corrigido: fronteira de arquivos públicos compartilhada entre front e back |
| Alta | Pesquisa anterior podia sobrescrever resultados novos | Corrigido no catálogo e no fluxo da página inicial |
| Média | Voltar da ficha perdia consulta, filtros e páginas carregadas | Corrigido: URL e snapshot de sessão de até 30 minutos |
| Média | Ordenação descartava os livros já carregados | Corrigido: ordenação local explícita, sem nova requisição |
| Média | Falha online mostrava curadoria sem relação com a consulta | Corrigido: erro explícito, retry ou resultados locais identificados |
| Média | Token malformado podia provocar erro interno | Corrigido: valida formato, assinatura e expiração antes de aceitar |
| Média | Arquivos ausentes retornavam HTML e status 200 | Corrigido: 404 real; URL malformada recebe 400 |
| Média | Service worker podia apagar caches de outras aplicações e manter pesquisa desatualizada | Corrigido: remoção limitada ao Bosque; JSON de busca deixa de usar cache paralelo do SW |
| Média | Login permitia reenvio e mensagem de sucesso mencionava nível Master | Corrigido: valida formulário, bloqueia duplicação e usa mensagem neutra |

## Política de pesquisa implementada

- Interface em português; título da edição inglesa quando identificado pelos metadados.
- Sem comprovação de título inglês: título do catálogo acompanhado de aviso, sem tradução inventada.
- Mapeamento de títulos portugueses conhecidos da curadoria e obras populares. Não é tradução universal; o catálogo também pode reconhecer outros termos.
- Filtros de autor, intervalo da primeira publicação e leitura disponível aplicados à consulta remota.
- Ordenação por relevância ou A–Z apenas sobre livros carregados, preservando a ordem original ao retornar à relevância.
- Resultados de cache offline são identificados. Disponibilidade de leitura não representa uma determinação jurídica de domínio público.
- Paginação avança após sucesso; IDs duplicados são eliminados; timeout de 15 segundos e cancelamento preservados.
- IDs e links de retorno são validados; links de catálogo externo usam HTTPS e hosts permitidos.

## Verificações

- Testes de regressão de idioma, edição/capa/link, aliases, filtros, cancelamento, tokens e fronteira pública.
- Edge automatizado com respostas simuladas da Open Library: pesquisa, filtros, paginação, ordenação, ficha, retorno, ID inválido, resultados vazios e falha com retry.
- Quatro páginas em 320, 375, 390, 768 e 1440 pixels: sem overflow horizontal e sem exceções JavaScript nos cenários executados.
- Capturas de referência em artifacts/qa, excluídas do build e do Git.
- Verificação de referências e build estático. Backend e arquivos locais de ambiente ficam fora do build público.

## Limites e próximos itens

- A consulta real à Open Library falhou por conectividade neste ambiente. Metadados, capas externas e qualidade real do ranking precisam de teste com a API disponível.
- O teste responsivo não equivale à validação em aparelhos físicos, leitores de tela ou todos os navegadores.
- A conta em 4173 continua local por padrão; em 4180 utiliza o backend. Não houve migração de contas nesta etapa.
- Prioridade alta antes de produção: substituir o acesso local Master embutido por uma política de autenticação e autorização apropriada. A interface local não constitui controle de acesso ao servidor.
- Prioridade média: revisar concorrência de gravação do banco JSON, uploads e recuperação de conta na etapa de backend. Não foram feitas alterações em contas existentes.
- Unificar visual de login, página inicial e catálogo e reduzir a distância entre pesquisa e resultados no mobile na etapa 3.

## Executar

Na pasta siteDeFantasia-main:

- npm.cmd run dev — frontend em http://127.0.0.1:4173
- npm.cmd run api — backend e site em http://127.0.0.1:4180
- npm.cmd test — regressões sem depender da Open Library
- npm.cmd run check — referências locais
- npm.cmd run build — build público em dist
- npm.cmd run test:browser — requer Playwright e Microsoft Edge; PLAYWRIGHT_MODULE permite indicar um módulo Playwright já instalado.

Usar npm.cmd evita a restrição de execução do npm.ps1 no PowerShell deste computador.
