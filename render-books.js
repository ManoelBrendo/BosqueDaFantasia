export const createBookRenderers = ({ escapeHtml, isFavorite, getReadingStatus }) => {
    const buildBookChipRowMarkup = (book) => {
        const chips = [
            book.aura,
            book.difficulty,
            ...book.themes.slice(0, 2)
        ];

        return `
            <div class="book-chip-row">
                ${chips.map((chip) => `<span class="book-chip">${escapeHtml(chip)}</span>`).join("")}
            </div>
        `;
    };

    const buildBookSaveButtonMarkup = (book) => {
        const favorite = isFavorite(book.id);

        return `
            <button
                class="book-save-button${favorite ? " is-active" : ""}"
                type="button"
                data-book-save="${escapeHtml(book.id)}"
                aria-pressed="${favorite ? "true" : "false"}"
            >
                ${favorite ? "Guardado" : "Guardar"}
            </button>
        `;
    };

    const buildCuratedMarkup = (book) => `
        <article class="featured-card">
            ${buildBookSaveButtonMarkup(book)}
            <a class="book-card-link js-book-link" href="#compra" data-book-id="${escapeHtml(book.id)}" aria-label="Abrir a ficha editorial de ${escapeHtml(book.portugueseTitle || book.title)}">
                <div class="book-cover-shell">
                    <img data-book-cover-id="${escapeHtml(book.id)}" src="${escapeHtml(book.cover)}" alt="Capa de ${escapeHtml(book.portugueseTitle || book.title)}" loading="lazy" decoding="async">
                </div>
                <div class="book-copy">
                    <span class="book-ribbon">${escapeHtml(book.aura)}</span>
                    <h3>${escapeHtml(book.portugueseTitle || book.title)}</h3>
                    <p class="book-original">${escapeHtml(book.titleNote || (book.originalTitle !== book.title ? `Título original: ${book.originalTitle}` : "Título em português"))}</p>
                    <p class="book-description">${escapeHtml(book.description)}</p>
                    ${buildBookChipRowMarkup(book)}
                    <div class="book-meta">
                        <span>${escapeHtml(book.author)}</span>
                        <span>${escapeHtml(book.year)}</span>
                    </div>
                </div>
            </a>
        </article>
    `;

    const buildFavoriteMarkup = (book) => {
        const readingStatus = getReadingStatus(book.id);

        return `
            ${buildCuratedMarkup(book)}
            <label class="reading-status-control" for="reading-status-${escapeHtml(book.id)}">
                <span>Status de leitura</span>
                <select id="reading-status-${escapeHtml(book.id)}" data-reading-status="${escapeHtml(book.id)}">
                    <option value="want-to-read"${readingStatus === "want-to-read" ? " selected" : ""}>Quero ler</option>
                    <option value="reading"${readingStatus === "reading" ? " selected" : ""}>Lendo</option>
                    <option value="read"${readingStatus === "read" ? " selected" : ""}>Lido</option>
                </select>
            </label>
        `;
    };

    const buildTopicMarkup = (topic) => `
        <button class="theme-card" type="button" data-query="${escapeHtml(topic.query)}" data-label="${escapeHtml(topic.label)}">
            <strong>${escapeHtml(topic.label)}</strong>
            <span>${escapeHtml(topic.description)}</span>
        </button>
    `;

    const buildResultMarkup = (book) => `
        <article class="result-card">
            ${buildBookSaveButtonMarkup(book)}
            <a class="book-card-link js-book-link" href="#compra" data-book-id="${escapeHtml(book.id)}" aria-label="Abrir a ficha editorial de ${escapeHtml(book.title)}">
                <div class="book-cover-shell">
                    <img data-book-cover-id="${escapeHtml(book.id)}" src="${escapeHtml(book.cover)}" alt="Capa de ${escapeHtml(book.title)}" loading="lazy" decoding="async">
                </div>
                <div class="book-copy">
                    <h3>${escapeHtml(book.title)}</h3>
                    <p class="book-author">${escapeHtml(book.author)}</p>
                    <p class="book-description">${escapeHtml(book.description)}</p>
                    ${buildBookChipRowMarkup(book)}
                    <div class="book-meta">
                        <span>${escapeHtml(book.year)}</span>
                        <span>${book.editionCount ? `${escapeHtml(book.editionCount)} edicoes` : "Acervo geral"}</span>
                    </div>
                </div>
            </a>
        </article>
    `;

    const buildAffinityBookMarkup = (book) => `
        <a class="affinity-book-link js-book-link" href="#compra" data-book-id="${escapeHtml(book.id)}">
            <strong>${escapeHtml(book.title)}</strong>
            <span>${escapeHtml(book.author)}</span>
        </a>
    `;

    return {
        buildAffinityBookMarkup,
        buildBookSaveButtonMarkup,
        buildCuratedMarkup,
        buildFavoriteMarkup,
        buildResultMarkup,
        buildTopicMarkup
    };
};
