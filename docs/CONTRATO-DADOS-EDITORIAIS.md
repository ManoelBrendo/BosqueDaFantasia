# Contrato dos dados editoriais

Os registros de curadoria ficam separados por dominio em `data/`. `site-data.js` permanece como barrel de compatibilidade para que os consumidores atuais possam continuar importando as colecoes publicadas sem conhecer os arquivos internos.

## Colecoes e campos obrigatorios

| Dominio | Arquivo | Campos obrigatorios |
| --- | --- | --- |
| Livros | `data/books.js` | `id`, `editorialStatus`, `title`, `originalTitle`, `author`, `year`, `cover`, `description` |
| Autores | `data/authors.js` | `id`, `editorialStatus`, `name`, `summary`, `bestFor`, `climate`, `works` |
| Glossario | `data/glossary.js` | `id`, `editorialStatus`, `term`, `category`, `short`, `long` |
| Temas | `data/themes.js` | `id`, `editorialStatus`, `label`, `query`, `description` |
| Trilhas | `data/themes.js` | `id`, `editorialStatus`, `name`, `description`, `focusLabel`, `focusQuery`, `bookIds` |

`works` e `bookIds` devem ser arrays nao vazios. Cada livro referenciado em `bookIds` deve existir na curadoria.

## IDs estaveis

- Use IDs unicos, em minusculas e kebab-case ASCII, como `princesa-goblin`.
- O ID e uma referencia persistente usada por favoritos, estado de leitura, trilhas e links locais. Nao o derive do titulo em tempo de execucao nem o altere quando o titulo editorial mudar.
- Antes de criar um registro, verifique os IDs existentes em todas as colecoes editoriais.

## Estado editorial

`editorialStatus` aceita:

- `rascunho`: conteudo em preparacao; nao e exportado para a interface publica.
- `revisado`: conteudo revisado, aguardando publicacao; nao e exportado para a interface publica.
- `publicado`: conteudo aprovado e visivel no site.

Cada arquivo de dominio exporta os registros de trabalho e a colecao publica filtrada. O `npm run check` valida ambos os fluxos de dados importando os registros completos; os testes confirmam a filtragem de itens nao publicados.

## Imagens e licencas

Antes de publicar ou substituir uma imagem, siga o checklist em `CREDITOS-IMAGENS.md`. Mantenha a pagina da fonte e os detalhes da licenca registrados no documento; se a permissao nao estiver clara, use a capa cerimonial local.

## Validacao

Execute `npm test` e `npm run check` depois de alterar os dados. O verificador detecta campos obrigatorios ausentes, IDs invalidos ou duplicados, estados editoriais desconhecidos e referencias de trilhas a livros inexistentes. O servidor local permite a leitura da pasta publica `data/` para carregar esses modulos e continua bloqueando outras pastas aninhadas.
