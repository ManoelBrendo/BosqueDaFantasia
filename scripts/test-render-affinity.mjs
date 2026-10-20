import assert from "node:assert/strict";
import { createAffinityRenderers } from "../render-affinity.js";

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
    dataset: {},
    ...values
});

const affinityChoices = [
    {
        dataset: { questionId: "portal", optionValue: "forest" },
        classList: { toggle(name, active) { this.selected = active; } }
    },
    {
        dataset: { questionId: "portal", optionValue: "castle" },
        classList: { toggle(name, active) { this.selected = active; } }
    }
];
const elements = {
    affinityQuestions: createElement({ querySelectorAll: () => affinityChoices }),
    affinityProgress: createElement(),
    affinityResult: createElement(),
    affinityResultName: createElement(),
    affinityResultDescription: createElement(),
    affinityResultReason: createElement(),
    affinityResultAlt: createElement(),
    affinityResultBooks: createElement(),
    affinityMap: createElement(),
    affinityExplore: createElement()
};
const renderer = createAffinityRenderers({
    escapeHtml,
    buildBookMarkup: (book) => `<a data-book="${escapeHtml(book.id)}">${escapeHtml(book.title)}</a>`
});
const questions = [{
    id: "portal",
    title: "Qual caminho?",
    options: [
        { value: "forest", label: "Bosque <antigo>", description: "Folhas & luar" },
        { value: "castle", label: "Castelo", description: "Pedra e magia" }
    ]
}];
const paths = [
    { id: "forest", name: "Trilha <Élfica>", accent: "#d9b45b", description: "Bosque", focusQuery: "elfos", focusLabel: "elfos", bookIds: ["book-1"] },
    { id: "castle", name: "Trilha do castelo", accent: "#8abf9e", description: "Castelo", focusQuery: "castelo", focusLabel: "castelo", bookIds: ["book-2"] }
];

renderer.renderQuestions({ element: elements.affinityQuestions, questions });
assert.match(elements.affinityQuestions.innerHTML, /Bosque &lt;antigo&gt;/);
assert.match(elements.affinityQuestions.innerHTML, /Folhas &amp; luar/);

renderer.renderChoices({
    elements,
    answers: new Map([["portal", "forest"]]),
    questions
});
assert.equal(affinityChoices[0].classList.selected, true);
assert.equal(affinityChoices[1].classList.selected, false);
assert.equal(elements.affinityProgress.textContent, "1/1 respostas escolhidas");

renderer.renderIdleResult({ elements, paths });
assert.equal(elements.affinityResult.dataset.state, "idle");
assert.equal(elements.affinityExplore.disabled, true);
assert.equal(elements.affinityResultBooks.innerHTML, "");
assert.match(elements.affinityMap.innerHTML, /Trilha &lt;Élfica&gt;/);
assert.match(elements.affinityMap.innerHTML, /--fill: 6%/);

const recommendation = {
    bestPath: paths[0],
    runnerUp: paths[1],
    reason: "Bosque e exploração",
    scoreMap: new Map([["forest", 4], ["castle", 2]])
};
renderer.renderResult({
    elements,
    recommendation,
    books: [{ id: "book-1", title: "Livro <um>" }],
    paths
});
assert.equal(elements.affinityResult.dataset.state, "ready");
assert.equal(elements.affinityExplore.disabled, false);
assert.equal(elements.affinityExplore.dataset.query, "elfos");
assert.equal(elements.affinityExplore.dataset.label, "elfos");
assert.equal(elements.affinityExplore.textContent, "Explorar elfos");
assert.match(elements.affinityResultAlt.textContent, /trilha do castelo/);
assert.match(elements.affinityResultBooks.innerHTML, /Livro &lt;um&gt;/);
assert.match(elements.affinityMap.innerHTML, /4 pontos/);
assert.match(elements.affinityMap.innerHTML, /--fill: 100%/);

renderer.renderHistory({
    element: elements.affinityResult,
    history: [{ pathId: "forest", savedAt: Date.UTC(2026, 0, 1) }],
    paths
});
assert.match(elements.affinityResult.innerHTML, /data-recommendation-history="0"/);
assert.match(elements.affinityResult.innerHTML, /Trilha &lt;Élfica&gt;/);

renderer.renderHistory({ element: elements.affinityResult, history: [], paths });
assert.equal(elements.affinityResult.innerHTML, "");

console.log("OK: affinity renderers preserve question state, idle/ready results, score maps, history and HTML escaping.");
