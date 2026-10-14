import { OpenLibraryCatalogApi } from "./open-library-api.js";
import {
    DEFAULT_LABEL,
    DEFAULT_QUERY,
    RESULTS_PER_PAGE,
    affinityQuestions,
    featuredBooks,
    readingPaths,
    topicThemes
} from "./site-data.js";
import { recommendFromAnswers } from "./recommendation-engine.js";

const api = new OpenLibraryCatalogApi();

const getRequiredElement = (id) => {
    const element = document.getElementById(id);

    if (!element) {
        throw new Error(`Elemento obrigatório ausente: #${id}`);
    }

    return element;
};

const escapeHtml = (value) => {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
};

const elements = {
    oraculoSection: getRequiredElement("oraculo"),
    compraSection: getRequiredElement("compra"),
    affinityQuestions: getRequiredElement("affinity-questions"),
    affinityResult: getRequiredElement("affinity-result"),
    affinityResultName: getRequiredElement("affinity-result-name"),
    affinityResultDescription: getRequiredElement("affinity-result-description"),
    affinityResultReason: getRequiredElement("affinity-result-reason"),
    affinityResultAlt: getRequiredElement("affinity-result-alt"),
    affinityResultBooks: getRequiredElement("affinity-result-books"),
    affinitySubmit: getRequiredElement("affinity-submit"),
    affinityReset: getRequiredElement("affinity-reset"),
    affinityProgress: getRequiredElement("affinity-progress"),
    affinityExplore: getRequiredElement("affinity-explore"),
    curatedGrid: getRequiredElement("curated-grid"),
    topicsGrid: getRequiredElement("topics-grid"),
    searchForm: getRequiredElement("catalog-search-form"),
    searchInput: getRequiredElement("catalog-search"),
    submitButton: getRequiredElement("catalog-submit"),
    status: getRequiredElement("catalog-status"),
    resultsGrid: getRequiredElement("results-grid"),
    loadMoreButton: getRequiredElement("catalog-load-more"),
    activeTheme: getRequiredElement("active-theme"),
    purchaseTitle: getRequiredElement("purchase-title"),
    purchaseOriginal: getRequiredElement("purchase-original"),
    purchaseMeta: getRequiredElement("purchase-meta"),
    purchaseDescription: getRequiredElement("purchase-description"),
    purchaseCover: getRequiredElement("purchase-cover"),
    purchaseLink: getRequiredElement("purchase-link"),
    purchaseHint: getRequiredElement("purchase-hint")
};

const state = {
    query: DEFAULT_QUERY,
    page: 1,
    total: 0,
    controller: null,
    debounceTimer: null,
    resultBooks: [],
    registry: new Map(),
    activeLabel: DEFAULT_LABEL,
    affinityAnswers: new Map()
};

const registerBooks = (books) => {
    books.forEach((book) => {
        state.registry.set(book.id, book);
    });
};

const getBookCoverSources = (book) => {
    const sources = Array.isArray(book.coverCandidates) && book.coverCandidates.length > 0
        ? [...book.coverCandidates, book.cover]
        : [book.cover];

    return [...new Set(sources.filter(Boolean))];
};

const applyBookCover = (image, book) => {
    if (!image || !book) {
        return;
    }

    const sources = getBookCoverSources(book);
    let sourceIndex = 0;

    image.onerror = () => {
        sourceIndex += 1;

        if (sourceIndex < sources.length) {
            image.src = sources[sourceIndex];
            return;
        }

        image.onerror = null;
    };

    image.src = sources[0] || "";
};

const hydrateBookImages = (root) => {
    root.querySelectorAll("[data-book-cover-id]").forEach((image) => {
        const book = state.registry.get(image.dataset.bookCoverId);

        if (!book) {
            return;
        }

        applyBookCover(image, book);
    });
};

const buildCuratedMarkup = (book) => `
    <article class="featured-card">
        <a class="book-card-link js-book-link" href="#compra" data-book-id="${escapeHtml(book.id)}" aria-label="Abrir o portal de compra para ${escapeHtml(book.portugueseTitle || book.title)}">
            <div class="book-cover-shell">
                <img data-book-cover-id="${escapeHtml(book.id)}" src="${escapeHtml(book.cover)}" alt="Capa de ${escapeHtml(book.portugueseTitle || book.title)}" loading="lazy" decoding="async">
            </div>
            <div class="book-copy">
                <span class="book-ribbon">${escapeHtml(book.aura)}</span>
                <h3>${escapeHtml(book.portugueseTitle || book.title)}</h3>
                <p class="book-original">${escapeHtml(book.originalTitle)}</p>
                <p class="book-description">${escapeHtml(book.description)}</p>
                <div class="book-meta">
                    <span>${escapeHtml(book.author)}</span>
                    <span>${escapeHtml(book.year)}</span>
                </div>
            </div>
        </a>
    </article>
`;

