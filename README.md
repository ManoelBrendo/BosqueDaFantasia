# Bosque da Fantasia

Aplicacao web estatica com atmosfera elfica, mitologia celta, acervo pesquisavel, recomendacao por afinidade, glossario, fichas editoriais e modo offline.

## Publicar no GitHub Pages

1. Crie um repositorio no GitHub.
2. Envie os arquivos deste projeto para a raiz do repositorio.
3. No GitHub, abra `Settings`.
4. Entre em `Pages`.
5. Em `Build and deployment`, escolha:
   - `Source`: `Deploy from a branch`
   - `Branch`: `main`
   - `Folder`: `/ (root)`
6. Salve.
7. Aguarde o GitHub gerar o link publico.

## Rodar com Node

1. Abra um terminal na pasta do projeto.
2. Rode `npm run check` para validar a estrutura.
3. Rode `npm run dev` para abrir um servidor local em `http://127.0.0.1:4173`.
4. Rode `npm run build` para gerar uma pasta `dist` pronta para deploy.
5. Se quiser revisar a versao gerada, rode `npm run preview`.
6. Opcional: rode `npm run api` apenas se quiser testar conta centralizada pelo backend local em `http://127.0.0.1:4180`.

Se o terminal ainda nao reconhecer `node` ou `npm`, feche e abra o terminal novamente apos a instalacao do Node.js.

## Arquitetura principal

- `index.html`: shell visual da pagina unica.
- `app.js`: orquestracao principal da experiencia, filtros, glossario, autores, afinidade e fichas.
- `catalog-api.js`: API da aplicacao para consulta ao acervo, com fallback para o banco local.
- `library-db.js`: banco local em IndexedDB para consultas e dados essenciais.
- `open-library-api.js`: cliente de rede da Open Library com enriquecimento editorial.
- `site-data.js`: ponto de compatibilidade que reexporta os dados editoriais por dominio.
- `data/books.js`, `data/authors.js`, `data/glossary.js`, `data/themes.js`: dados editoriais separados; registros com status `rascunho` e `revisado` nao aparecem na interface publica.
- `scripts/site-data-schema.mjs`: contrato e validacao de IDs, campos obrigatorios, status editorial e referencias entre trilhas e livros.
- `docs/CONTRATO-DADOS-EDITORIAIS.md`: campos, regras para IDs e fluxo editorial.
- `recommendation-engine.js`: motor de afinidade do Oraculo.
- `site-config.js`: configuracao publica opcional da URL do backend remoto.
- `pwa.js`: registro do modo instalavel e status PWA.
- `sw.js`: service worker para cache offline.
- `manifest.webmanifest`: manifesto da aplicacao instalavel.
- `bosque-icon.svg`: icone do app.
- `audio-player.js`: player customizado da trilha ambiente com Play/Pause, volume e escolha de faixa.
- `scripts/check.mjs`: validacao automatizada da estrutura do projeto.
- `scripts/dev-server.mjs`: servidor local leve, sem dependencias externas.
- `scripts/build.mjs`: geracao de `dist` para entrega e deploy.
- `docs/REQUISITOS-FUNCIONALIDADES.md`: levantamento de requisitos, funcionalidades e criterios de aceite.
- `docs/PLANO-MELHORIAS-W.md`: plano de melhorias visuais, arquiteturais e de infraestrutura com metodo em W.
- `docs/DEPLOY-RUNBOOK.md`: checklist de deploy, ambientes e rollback.

## O que o projeto entrega

- Modo offline para shell da aplicacao e cache progressivo de acervo, capas e consultas acessadas.
- Banco local para guardar consultas, livros e colecoes essenciais no navegador.
- API da aplicacao em camada separada, desacoplando interface e fonte de dados externa.
- Fallback de busca no banco local quando a rede falha ou o usuario volta offline.
- Fichas editoriais de livros com clima, nivel de leitura, motivos centrais e nota de autor.
- Painel de autores com foco editorial.
- Glossario pesquisavel.
- Filtros avancados por clima, nivel de leitura e motivo central.
- Mapa visual de afinidade para o resultado do Oraculo.
- Relicario pessoal com livros favoritos guardados no proprio navegador.
- Trilhas de pesquisa recentes para retomar a exploracao sem recomecar.
- Fluxo Node leve com validacao, servidor local e build de deploy.

## Observacoes

- O projeto continua sem build e sem dependencias de instalacao.
- O modo offline completo funciona quando o site esta publicado em HTTPS, como no GitHub Pages.
- O login usa modo local no navegador por padrao e nao precisa de API rodando. Para contas centralizadas, publique o backend e configure a origem publica em `site-config.js`.
- A trilha ambiente usa audios abertos do Wikimedia Commons com fontes MP3/OGG, player customizado, controle de volume e opcoes de faixa.
- O audio ambiente e algumas imagens dependem de fontes externas na primeira visita, mas passam a se beneficiar do cache offline depois de acessados.
