import { featuredBooks } from "../../site-data.js";
import { OpenLibraryCatalogApi } from "../../open-library-api.js";
const $ = id => document.getElementById(id);
const params = new URLSearchParams(location.search);
const id = params.get('book');
const returnValue = params.get('retorno');
try {
    const returnUrl = new URL(returnValue || 'livros.html', location.href);
    if (returnUrl.origin === location.origin && returnUrl.pathname === new URL('livros.html', location.href).pathname) $('purchase-back').href = returnUrl.href;
} catch { /* Keep catalog link. */ }
const render = book => {
    $('purchase-title').textContent = book.title;
    $('purchase-title').lang = book.titleLanguage === 'en' ? 'en' : '';
    document.title = `${book.title} | Bosque da Fantasia`;
    $('purchase-meta').textContent = `${book.author} · ${book.year}`;
    $('purchase-note').textContent = book.description || 'Resumo indisponível no catálogo.';
    $('purchase-edition').textContent = book.titleNote || (book.editionId ? `Registro da edição: ${book.editionId.replace('/books/', '')}` : 'Título apresentado em português.');
    $('purchase-cover').alt = `Capa de ${book.title}`;
    const sources = [...new Set([...(book.coverCandidates || []), book.cover].filter(Boolean))];
    let index = 0;
    $('purchase-cover').onerror = () => { if (++index < sources.length) $('purchase-cover').src = sources[index]; else $('purchase-cover').onerror = null; };
    if (sources.length) $('purchase-cover').src = sources[0];
    const link = $('purchase-source');
    try {
        const url = new URL(book.readUrl);
        if (url.protocol === 'https:' && ['openlibrary.org','archive.org','www.gutenberg.org','gutenberg.org'].includes(url.hostname)) {
            link.href = url.href; link.hidden = false;
            link.textContent = book.publicDomain ? 'Consultar leitura disponível' : 'Ver registro no catálogo';
        }
    } catch { /* A source is optional. */ }
};
const load = async () => {
    $('purchase-retry').hidden = true;
    $('purchase-title').textContent = 'Carregando livro…';
    try {
        let book;
        try { const saved = JSON.parse(sessionStorage.getItem('bosque-selected-book')); if (saved?.id === id && saved.titleLanguage) book = saved; } catch { /* Optional storage. */ }
        book ||= featuredBooks.find(item => item.id === id);
        book ||= await new OpenLibraryCatalogApi().getBook(id || '');
        if (!book) {
            $('purchase-title').textContent = 'Livro não encontrado';
            $('purchase-note').textContent = 'Confira o endereço ou volte ao acervo para escolher uma obra.';
            return;
        }
        render(book);
    } catch {
        $('purchase-title').textContent = 'Não foi possível abrir este livro';
        $('purchase-note').textContent = 'Verifique sua conexão e tente novamente. Sua pesquisa foi preservada.';
        $('purchase-retry').hidden = false;
    }
};
$('purchase-retry').addEventListener('click', load);
load();
