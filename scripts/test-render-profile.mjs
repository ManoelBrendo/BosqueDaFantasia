import assert from "node:assert/strict";
import { createProfileRenderers } from "../render-profile.js";

const escapeHtml = (value) => String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const createElement = (values = {}) => ({
    innerHTML: "",
    textContent: "",
    disabled: false,
    ...values
});

const authorButtons = [
    { dataset: { authorId: "author-1" }, classList: { toggle(name, active) { this.active = active; } } },
    { dataset: { authorId: "author-2" }, classList: { toggle(name, active) { this.active = active; } } }
];
const authorsGrid = createElement({ querySelectorAll: () => authorButtons });
const elements = {
    authorsGrid,
    authorsPaginationInfo: createElement(),
    authorsPrevious: createElement(),
    authorsNext: createElement(),
    authorFocusName: createElement(),
    authorFocusSummary: createElement(),
    authorFocusBestFor: createElement(),
    authorFocusClimate: createElement(),
    authorFocusStart: createElement(),
    authorFocusLegacy: createElement(),
    authorFocusWorks: createElement(),
    glossaryGrid: createElement(),
    glossaryCount: createElement()
};
const renderers = createProfileRenderers({ escapeHtml });
const authors = [
    {
        id: "author-1",
        status: "Publicado",
        name: "Autora <um>",
        summary: "Resumo & contexto",
        bestFor: "Leitores <curiosos>",
        climate: "Mágico",
        startWith: "Primeira obra",
        legacy: "Legado",
        works: ["Obra <inicial>"]
    },
    {
        id: "author-2",
        status: "Publicado",
        name: "Autor Dois",
        summary: "Outro resumo",
        bestFor: "Exploradores",
        climate: "Épico",
        startWith: "Outra obra",
        legacy: "Outro legado",
        works: ["Segunda obra"]
    }
];

const currentPage = renderers.renderAuthors({
    elements,
    authors,
    page: 99,
    activeAuthorId: "author-2",
    perPage: 1
});
assert.equal(currentPage, 2);
assert.match(elements.authorsGrid.innerHTML, /Autor Dois/);
assert.equal(elements.authorsPaginationInfo.textContent, "Página 2 de 2 · 2 autores");
assert.equal(elements.authorsPrevious.disabled, false);
assert.equal(elements.authorsNext.disabled, true);
assert.equal(authorButtons[1].classList.active, true);
assert.equal(authorButtons[0].classList.active, false);
assert.match(renderers.buildAuthorCardMarkup(authors[0]), /Autora &lt;um&gt;/);

renderers.renderAuthorFocus({ elements, authors, activeAuthorId: "author-1" });
assert.equal(elements.authorFocusName.textContent, "Autora <um>");
assert.match(elements.authorFocusWorks.innerHTML, /Obra &lt;inicial&gt;/);

const glossary = [
    { category: "Termo", term: "Feeria", short: "Mundo & mágico", long: "Descrição segura." },
    { category: "Termo", term: "Dragão", short: "Criatura antiga", long: "Outra descrição." }
];
assert.equal(renderers.renderGlossary({ elements, entries: glossary, query: "CRIATURA" }), 1);
assert.match(elements.glossaryGrid.innerHTML, /Dragão/);
assert.doesNotMatch(elements.glossaryGrid.innerHTML, /Feeria/);
assert.equal(elements.glossaryCount.textContent, "1 verbetes revelados");
assert.match(renderers.buildGlossaryMarkup(glossary[0]), /Mundo &amp; mágico/);

console.log("OK: profile renderers preserve author pagination, focus, glossary filtering and HTML escaping.");
