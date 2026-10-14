const normalizeText = (value) => String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const getBookTitles = (book) => {
    return [...new Set([book.title, book.originalTitle, book.portugueseTitle]
        .map(normalizeText)
        .filter(Boolean))];
};

const getBookKey = (book) => {
    const author = normalizeText(book.author);
    if (!author) return [`id:${book.id}`];
    const titles = getBookTitles(book);
    return titles.map((title) => `${author}:${title}`);
};

const queryTerms = (query) => normalizeText(query)
    .split(/\s+/)
    .filter((term) => term.length > 1 && !["subject", "title", "author", "language"].includes(term));

const scoreBook = (book, terms, normalizedQuery) => {
    const titles = getBookTitles(book);
    const titleText = normalizeText([book.title, book.originalTitle, book.portugueseTitle].filter(Boolean).join(" "));
    const authorText = normalizeText(book.author);
    const themeText = normalizeText((book.themes || []).join(" "));
    let score = 0;

    if (normalizedQuery && titles.includes(normalizedQuery)) score += 1000;
    else if (normalizedQuery && titles.some((title) => title.startsWith(normalizedQuery))) score += 500;
    else if (normalizedQuery && titleText.includes(normalizedQuery)) score += 300;
    if (normalizedQuery && authorText.includes(normalizedQuery)) score += 250;

    for (const term of terms) {
        if (titleText.includes(term)) score += 40;
        if (authorText.includes(term)) score += 30;
        if (themeText.includes(term)) score += 12;
    }

    return score;
};

export const rankAndDeduplicateBooks = (books, query = "") => {
    const normalizedQuery = normalizeText(query.replace(/\b(?:subject|title|author|language):/gi, " "));
    const terms = queryTerms(query.replace(/\b(?:subject|title|author|language):/gi, " "));
    const seenKeys = new Set();
    const uniqueBooks = [];

    for (const book of books) {
        const keys = getBookKey(book);
        if (keys.some((key) => seenKeys.has(key))) continue;
        keys.forEach((key) => seenKeys.add(key));
        uniqueBooks.push(book);
    }

    return uniqueBooks
        .map((book, index) => ({ book, index, score: scoreBook(book, terms, normalizedQuery) }))
        .sort((left, right) => right.score - left.score || left.index - right.index)
        .map(({ book }) => book);
};

export const getSourceLabel = (source) => {
    if (source === "curated") return "Curadoria Bosque";
    if (source === "remote") return "Open Library";
    return "Cache local";
};
