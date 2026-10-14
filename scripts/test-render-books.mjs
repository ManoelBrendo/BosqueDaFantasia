import assert from "node:assert/strict";
import { createBookRenderers } from "../render-books.js";

const escapeHtml = (value) => String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const favorites = new Set();
const readingStatus = new Map([["book-1", "reading"]]);
const renderers = createBookRenderers({
    escapeHtml,
    isFavorite: (bookId) => favorites.has(bookId),
    getReadingStatus: (bookId) => readingStatus.get(bookId) || "want-to-read"
});

const book = {
    id: "book-1",
    title: "A <história> & o bosque",
    portugueseTitle: "A <história> & o bosque",
    originalTitle: "The Forest",
    titleNote: "",
    cover: "https://example.test/cover.jpg?x=1&y=2",
    aura: "Encantada",
    difficulty: "Entrada",
    themes: ["bosque", "magia", "jornada"],
    description: "Uma aventura.",
    author: "Autora",
    year: 1901,
    editionCount: 4
};

const resultMarkup = renderers.buildResultMarkup(book);
assert.match(resultMarkup, /A &lt;história&gt; &amp; o bosque/);
assert.match(resultMarkup, /cover\.jpg\?x=1&amp;y=2/);
assert.match(resultMarkup, /data-book-save="book-1"/);
assert.match(resultMarkup, /aria-pressed="false"/);
assert.match(resultMarkup, /<span class="book-chip">bosque<\/span>/);
assert.doesNotMatch(resultMarkup, /jornada/);
assert.match(resultMarkup, /4 edicoes/);

favorites.add(book.id);
const savedButton = renderers.buildBookSaveButtonMarkup(book);
assert.match(savedButton, /is-active/);
assert.match(savedButton, /aria-pressed="true"/);
assert.match(savedButton, />\s*Guardado\s*</);

const favoriteMarkup = renderers.buildFavoriteMarkup(book);
assert.match(favoriteMarkup, /value="reading" selected/);
assert.match(favoriteMarkup, /data-reading-status="book-1"/);

const curatedMarkup = renderers.buildCuratedMarkup(book);
assert.match(curatedMarkup, /Título original: The Forest/);
assert.match(curatedMarkup, /Capa de A &lt;história&gt; &amp; o bosque/);

const topicMarkup = renderers.buildTopicMarkup({
    query: "tema&x",
    label: "Elfos <e> feeria",
    description: "Bosques encantados."
});
assert.match(topicMarkup, /data-query="tema&amp;x"/);
assert.match(topicMarkup, /Elfos &lt;e&gt; feeria/);

const affinityMarkup = renderers.buildAffinityBookMarkup(book);
assert.match(affinityMarkup, /data-book-id="book-1"/);
assert.match(affinityMarkup, /<strong>A &lt;história&gt; &amp; o bosque<\/strong>/);

console.log("OK: isolated book renderers preserve markup, live UI state and HTML escaping.");
