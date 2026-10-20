export const createProfileRenderers = ({ escapeHtml }) => {
    const buildAuthorCardMarkup = (author) => `
        <button class="author-card" type="button" data-author-id="${escapeHtml(author.id)}">
            <span>${escapeHtml(author.status)}</span>
            <h3>${escapeHtml(author.name)}</h3>
            <p>${escapeHtml(author.summary)}</p>
            <ul>
                <li>Bom para: ${escapeHtml(author.bestFor)}</li>
                <li>Clima: ${escapeHtml(author.climate)}</li>
            </ul>
        </button>
    `;

    const buildGlossaryMarkup = (entry) => `
        <article class="glossary-card">
            <span class="book-ribbon">${escapeHtml(entry.category)}</span>
            <h3>${escapeHtml(entry.term)}</h3>
            <p>${escapeHtml(entry.short)}</p>
            <p>${escapeHtml(entry.long)}</p>
        </article>
    `;

    const renderAuthors = ({ elements, authors, page, activeAuthorId, perPage = 6 }) => {
        const totalPages = Math.max(1, Math.ceil(authors.length / perPage));
        const currentPage = Math.min(Math.max(page, 1), totalPages);
        const startIndex = (currentPage - 1) * perPage;
        const visibleAuthors = authors.slice(startIndex, startIndex + perPage);

        elements.authorsGrid.innerHTML = visibleAuthors.map(buildAuthorCardMarkup).join("");
        elements.authorsPaginationInfo.textContent = `Página ${currentPage} de ${totalPages} · ${authors.length} autores`;
        elements.authorsPrevious.disabled = currentPage === 1;
        elements.authorsNext.disabled = currentPage === totalPages;
        elements.authorsGrid.querySelectorAll("[data-author-id]").forEach((button) => {
            button.classList.toggle("is-active", button.dataset.authorId === activeAuthorId);
        });

        return currentPage;
    };

    const renderAuthorFocus = ({ elements, authors, activeAuthorId }) => {
        const author = authors.find((entry) => entry.id === activeAuthorId) || authors[0];

        if (!author) {
            return;
        }

        elements.authorFocusName.textContent = author.name;
        elements.authorFocusSummary.textContent = author.summary;
        elements.authorFocusBestFor.textContent = author.bestFor;
        elements.authorFocusClimate.textContent = author.climate;
        elements.authorFocusStart.textContent = author.startWith;
        elements.authorFocusLegacy.textContent = author.legacy;
        elements.authorFocusWorks.innerHTML = author.works
            .map((work) => `<span class="author-work-chip">${escapeHtml(work)}</span>`)
            .join("");
    };

    const renderGlossary = ({ elements, entries, query }) => {
        const normalizedQuery = query.trim().toLowerCase();
        const visibleEntries = entries.filter((entry) => {
            return !normalizedQuery
                || `${entry.term} ${entry.category} ${entry.short} ${entry.long}`.toLowerCase().includes(normalizedQuery);
        });

        elements.glossaryGrid.innerHTML = visibleEntries.map(buildGlossaryMarkup).join("");
        elements.glossaryCount.textContent = `${visibleEntries.length} verbetes revelados`;
        return visibleEntries.length;
    };

    return {
        buildAuthorCardMarkup,
        buildGlossaryMarkup,
        renderAuthors,
        renderAuthorFocus,
        renderGlossary
    };
};