const buildTopicMarkup = (topic) => `
    <button class="theme-card" type="button" data-query="${escapeHtml(topic.query)}" data-label="${escapeHtml(topic.label)}">
        <strong>${escapeHtml(topic.label)}</strong>
        <span>${escapeHtml(topic.description)}</span>
    </button>
`;

const buildResultMarkup = (book) => `
    <article class="result-card">
        <a class="book-card-link js-book-link" href="#compra" data-book-id="${escapeHtml(book.id)}" aria-label="Abrir o portal de compra para ${escapeHtml(book.title)}">
            <div class="book-cover-shell">
                <img data-book-cover-id="${escapeHtml(book.id)}" src="${escapeHtml(book.cover)}" alt="Capa de ${escapeHtml(book.title)}" loading="lazy" decoding="async">
            </div>
            <div class="book-copy">
                <h3>${escapeHtml(book.title)}</h3>
                <p class="book-author">${escapeHtml(book.author)}</p>
                <p class="book-description">${escapeHtml(book.description)}</p>
                <div class="book-meta">
                    <span>${escapeHtml(book.year)}</span>
                    <span>${book.editionCount ? `${escapeHtml(book.editionCount)} edições` : "Acervo geral"}</span>
                </div>
            </div>
        </a>
    </article>
`;

const buildAffinityQuestionMarkup = (question) => `
    <article class="affinity-question-card">
        <div class="affinity-question-head">
            <span class="book-ribbon">Pergunta</span>
            <h3>${escapeHtml(question.title)}</h3>
        </div>
        <div class="affinity-choice-grid">
            ${question.options.map((option) => `
                <button
                    class="affinity-choice"
                    type="button"
                    data-question-id="${escapeHtml(question.id)}"
                    data-option-value="${escapeHtml(option.value)}"
                >
                    <strong>${escapeHtml(option.label)}</strong>
                    <span>${escapeHtml(option.description)}</span>
                </button>
            `).join("")}
        </div>
    </article>
`;

const buildAffinityBookMarkup = (book) => `
    <a class="affinity-book-link js-book-link" href="#compra" data-book-id="${escapeHtml(book.id)}">
        <strong>${escapeHtml(book.title)}</strong>
        <span>${escapeHtml(book.author)}</span>
    </a>
`;

const renderCuratedShelf = () => {
    registerBooks(featuredBooks);
    elements.curatedGrid.innerHTML = featuredBooks.map(buildCuratedMarkup).join("");
    hydrateBookImages(elements.curatedGrid);
};

const renderTopics = () => {
    elements.topicsGrid.innerHTML = topicThemes.map(buildTopicMarkup).join("");
};

const renderAffinityQuestions = () => {
    elements.affinityQuestions.innerHTML = affinityQuestions.map(buildAffinityQuestionMarkup).join("");
};

const syncAffinityChoices = () => {
    elements.affinityQuestions.querySelectorAll(".affinity-choice").forEach((button) => {
        const isSelected = state.affinityAnswers.get(button.dataset.questionId) === button.dataset.optionValue;
        button.classList.toggle("is-selected", isSelected);
    });

    elements.affinityProgress.textContent = `${state.affinityAnswers.size}/${affinityQuestions.length} respostas escolhidas`;
};

const updatePurchasePanel = (book) => {
    elements.purchaseTitle.textContent = book.portugueseTitle || book.title;
    elements.purchaseOriginal.textContent = book.originalTitle
        ? `Título original: ${book.originalTitle}`
        : "Título exibido como veio do acervo.";
    elements.purchaseMeta.textContent = `${book.author} · ${book.year}`;
    elements.purchaseDescription.textContent = book.description;
    elements.purchaseCover.alt = `Capa de ${book.title}`;
    applyBookCover(elements.purchaseCover, book);
    elements.purchaseLink.href = book.purchaseUrl || "#compra";
    elements.purchaseLink.setAttribute("aria-disabled", String(!book.purchaseUrl || book.purchaseUrl === "#compra"));
    elements.purchaseHint.textContent = `O link final de compra de ${book.title} pode ser conectado depois sem alterar o restante da vitrine.`;
};

const renderResults = () => {
    elements.resultsGrid.innerHTML = state.resultBooks.map(buildResultMarkup).join("");
    hydrateBookImages(elements.resultsGrid);
};

