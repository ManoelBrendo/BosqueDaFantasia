import { BosqueCatalogApi } from "../../catalog-api.js";
import { DEFAULT_LABEL, DEFAULT_QUERY, RESULTS_PER_PAGE, topicThemes } from "../../site-data.js";
import { normalizeFilters } from "../../search-policy.js";

const api = new BosqueCatalogApi();
const $ = id => document.getElementById(id);
const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
const snapshotKey = 'bosque-catalog-v2';
const state = { books: [], page: 0, total: 0, hasMore: false, controller: null, sort: 'relevance', filters: {}, query: DEFAULT_QUERY, label: DEFAULT_LABEL, source: '' };
let retryAppend = false;

const readUrl = () => {
    const params = new URLSearchParams(location.search);
    state.query = params.get('q') || DEFAULT_QUERY;
    state.label = params.get('tema') || params.get('q') || DEFAULT_LABEL;
    state.sort = params.get('ordem') === 'title' ? 'title' : 'relevance';
    state.filters = normalizeFilters({ author: params.get('autor'), from: params.get('de'), to: params.get('ate'), publicOnly: params.get('dominio') === '1' });
};
const writeUrl = (push = false) => {
    const params = new URLSearchParams({q: state.query, tema: state.label, ordem: state.sort});
    if (state.filters.author) params.set('autor', state.filters.author);
    if (state.filters.from !== null) params.set('de', state.filters.from);
    if (state.filters.to !== null) params.set('ate', state.filters.to);
    if (state.filters.publicOnly) params.set('dominio', '1');
    history[push ? 'pushState' : 'replaceState'](null, '', `livros.html?${params}`);
};
const syncControls = () => {
    $('catalog-search').value = state.query === DEFAULT_QUERY ? '' : state.query;
    $('catalog-title').textContent = state.query === DEFAULT_QUERY ? 'Um mundo em cada livro.' : state.label;
    $('catalog-summary').textContent = 'Explore o acervo com os títulos apresentados em português e consulte o título original na ficha de cada obra.';
    $('catalog-author').value = state.filters.author;
    $('catalog-from').value = state.filters.from ?? '';
    $('catalog-to').value = state.filters.to ?? '';
    $('catalog-public').checked = state.filters.publicOnly;
    $('catalog-sort').value = state.sort;
    const activeFilters = Number(Boolean(state.filters.author)) + Number(state.filters.from !== null || state.filters.to !== null) + Number(state.filters.publicOnly);
    $('filter-count').textContent = activeFilters ? `(${activeFilters} ativos)` : '';
    if (activeFilters) $('catalog-filter-panel').open = true;
};
const saveSnapshot = () => {
    if (state.page < 1) return;
    try { sessionStorage.setItem(snapshotKey, JSON.stringify({url: location.search, savedAt: Date.now(), scrollY, books: state.books, page: state.page, total: state.total, hasMore: state.hasMore, source: state.source})); } catch { /* Storage is optional. */ }
};
const status = () => {
    const count = state.books.length;
    $('catalog-status').textContent = count
        ? `${count} de ${state.total} obras. ${state.source.startsWith('offline') ? 'Resultados salvos neste dispositivo; podem estar desatualizados.' : 'Títulos em português priorizados.'}`
        : 'Nenhum resultado. Tente outro título, autor ou amplie o período.';
    $('catalog-load-more').hidden = !state.hasMore;
};
const render = () => {
    const books = state.sort === 'title' ? [...state.books].sort((a,b) => a.title.localeCompare(b.title, 'en', {sensitivity:'base'})) : state.books;
    $('results-grid').innerHTML = books.length ? books.map(book => `
        <article class="book-card">
            <a class="book-link" href="compra.html?book=${encodeURIComponent(book.id)}&retorno=${encodeURIComponent('livros.html' + location.search)}" data-book-id="${escapeHtml(book.id)}">
                <div class="book-cover-shell"><img data-cover="${escapeHtml(book.id)}" alt="Capa de ${escapeHtml(book.title)}" loading="lazy" decoding="async"></div>
                <div class="book-copy">
                    <h3 ${book.titleLanguage === 'en' ? 'lang="en"' : ''}>${escapeHtml(book.title)}</h3>
                    ${book.titleNote ? `<p class="edition-note">${escapeHtml(book.titleNote)}</p>` : ''}
                    <p class="book-author">${escapeHtml(book.author)}</p>
                    <p class="book-description">${escapeHtml(book.description)}</p>
                    <div class="book-meta"><span>${escapeHtml(book.year)}</span><span>${book.publicDomain ? 'Leitura disponível' : 'Acervo geral'}</span></div>
                </div>
            </a>
        </article>`).join('') : '<div class="catalog-empty"><h3>Nenhuma obra para mostrar</h3><p>Pesquise pelo título em inglês ou português, ou remova alguns filtros.</p></div>';
    $('results-grid').querySelectorAll('[data-cover]').forEach(image => {
        const book = state.books.find(item => item.id === image.dataset.cover);
        const sources = [...new Set([...(book.coverCandidates || []), book.cover].filter(Boolean))];
        let index = 0;
        image.onerror = () => { if (++index < sources.length) image.src = sources[index]; else image.onerror = null; };
        if (sources.length) image.src = sources[0];
    });
};
const search = async ({append = false} = {}) => {
    state.controller?.abort();
    const controller = new AbortController();
    state.controller = controller;
    const page = append ? state.page + 1 : 1;
    if (!append) { state.books = []; state.page = 0; $('results-grid').replaceChildren(); }
    $('results-grid').setAttribute('aria-busy', 'true');
    $('catalog-load-more').disabled = true;
    $('catalog-retry').hidden = true;
    $('catalog-status').textContent = append ? 'Carregando mais livros…' : 'Buscando livros…';
    try {
        const result = await api.searchBooks({query: state.query, page, limit: RESULTS_PER_PAGE, filters: state.filters, signal: controller.signal});
        if (state.controller !== controller || controller.signal.aborted) return;
        state.books = [...new Map([...state.books, ...result.books].map(book => [book.id, book])).values()];
        state.page = page;
        state.total = result.total;
        state.hasMore = result.hasMore ?? page * RESULTS_PER_PAGE < result.total;
        state.source = result.source || 'remote';
        render(); status(); saveSnapshot();
    } catch (error) {
        if (state.controller !== controller || controller.signal.aborted) return;
        retryAppend = append;
        $('catalog-status').textContent = 'Não foi possível consultar o acervo. Verifique sua conexão e tente novamente.';
        $('catalog-retry').hidden = false;
        $('catalog-load-more').hidden = true;
        if (!append) $('results-grid').replaceChildren();
    } finally {
        if (state.controller === controller) {
            $('results-grid').setAttribute('aria-busy', 'false');
            $('catalog-load-more').disabled = false;
        }
    }
};
const restore = () => {
    try {
        const saved = JSON.parse(sessionStorage.getItem(snapshotKey));
        if (saved?.url !== location.search || Date.now() - saved.savedAt > 30 * 60 * 1000 || !Array.isArray(saved.books)) return false;
        for (const key of ['books','page','total','hasMore','source']) state[key] = saved[key];
        render(); status();
        requestAnimationFrame(() => scrollTo(0, saved.scrollY || 0));
        return true;
    } catch { return false; }
};
$('catalog-search-form').addEventListener('submit', event => {
    event.preventDefault();
    try {
        state.filters = normalizeFilters({author: $('catalog-author').value, from: $('catalog-from').value, to: $('catalog-to').value, publicOnly: $('catalog-public').checked});
        state.query = $('catalog-search').value.trim() || DEFAULT_QUERY;
        state.label = state.query;
        writeUrl(true); syncControls(); search();
    } catch (error) { $('catalog-status').textContent = error.message; }
});
$('catalog-reset').addEventListener('click', () => {
    state.filters = normalizeFilters(); syncControls(); writeUrl(true); search();
});
$('catalog-sort').addEventListener('change', event => {
    state.sort = event.target.value; writeUrl(); render(); saveSnapshot();
});
$('catalog-load-more').addEventListener('click', () => search({append: true}));
$('catalog-retry').addEventListener('click', () => search({append: retryAppend}));
$('results-grid').addEventListener('click', event => {
    const link = event.target.closest('[data-book-id]');
    if (!link) return;
    saveSnapshot();
    try { sessionStorage.setItem('bosque-selected-book', JSON.stringify(state.books.find(book => book.id === link.dataset.bookId))); } catch { /* URL resolves independently. */ }
});
$('topics-grid').innerHTML = topicThemes.map((topic, index) => `<button class="topic-card" type="button" data-topic="${index}"><strong>${escapeHtml(topic.label)}</strong><span>${escapeHtml(topic.description)}</span></button>`).join('');
$('topics-grid').addEventListener('click', event => {
    const button = event.target.closest('[data-topic]');
    if (!button) return;
    const topic = topicThemes[button.dataset.topic];
    state.query = topic.query || DEFAULT_QUERY; state.label = topic.label;
    state.filters = normalizeFilters({publicOnly: topic.publicDomain});
    writeUrl(true); syncControls(); search();
});
window.addEventListener('pagehide', saveSnapshot);
window.addEventListener('popstate', () => {
    state.controller?.abort();
    try { readUrl(); syncControls(); if (!restore()) search(); } catch (error) { $('catalog-status').textContent = error.message; }
});
try { readUrl(); syncControls(); if (!restore()) search(); } catch (error) { $('catalog-status').textContent = error.message; }
