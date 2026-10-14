import assert from "node:assert/strict";
import { affinityQuestions, readingPaths } from "../site-data.js";
import { recommendFromAnswers } from "../recommendation-engine.js";
import { getSourceLabel, rankAndDeduplicateBooks } from "../search-quality.js";
import { OpenLibraryCatalogApi } from "../open-library-api.js";

const books = [
    { id: "weak", title: "Aventura no bosque", author: "Outro autor", themes: ["fantasia"] },
    { id: "hobbit", title: "O Hobbit", originalTitle: "The Hobbit", author: "J. R. R. Tolkien", themes: ["fantasia épica"] },
    { id: "duplicate", title: "The Hobbit", originalTitle: "The Hobbit", author: "J. R. R. Tolkien", themes: ["fantasy"] },
    { id: "theme", title: "Uma jornada", author: "Tolkien", themes: ["hobbit", "fantasia"] },
    { id: "unknown-author", title: "O Hobbit", themes: ["fantasia"] }
];

const rankedBooks = rankAndDeduplicateBooks(books, "O Hobbit");
assert.deepEqual(rankedBooks.map((book) => book.id), ["hobbit", "unknown-author", "theme", "weak"]);
assert.deepEqual(rankAndDeduplicateBooks(books, "subject:fantasy").map((book) => book.id), [
    "weak",
    "hobbit",
    "theme",
    "unknown-author"
]);
assert.equal(getSourceLabel("remote"), "Open Library");
assert.equal(getSourceLabel("network-cache"), "Cache local");
assert.equal(getSourceLabel("offline-db"), "Cache local");
assert.equal(getSourceLabel("curated"), "Curadoria Bosque");

const originalFetch = globalThis.fetch;
try {
    globalThis.fetch = async () => ({
        ok: true,
        json: async () => ({
            numFound: 2,
            docs: ["OL1W", "OL2W"].map((workId, index) => ({
                key: `/works/${workId}`,
                title: "The Hobbit",
                author_name: ["J. R. R. Tolkien"],
                first_publish_year: 1937,
                edition_count: 1,
                editions: { docs: [{ key: `/books/OL${index + 1}M`, title: "The Hobbit", language: ["eng"] }] },
                subject: ["fantasy"]
            }))
        })
    });
    const api = new OpenLibraryCatalogApi();
    const firstResult = await api.searchBooks({ query: "hobbit" });
    assert.equal(firstResult.source, "remote");
    assert.equal(firstResult.books.length, 1);
    assert.equal(firstResult.books[0].id, "OL1W");
    const cachedResult = await api.searchBooks({ query: "hobbit" });
    assert.equal(cachedResult.source, "network-cache");
} finally {
    globalThis.fetch = originalFetch;
}

const answers = new Map([
    ["entrada", "bosque"],
    ["ritmo", "contemplativo"],
    ["magia", "sutil"],
    ["paisagem", "verde"]
]);
const recommendation = recommendFromAnswers({ answers, questions: affinityQuestions, paths: readingPaths });
assert.equal(recommendation.bestPath.id, "elfica");
assert.match(recommendation.reason, /Bosque elfico/);
assert.match(recommendation.reason, /Encantamento sutil/);
assert.ok(recommendation.matchedSignals.every((signal) => signal.score > 0));
assert.ok(recommendation.matchedSignals.some((signal) => signal.label === "Contemplativo"));

console.log("OK: search ranking, duplicate collapse, source labels, and Oracle explanations are deterministic.");