const renderAffinityRecommendation = () => {
    if (state.affinityAnswers.size < affinityQuestions.length) {
        elements.affinityResult.dataset.state = "idle";
        elements.affinityResultName.textContent = "Responda às quatro perguntas";
        elements.affinityResultDescription.textContent = "O Oráculo de Afinidade vai sugerir uma trilha de leitura coerente com seu gosto.";
        elements.affinityResultReason.textContent = "Escolha um portal, um ritmo, uma forma de magia e uma paisagem.";
        elements.affinityResultAlt.textContent = "Uma trilha complementar aparece aqui quando o oraculo encontrar um segundo caminho compativel.";
        elements.affinityResultBooks.innerHTML = "";
        elements.affinityExplore.disabled = true;
        return;
    }

    const recommendation = recommendFromAnswers({
        answers: state.affinityAnswers,
        questions: affinityQuestions,
        paths: readingPaths
    });

    const recommendedBooks = recommendation.bestPath.bookIds
        .map((bookId) => state.registry.get(bookId))
        .filter(Boolean);

    elements.affinityResult.dataset.state = "ready";
    elements.affinityResultName.textContent = recommendation.bestPath.name;
    elements.affinityResultDescription.textContent = recommendation.bestPath.description;
    elements.affinityResultReason.textContent = `O Oráculo aproximou você de ${recommendation.chosenOptions.map((option) => option.label).join(", ")}.`;
    elements.affinityResultAlt.textContent = recommendation.runnerUp
        ? `Se quiser um segundo caminho sem perder o clima principal, experimente tambem ${recommendation.runnerUp.name.toLowerCase()}.`
        : "Esta leitura ficou bem definida; o oraculo nao encontrou uma segunda trilha tao forte quanto a principal.";
    elements.affinityResultBooks.innerHTML = recommendedBooks.map(buildAffinityBookMarkup).join("");
    elements.affinityExplore.disabled = false;
    elements.affinityExplore.dataset.query = recommendation.bestPath.focusQuery;
    elements.affinityExplore.dataset.label = recommendation.bestPath.focusLabel;
    elements.affinityExplore.textContent = `Explorar ${recommendation.bestPath.focusLabel}`;
};

const updateStatus = ({ loading = false, error = "", empty = false } = {}) => {
    elements.submitButton.disabled = loading;
    elements.loadMoreButton.disabled = loading;

    if (loading) {
        elements.status.textContent = "O oráculo está consultando o acervo dos reinos...";
        elements.loadMoreButton.hidden = true;
        return;
    }

    if (error) {
        elements.status.textContent = error;
        elements.loadMoreButton.hidden = true;
        return;
    }

    if (empty) {
        elements.status.textContent = "Nenhuma obra atravessou o véu dessa busca. Tente outro termo ou um tema sugerido.";
        elements.loadMoreButton.hidden = true;
        return;
    }

    elements.status.textContent = `O oráculo revelou ${state.resultBooks.length} de ${state.total.toLocaleString("pt-BR")} registros.`;
    elements.loadMoreButton.hidden = state.resultBooks.length >= state.total;
};

const syncQueryUrl = () => {
    const nextUrl = new URL(window.location.href);
    nextUrl.searchParams.set("busca", state.query);
    history.replaceState({}, "", nextUrl);
};

