# Atualização visual e mobile — etapas 3 e 4

Data: 10/09/2026.

## Resultado

As quatro páginas usam uma identidade comum: verde profundo, dourado, texto claro e títulos em fonte serifada. As bases de cor, tipografia, espaçamento e componentes estão em assets/design-system.css; o refinamento anterior permanece em assets/site-polish.css. O comportamento compartilhado de navegação e acessibilidade está em assets/js/site-ui.js.

## Mudanças por página

- Início: chamada mais direta, formulário de busca que leva ao catálogo, hierarquia simplificada e ilustração SVG local como reserva para a imagem externa do carrossel. Funções existentes de perfil, autores, glossário e estante foram preservadas.
- Catálogo: resultados antes dos temas, pesquisa em largura útil, filtros em painel expansível com indicação dos filtros ativos e cartões compactos no celular. A política de títulos em inglês permanece.
- Livro: retorno aos resultados preservado, capa proporcional, título/autor/edição em destaque, resumo e ação de consulta identificados.
- Login: identidade integrada, navegação de volta ao acervo, formulário com preenchimento automático, validação e controle para mostrar/ocultar senha.
- Cabeçalho e rodapé comuns nas quatro páginas; indicação da página atual e navegação mobile com links reais disponíveis mesmo sem JavaScript.

## Acessibilidade e mobile

- Link de pular para o conteúdo, região principal focável e foco visível.
- Menu abre por botão com aria-expanded; fecha por Escape, navegação e clique externo; ao mudar para desktop, links voltam a aparecer.
- Filtros usando details/summary nativos, acessíveis por teclado.
- Campos visíveis com rótulos; correção do campo de pesquisa do glossário.
- Diálogo de acesso com identificação, botão de fechar, isolamento do conteúdo de fundo e ciclo de foco. Escape fecha e restaura o foco anterior.
- Painel da conta fechado fica fora da navegação por teclado.
- Controles do carrossel com área de 44 × 44 pixels; campos mobile com fonte mínima de 16 pixels.
- Preferência por movimento reduzido respeitada. Cursor decorativo e indicador flutuante de seção removidos; efeitos de fantasia ficam restritos à página inicial.
- Layouts adaptados de 320 a 1440 pixels; sem esconder overflow horizontal como solução de layout nas páginas atualizadas.

## Validação

- npm.cmd run test:browser: regressões de pesquisa, filtros, paginação, ordenação, retorno, erro e offline; quatro páginas em 320, 375, 390, 768 e 1440 pixels.
- npm.cmd run test:accessibility: teclado, skip link, menu e seus breakpoints, rótulos, senha, filtros, movimento reduzido e foco do diálogo.
- Capturas de tela desktop/mobile em artifacts/qa; imagens inspecionadas durante a revisão visual.
- npm.cmd test e npm.cmd run check; build público via npm.cmd run build.

Os testes de navegador usam Microsoft Edge e um Playwright instalado (ou indicado por PLAYWRIGHT_MODULE). A Open Library é simulada nesses testes para manter resultados determinísticos; isso não certifica disponibilidade da API real, capas externas ou todos os metadados. A validação não é uma certificação WCAG nem substitui testes em aparelhos físicos e leitores de tela.

## Próximas etapas

Biblioteca pessoal, sincronização de contas, revisão de autenticação de produção e persistência permanecem no escopo das etapas 5 e 6. Nenhuma conta existente foi migrada ou apagada nesta atualização.
