import { featuredBooks } from "./site-data.js";

const normalize = (text) => String(text || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const aliases = new Map(featuredBooks.filter(book => book.portugueseTitle).map(book => [normalize(book.portugueseTitle), book.title]));
for (const [local, english] of Object.entries({
    "o hobbit": "The Hobbit", "o senhor dos aneis": "The Lord of the Rings",
    "a sociedade do anel": "The Fellowship of the Ring", "as duas torres": "The Two Towers",
    "o retorno do rei": "The Return of the King", "um feiticeiro de terramar": "A Wizard of Earthsea"
})) aliases.set(local, english);

export const resolveSearchTerm = (query) => aliases.get(normalize(query)) || String(query || "subject:fantasy").trim();
export const normalizeFilters = (filters = {}) => {
    const year = value => /^\d{1,4}$/.test(String(value || "")) ? Number(value) : null;
    const from = year(filters.from);
    const to = year(filters.to);
    if (from !== null && to !== null && from > to) throw new Error("O ano inicial deve ser menor ou igual ao ano final.");
    return { author: String(filters.author || "").trim().slice(0, 160), from, to, publicOnly: Boolean(filters.publicOnly) };
};
export const buildSearchQuery = (query, filters = {}) => {
    const clean = normalizeFilters(filters);
    const parts = [`(${resolveSearchTerm(query)})`, "language:eng"];
    if (clean.author) parts.push(`author:"${clean.author.replace(/["\\]/g, " ")}"`);
    if (clean.from !== null || clean.to !== null) parts.push(`first_publish_year:[${clean.from ?? "*"} TO ${clean.to ?? "*"}]`);
    if (clean.publicOnly) parts.push("ebook_access:public", "has_fulltext:true");
    return parts.join(" ");
};
export const matchesFilters = (book, filters = {}) => {
    const clean = normalizeFilters(filters);
    const year = Number(book.year);
    return (!clean.author || normalize(book.author).includes(normalize(clean.author)))
        && (clean.from === null || Number.isFinite(year) && year >= clean.from)
        && (clean.to === null || Number.isFinite(year) && year <= clean.to)
        && (!clean.publicOnly || book.publicDomain);
};