const prettyQuery = (query) => {
    return (query || DEFAULT_QUERY)
        .replace(/^"+|"+$/g, "")
        .replace(/subject:/g, "")
        .replace(/subject_key:/g, "")
        .replace(/-/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

const resolveThemeByQuery = (query) => {
    return topicThemes.find((topic) => topic.query === query) || null;
};

const setActiveTheme = (label, query, { syncInput = false } = {}) => {
    state.activeLabel = label || prettyQuery(query);
    elements.activeTheme.textContent = state.activeLabel;

    if (syncInput) {
        elements.searchInput.value = state.activeLabel;
        elements.searchInput.dataset.displayLabel = state.activeLabel;
        elements.searchInput.dataset.searchQuery = query;
    }

    document.querySelectorAll(".theme-card").forEach((button) => {
        button.classList.toggle("is-active", button.dataset.query === query);
    });
};

const resolveInputQuery = () => {
    const typedValue = elements.searchInput.value.trim();
    const storedLabel = elements.searchInput.dataset.displayLabel || "";
    const storedQuery = elements.searchInput.dataset.searchQuery || "";

    if (typedValue && storedQuery && typedValue === storedLabel) {
        return { query: storedQuery, label: storedLabel };
    }

    if (!typedValue) {
        return { query: DEFAULT_QUERY, label: DEFAULT_LABEL };
    }

    return { query: typedValue, label: prettyQuery(typedValue) };
};

const runSearch = async ({ query, append = false, page = 1, label } = {}) => {
    if (state.controller) {
        state.controller.abort();
    }

    state.controller = new AbortController();
    updateStatus({ loading: true });

    try {
        const result = await api.searchBooks({
            query,
            page,
            limit: RESULTS_PER_PAGE,
            signal: state.controller.signal
        });

        state.query = query;
        state.page = page;
        state.total = result.total;
        state.resultBooks = append ? [...state.resultBooks, ...result.books] : result.books;
        registerBooks(result.books);

        setActiveTheme(label || prettyQuery(query), query, { syncInput: !append });
        renderResults();
        updateStatus({ empty: state.resultBooks.length === 0 });
        syncQueryUrl();
    } catch (error) {
        if (error.name === "AbortError") {
            return;
        }

        updateStatus({ error: "O acervo não respondeu agora. Tente novamente em alguns instantes." });
    }
};

const selectBookById = (id) => {
    const selectedBook = state.registry.get(id);

    if (!selectedBook) {
        return;
    }

    updatePurchasePanel(selectedBook);
};

const scrollToSection = (section) => {
    section.scrollIntoView({ behavior: "smooth", block: "start" });
};

const scheduleCatalogWarmup = (callback) => {
    if ("requestIdleCallback" in window) {
        window.requestIdleCallback(callback, { timeout: 900 });
        return;
    }

    window.setTimeout(callback, 180);
};

const initSearchInteractions = () => {
    elements.searchForm.addEventListener("submit", (event) => {
        event.preventDefault();
        const { query, label } = resolveInputQuery();
        runSearch({ query, page: 1, append: false, label });
    });

    elements.searchInput.addEventListener("input", (event) => {
        clearTimeout(state.debounceTimer);

        const typedValue = event.target.value.trim();
        elements.searchInput.dataset.displayLabel = typedValue;
        elements.searchInput.dataset.searchQuery = typedValue;

        if (typedValue.length > 0 && typedValue.length < 3) {
            elements.activeTheme.textContent = "Digite mais um pouco para consultar o acervo";
            return;
        }

        state.debounceTimer = window.setTimeout(() => {
            const nextQuery = typedValue || DEFAULT_QUERY;
            const nextLabel = typedValue ? prettyQuery(typedValue) : DEFAULT_LABEL;
            runSearch({ query: nextQuery, page: 1, append: false, label: nextLabel });
        }, 550);
    });

    elements.topicsGrid.addEventListener("click", (event) => {
        const button = event.target.closest("[data-query]");

        if (!button) {
            return;
        }

        const { query, label } = button.dataset;
        setActiveTheme(label, query, { syncInput: true });
        runSearch({ query, page: 1, append: false, label });
        scrollToSection(elements.oraculoSection);
    });

    elements.loadMoreButton.addEventListener("click", () => {
        runSearch({ query: state.query, page: state.page + 1, append: true, label: state.activeLabel });
    });
};

const initAffinityInteractions = () => {
    elements.affinityQuestions.addEventListener("click", (event) => {
        const button = event.target.closest("[data-question-id][data-option-value]");

        if (!button) {
            return;
        }

        state.affinityAnswers.set(button.dataset.questionId, button.dataset.optionValue);
        syncAffinityChoices();
    });

    elements.affinitySubmit.addEventListener("click", () => {
        renderAffinityRecommendation();
    });

    elements.affinityReset.addEventListener("click", () => {
        state.affinityAnswers.clear();
        syncAffinityChoices();
        renderAffinityRecommendation();
    });

    elements.affinityExplore.addEventListener("click", () => {
        const { query, label } = elements.affinityExplore.dataset;

        if (!query || !label) {
            return;
        }

        setActiveTheme(label, query, { syncInput: true });
        runSearch({ query, page: 1, append: false, label });
        scrollToSection(elements.oraculoSection);
    });
};

const initGlobalBookClicks = () => {
    document.body.addEventListener("click", (event) => {
        const link = event.target.closest(".js-book-link");

        if (!link) {
            return;
        }

        const { bookId } = link.dataset;
        selectBookById(bookId);
        scrollToSection(elements.compraSection);
    });
};

const init = async () => {
    renderCuratedShelf();
    renderTopics();
    renderAffinityQuestions();
    syncAffinityChoices();
    renderAffinityRecommendation();
    initAffinityInteractions();
    initSearchInteractions();
    initGlobalBookClicks();
    updatePurchasePanel(featuredBooks[0]);

    const queryFromUrl = new URLSearchParams(window.location.search).get("busca") || DEFAULT_QUERY;
    const matchedTheme = resolveThemeByQuery(queryFromUrl);
    const initialLabel = matchedTheme?.label || prettyQuery(queryFromUrl) || DEFAULT_LABEL;

    setActiveTheme(initialLabel, queryFromUrl, { syncInput: true });
    scheduleCatalogWarmup(() => {
        runSearch({ query: queryFromUrl, page: 1, append: false, label: initialLabel });
    });
};

const bootstrap = async () => {
    try {
        await init();
    } catch (error) {
        console.error("Falha ao inicializar a página:", error);
        elements.status.textContent = "A página carregou parcialmente. Recarregue em alguns instantes para tentar novamente.";
    }
};

bootstrap();
