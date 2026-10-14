import { buildSearchQuery } from "./search-policy.js";
import { rankAndDeduplicateBooks } from "./search-quality.js";
const OPEN_LIBRARY_SEARCH_URL = "https://openlibrary.org/search.json";
const OPEN_LIBRARY_COVER_SIZE = "M";
const SEARCH_CACHE_PREFIX = "bosque-cache:portuguese-titles-v1:";
const SEARCH_CACHE_TTL_MS = 1000 * 60 * 60 * 12;
const OPEN_LIBRARY_FIELDS = [
    "key",
    "title",
    "author_name",
    "first_publish_year",
    "cover_i",
    "cover_edition_key",
    "edition_key",
    "isbn",
    "edition_count",
    "ebook_access",
    "has_fulltext",
    "ia",
    "public_scan_b",
    "subject",
    "language",
    "editions",
    "editions.title",
    "editions.language",
    "editions.key",
    "editions.cover_i",
    "editions.ebook_access"
].join(",");

const SUBJECT_TRANSLATIONS = new Map([
    ["fantasy", "fantasia"],
    ["magic", "magia"],
    ["wizards", "magos"],
    ["witches", "bruxas"],
    ["dragons", "dragoes"],
    ["elves", "elfos"],
    ["fairies", "fadas"],
    ["fairy tales", "contos de fadas"],
    ["mythology", "mitologia"],
    ["celtic mythology", "mitologia celta"],
    ["arthurian romance", "lendas arturianas"],
    ["knights", "cavaleiros"],
    ["castles", "castelos"],
    ["adventure", "aventura"],
    ["quests", "jornadas"],
    ["heroes", "herois"],
    ["legends", "lendas"],
    ["folklore", "folclore"],
    ["monsters", "monstros"],
    ["epic", "epico"],
    ["good and evil", "conflito entre luz e sombra"],
    ["friendship", "amizade"],
    ["coming of age", "amadurecimento"],
    ["princesses", "princesas"],
    ["kings and rulers", "reis e governantes"],
    ["forests", "florestas"],
    ["medieval", "ambiente medieval"],
    ["love", "amor"],
    ["mystery", "misterio"],
    ["juvenile fiction", "aventura juvenil"],
    ["young adult fiction", "fantasia jovem"],
    ["sword and sorcery", "espada e feiticaria"]
]);

const TITLE_TRANSLATIONS = new Map([
    ["the king of elfland's daughter", "A Filha do Rei de Elfland"],
    ["the princess and the goblin", "A Princesa e o Goblin"],
    ["the well at the world's end", "O Poço no Fim do Mundo"],
    ["alice's adventures in wonderland", "Alice no País das Maravilhas"],
    ["the wonderful wizard of oz", "O Maravilhoso Mágico de Oz"],
    ["the lord of the rings", "O Senhor dos Anéis"],
    ["the hobbit", "O Hobbit"],
    ["the chronicles of narnia", "As Crônicas de Nárnia"],
    ["harry potter and the philosopher's stone", "Harry Potter e a Pedra Filosofal"],
    ["the english edition", "A Edição em Inglês"],
    ["english edition", "Edição em Inglês"]
]);

const TITLE_WORD_TRANSLATIONS = new Map([
    ["the", "o"],
    ["a", "a"],
    ["an", "um"],
    ["and", "e"],
    ["of", "de"],
    ["at", "em"],
    ["in", "em"],
    ["on", "sobre"],
    ["to", "para"],
    ["from", "de"],
    ["the", "o"],
    ["king", "rei"],
    ["queen", "rainha"],
    ["princess", "princesa"],
    ["prince", "príncipe"],
    ["daughter", "filha"],
    ["son", "filho"],
    ["child", "criança"],
    ["children", "crianças"],
    ["book", "livro"],
    ["books", "livros"],
    ["chronicles", "crônicas"],
    ["tales", "contos"],
    ["story", "história"],
    ["stories", "histórias"],
    ["world", "mundo"],
    ["land", "terra"],
    ["lands", "terras"],
    ["wood", "floresta"],
    ["forest", "floresta"],
    ["house", "casa"],
    ["castle", "castelo"],
    ["road", "estrada"],
    ["journey", "jornada"],
    ["adventure", "aventura"],
    ["adventures", "aventuras"],
    ["magic", "magia"],
    ["wizard", "mago"],
    ["witch", "bruxa"],
    ["dragon", "dragão"],
    ["dragons", "dragões"],
    ["goblin", "goblin"],
    ["goblins", "goblins"],
    ["dark", "sombrio"],
    ["light", "luz"],
    ["last", "último"],
    ["first", "primeiro"],
    ["great", "grande"],
    ["little", "pequeno"],
    ["wonderful", "maravilhoso"],
    ["secret", "secreto"],
    ["english", "inglês"],
    ["edition", "edição"],
    ["editions", "edições"]
]);

const translateTitle = (title) => {
    const original = normalizeSpaces(title);
    const knownTranslation = TITLE_TRANSLATIONS.get(normalizeLookup(original));

    if (knownTranslation) return knownTranslation;

    const translated = original
        .split(/(\s+|[:;,.!?'"-])/)
        .map((part) => {
            const translation = TITLE_WORD_TRANSLATIONS.get(normalizeLookup(part));
            return translation ? translation : part;
        })
        .join("")
        .replace(/\s+([:;,.!?])/g, "$1");

    return translated ? translated.charAt(0).toUpperCase() + translated.slice(1) : original;
};

const OPEN_LICENSE_FALLBACKS = [
    {
        titles: ["lud in the mist"],
        authors: ["hope mirrlees"],
        cover: "https://commons.wikimedia.org/wiki/Special:FilePath/Lud-in-the-Mist%201926%20cover.jpg?width=720"
    },
    {
        titles: ["lilith"],
        authors: ["george macdonald"],
        cover: "https://commons.wikimedia.org/wiki/Special:FilePath/Lilith%20a%20romance%20by%20George%20MacDonald.jpg?width=720"
    },
    {
        titles: ["the wood beyond the world", "wood beyond the world"],
        authors: ["william morris"],
        cover: "https://commons.wikimedia.org/wiki/Special:FilePath/The%20wood%20beyond%20the%20world%20by%20William%20Morris%20%28cropped%29.jpg?width=720"
    },
    {
        titles: ["the house of the wolfings", "house of the wolfings"],
        authors: ["william morris"],
        cover: "https://commons.wikimedia.org/wiki/Special:FilePath/House%20of%20the%20Wolfings%20Title%20Page%20First%20Edition%201889.jpg?width=720"
    },
    {
        titles: ["phantastes"],
        authors: ["george macdonald"],
        cover: "https://commons.wikimedia.org/wiki/Special:FilePath/Phantastes%20Title%20Page%201894.jpg?width=720"
    },
    {
        titles: ["the princess and the goblin", "princess and the goblin"],
        authors: ["george macdonald"],
        cover: "https://commons.wikimedia.org/wiki/Special:FilePath/Princess%20and%20the%20Goblin.jpg?width=720"
    },
    {
        titles: ["the king of elfland's daughter", "the king of elflands daughter"],
        authors: ["lord dunsany", "edward john moreton drax plunkett dunsany"],
        cover: "https://commons.wikimedia.org/wiki/Special:FilePath/The%20Hunting%20of%20the%20Unicorn%20by%20Samuel%20Simes%2C%20Frontispiece%20to%20The%20King%20of%20Elfland%27s%20Daughter.png?width=720"
    },
    {
        titles: ["the well at the world's end", "the well at the worlds end"],
        authors: ["william morris"],
        cover: "https://commons.wikimedia.org/wiki/Special:FilePath/The%20Well%20at%20the%20World%27s%20End%2C%20design%20by%20William%20Morris%2C%20Hammersmith%2C%20Kelmscott%20Press%2C%201896%20-%20National%20Gallery%20of%20Art%2C%20Washington%20-%20DSC09794.JPG?width=720"
    }
];

const buildFallbackCover = () => {
    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 460">
            <rect width="320" height="460" rx="26" fill="#15261f"/>
            <rect x="16" y="16" width="288" height="428" rx="22" fill="#20382f" stroke="#dcbf83" stroke-width="3"/>
            <path d="M58 88h204M58 134h164M58 180h186" stroke="#f0dfb0" stroke-width="8" stroke-linecap="round" opacity=".45"/>
            <circle cx="160" cy="286" r="48" fill="none" stroke="#dcbf83" stroke-width="3" opacity=".45"/>
            <text x="160" y="295" text-anchor="middle" font-size="26" fill="#f7efdc" font-family="Georgia, serif">Sem capa</text>
        </svg>
    `.trim();

    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

const normalizeSpaces = (value) => {
    return String(value || "").replace(/\s+/g, " ").trim();
};

const normalizeLookup = (value) => {
    return normalizeSpaces(value)
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, " ")
        .trim();
};

const unique = (values) => {
    return [...new Set(values.filter(Boolean))];
};

const getStorage = () => {
    try {
        return window.localStorage;
    } catch {
        return null;
    }
};

const buildCacheKey = (url) => {
    return `${SEARCH_CACHE_PREFIX}${url}`;
};

const readCachedSearch = (url) => {
    const storage = getStorage();

    if (!storage) {
        return null;
    }

    try {
        const rawValue = storage.getItem(buildCacheKey(url));

        if (!rawValue) {
            return null;
        }

        const parsedValue = JSON.parse(rawValue);
        const isFresh = Number(parsedValue?.savedAt) > 0 && (Date.now() - Number(parsedValue.savedAt)) < SEARCH_CACHE_TTL_MS;

        if (!isFresh || !parsedValue?.data) {
            storage.removeItem(buildCacheKey(url));
            return null;
        }

        return parsedValue.data;
    } catch {
        return null;
    }
};

const writeCachedSearch = (url, data) => {
    const storage = getStorage();

    if (!storage) {
        return;
    }

    try {
        storage.setItem(buildCacheKey(url), JSON.stringify({
            savedAt: Date.now(),
            data
        }));
    } catch {
        // Ignora limites de armazenamento e mantem o fluxo normal da aplicacao.
    }
};

const translateSubject = (subject) => {
    const normalized = normalizeSpaces(subject).toLowerCase();

    if (SUBJECT_TRANSLATIONS.has(normalized)) {
        return SUBJECT_TRANSLATIONS.get(normalized);
    }

    if (/^[a-z0-9 ,'"-]+$/u.test(normalized)) {
        return "";
    }

    return normalizeSpaces(subject).toLowerCase();
};

const pickSubjects = (subjects = [], limit = 4) => {
    return subjects
        .map(translateSubject)
        .filter(Boolean)
        .slice(0, limit);
};

const formatSubjectList = (subjects) => {
    if (subjects.length === 0) {
        return "";
    }

    if (subjects.length === 1) {
        return subjects[0];
    }

    if (subjects.length === 2) {
        return `${subjects[0]} e ${subjects[1]}`;
    }

    return `${subjects[0]}, ${subjects[1]} e ${subjects[2]}`;
};

const inferClimateKey = (subjects) => {
    if (subjects.some((subject) => subject.includes("elfos") || subject.includes("fadas") || subject.includes("contos de fadas"))) {
        return "elfico";
    }

    if (subjects.some((subject) => subject.includes("mitologia celta") || subject.includes("lendas arturianas") || subject.includes("lendas"))) {
        return "mitico";
    }

    if (subjects.some((subject) => subject.includes("cavaleiros") || subject.includes("castelos") || subject.includes("ambiente medieval"))) {
        return "medieval";
    }

    if (subjects.some((subject) => subject.includes("magia") || subject.includes("misterio"))) {
        return "iniciatico";
    }

    return "iniciatico";
};

const inferClimateLabel = (climateKey) => {
    if (climateKey === "elfico") {
        return "Feerico e boscoso";
    }

    if (climateKey === "mitico") {
        return "Mitico e ritual";
    }

    if (climateKey === "medieval") {
        return "Medieval de estrada";
    }

    return "Onirico e iniciatico";
};

const inferAtmosphere = (subjects) => {
    const climateKey = inferClimateKey(subjects);

    if (climateKey === "elfico") {
        return "uma atmosfera feerica e de floresta encantada";
    }

    if (climateKey === "mitico") {
        return "um tom mitico e ritual, ligado a lendas antigas";
    }

    if (climateKey === "medieval") {
        return "uma paisagem medieval de jornada, corte e destino";
    }

    return "uma jornada fantastica guiada por encanto, descoberta e imaginacao";
};

const inferMotifKey = (subjects) => {
    if (subjects.some((subject) => subject.includes("elfos") || subject.includes("fadas") || subject.includes("contos de fadas"))) {
        return "feerico";
    }

    if (subjects.some((subject) => subject.includes("mitologia celta") || subject.includes("lendas arturianas") || subject.includes("lendas"))) {
        return "mitologia";
    }

    if (subjects.some((subject) => subject.includes("cavaleiros") || subject.includes("castelos") || subject.includes("ambiente medieval"))) {
        return "cavaleiros";
    }

    if (subjects.some((subject) => subject.includes("dragoes") || subject.includes("monstros"))) {
        return "criaturas";
    }

    return "magia";
};

const inferDifficulty = ({ subjects, editionCount, year }) => {
    if (subjects.some((subject) => subject.includes("aventura juvenil") || subject.includes("fantasia jovem"))) {
        return { key: "entrada", label: "Entrada amigavel" };
    }

    if (editionCount >= 120) {
        return { key: "entrada", label: "Entrada popular" };
    }

    if (Number(year) > 0 && Number(year) < 1880 && subjects.some((subject) => subject.includes("mitologia") || subject.includes("simbolo") || subject.includes("contos de fadas"))) {
        return { key: "denso", label: "Denso e antigo" };
    }

    if (subjects.some((subject) => subject.includes("epico") || subject.includes("ambiente medieval") || subject.includes("jornadas"))) {
        return { key: "intermediario", label: "Intermediario de jornada" };
    }

    return { key: "intermediario", label: "Intermediario de descoberta" };
};

const buildReaderProfile = ({ climateKey, difficultyLabel }) => {
    if (climateKey === "elfico") {
        return `Bom para quem procura encanto, delicadeza e um texto com ${difficultyLabel.toLowerCase()}.`;
    }

    if (climateKey === "mitico") {
        return `Indicado a leitores que gostam de simbolos, lenda antiga e um percurso ${difficultyLabel.toLowerCase()}.`;
    }

    if (climateKey === "medieval") {
        return `Funciona bem para quem prefere castelos, viagem e aventura com leitura ${difficultyLabel.toLowerCase()}.`;
    }

    return `Serve a quem quer fantasia mais contemplativa, introspectiva e de leitura ${difficultyLabel.toLowerCase()}.`;
};

const buildWhyRead = ({ author, climateKey, themes }) => {
    const themeSummary = formatSubjectList(themes.slice(0, 3));

    if (climateKey === "elfico") {
        return `Vale ler para sentir como ${author} trabalha encanto, estranheza e proximidade com ${themeSummary || "o maravilhoso"}.`;
    }

    if (climateKey === "mitico") {
        return `Vale ler para ampliar a trilha de mito, ritual e memoria oral ligada a ${themeSummary || "fantasia de raiz antiga"}.`;
    }

    if (climateKey === "medieval") {
        return `Vale ler para expandir a sensacao de estrada, cronica e aventura em torno de ${themeSummary || "jornada medieval"}.`;
    }

    return `Vale ler para descobrir uma face mais simbolica da fantasia, ligada a ${themeSummary || "transformacao interior"}.`;
};

const buildAuthorNote = ({ author, editionCount }) => {
    if (editionCount > 0) {
        return `${author} aparece com ${editionCount} edicoes registradas nesta trilha do acervo, o que ajuda a aprofundar a pesquisa depois da obra inicial.`;
    }

    return `${author} aparece aqui como porta de expansao do acervo, mesmo quando os metadados da obra chegam de forma parcial.`;
};

const truncateText = (value, limit = 220) => {
    const normalized = normalizeSpaces(value);

    if (!normalized || normalized.length <= limit) {
        return normalized;
    }

    return `${normalized.slice(0, limit).replace(/[ ,;:.!?-]+$/u, "")}...`;
};

const buildPortugueseDescription = ({ author, year, editionCount, subjects }) => {
    const translatedSubjects = pickSubjects(subjects);
    const subjectSummary = formatSubjectList(translatedSubjects);
    const atmosphere = inferAtmosphere(translatedSubjects);
    const yearText = year && year !== "Ano nao informado"
        ? `Primeira edicao conhecida em ${year}.`
        : "Ano de publicacao nao informado.";

    if (subjectSummary) {
        return truncateText(`Obra de ${author} ligada a ${subjectSummary}, com ${atmosphere}. ${yearText}`);
    }

    if (editionCount) {
        return truncateText(`Livro de ${author} com ${editionCount} edicoes registradas no acervo, associado a ${atmosphere}. ${yearText}`);
    }

    return truncateText(`Livro de ${author} associado a ${atmosphere}. ${yearText}`);
};

const buildOpenLibraryCoverUrl = (key, value) => {
    return `https://covers.openlibrary.org/b/${key}/${value}-${OPEN_LIBRARY_COVER_SIZE}.jpg?default=false`;
};

const findOpenLicenseFallback = ({ title, author }) => {
    const normalizedTitle = normalizeLookup(title);
    const normalizedAuthor = normalizeLookup(author);

    const match = OPEN_LICENSE_FALLBACKS.find((entry) => {
        const titleMatches = entry.titles.some((entryTitle) => {
            return normalizedTitle === entryTitle
                || normalizedTitle.includes(entryTitle)
                || entryTitle.includes(normalizedTitle);
        });

        if (!titleMatches) {
            return false;
        }

        return entry.authors.some((entryAuthor) => {
            return normalizedAuthor === entryAuthor
                || normalizedAuthor.includes(entryAuthor)
                || entryAuthor.includes(normalizedAuthor);
        });
    });

    return match?.cover || "";
};

const buildCoverCandidates = (doc) => {
    const candidates = [];

    if (doc.cover_i) {
        candidates.push(buildOpenLibraryCoverUrl("id", doc.cover_i));
    }

    if (doc.cover_edition_key) {
        candidates.push(buildOpenLibraryCoverUrl("olid", doc.cover_edition_key));
    }

    (doc.edition_key || []).slice(0, 2).forEach((editionKey) => {
        candidates.push(buildOpenLibraryCoverUrl("olid", editionKey));
    });

    const rightsClearedFallback = findOpenLicenseFallback({
        title: doc.title,
        author: doc.author_name?.[0] || ""
    });

    if (rightsClearedFallback) {
        candidates.push(rightsClearedFallback);
    }

    (doc.isbn || [])
        .map((isbn) => normalizeSpaces(isbn).replace(/[^0-9Xx]/g, ""))
        .filter(Boolean)
        .slice(0, 1)
        .forEach((isbn) => {
            candidates.push(buildOpenLibraryCoverUrl("isbn", isbn));
        });

    return unique(candidates);
};

const buildBookRecord = (doc, placeholderCover) => {
    const portugueseEdition = (doc.editions?.docs || []).find(item => item.title && item.language?.some(language => {
        const key = typeof language === "string" ? language : language.key;
        return key === "por" || key === "pt" || key === "/languages/por";
    }));
    const edition = (doc.editions?.docs || []).find(item => item.title && item.language?.some(language => {
        const key = typeof language === "string" ? language : language.key;
        return key === "eng" || key === "/languages/eng";
    }));
    const author = doc.author_name?.[0] || "Autor nao informado";
    const year = doc.first_publish_year || "Ano nao informado";
    const originalTitle = normalizeSpaces(edition?.title || doc.title);
    const translatedTitle = normalizeSpaces(portugueseEdition?.title || translateTitle(originalTitle));
    const subjects = pickSubjects(doc.subject || []);
    const climateKey = inferClimateKey(subjects);
    const difficulty = inferDifficulty({
        subjects,
        editionCount: doc.edition_count || 0,
        year
    });

    return {
        id: doc.key.replace("/works/", "") || `${doc.title}-${doc.first_publish_year || "sem-ano"}`,
        title: translatedTitle,
        titleLanguage: "pt",
        titleNote: translatedTitle !== originalTitle ? `Título original: ${originalTitle}` : "Título em português",
        editionId: portugueseEdition?.key || edition?.key || "",
        originalTitle,
        author,
        year,
        editionCount: doc.edition_count || 0,
        cover: placeholderCover,
        coverCandidates: portugueseEdition
            ? unique([portugueseEdition.cover_i ? buildOpenLibraryCoverUrl("id", portugueseEdition.cover_i) : "", portugueseEdition.key ? buildOpenLibraryCoverUrl("olid", portugueseEdition.key.replace("/books/", "")) : ""])
            : edition
                ? unique([edition.cover_i ? buildOpenLibraryCoverUrl("id", edition.cover_i) : "", edition.key ? buildOpenLibraryCoverUrl("olid", edition.key.replace("/books/", "")) : ""])
                : buildCoverCandidates(doc),
        description: buildPortugueseDescription({
            author,
            year,
            editionCount: doc.edition_count || 0,
            subjects: doc.subject || []
        }),
        aura: inferClimateLabel(climateKey),
        difficulty: difficulty.label,
        difficultyKey: difficulty.key,
        themes: subjects.length > 0 ? subjects : ["fantasia"],
        publicDomain: (portugueseEdition || edition) ? (portugueseEdition || edition).ebook_access === "public" : Boolean(doc.public_scan_b || doc.ebook_access === "public"),
        readUrl: (portugueseEdition || edition)?.key ? `https://openlibrary.org${(portugueseEdition || edition).key}` : Array.isArray(doc.ia) && doc.ia.length > 0
            ? `https://archive.org/details/${doc.ia[0]}`
            : `https://openlibrary.org${doc.key}`,
        readerProfile: buildReaderProfile({
            climateKey,
            difficultyLabel: difficulty.label
        }),
        whyRead: buildWhyRead({
            author,
            climateKey,
            themes: subjects
        }),
        authorNote: buildAuthorNote({
            author,
            editionCount: doc.edition_count || 0
        }),
        filters: {
            clima: climateKey,
            dificuldade: difficulty.key,
            motivo: inferMotifKey(subjects)
        },
        purchaseUrl: "#compra"
    };
};

export class OpenLibraryCatalogApi {
    constructor() {
        this.cache = new Map();
        this.placeholderCover = buildFallbackCover();
    }

    buildUrl({ query, page = 1, limit = 9, filters = {} }) {
        const url = new URL(OPEN_LIBRARY_SEARCH_URL);
        const normalizedQuery = buildSearchQuery(query, filters);
        url.searchParams.set("lang", "en");
        url.searchParams.set("q", normalizedQuery);
        url.searchParams.set("fields", OPEN_LIBRARY_FIELDS);
        url.searchParams.set("page", String(page));
        url.searchParams.set("limit", String(limit));
        return url;
    }

    async searchBooks({ query, page = 1, limit = 9, signal, filters = {} } = {}) {
        signal?.throwIfAborted();
        const normalizedQuery = (query || "subject:fantasy").trim();
        const url = this.buildUrl({ query: normalizedQuery, page, limit, filters }).toString();

        if (this.cache.has(url)) {
            return { ...this.cache.get(url), source: "network-cache" };
        }

        const cachedResult = readCachedSearch(url);

        if (cachedResult) {
            this.cache.set(url, cachedResult);
            return { ...cachedResult, source: "network-cache" };
        }

        const response = await fetch(url, {
            method: "GET",
            headers: {
                Accept: "application/json"
            },
            signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(15000)]) : AbortSignal.timeout(15000)
        });

        if (!response.ok) {
            throw new Error("O acervo nao respondeu agora. Tente novamente em alguns instantes.");
        }

        const payload = await response.json();
        signal?.throwIfAborted();
        const result = {
            source: "remote",
            total: payload.numFound ?? payload.num_found ?? 0,
            page,
            hasMore: page * limit < (payload.numFound ?? payload.num_found ?? 0) && (payload.docs || []).length > 0,
            books: rankAndDeduplicateBooks((payload.docs || [])
                .filter((doc) => doc.title && doc.key)
                .map((doc) => buildBookRecord(doc, this.placeholderCover)), normalizedQuery)
        };

        this.cache.set(url, result);
        writeCachedSearch(url, result);
        return result;
    }

    async searchPublicDomainBooks(options = {}) {
        return this.searchBooks({ ...options, filters: { ...options.filters, publicOnly: true } });
    }

    async getBook(id, { signal } = {}) {
        if (!/^OL\d+W$/.test(id)) return null;
        const result = await this.searchBooks({ query: `key:/works/${id}`, limit: 1, signal });
        return result.books.find(book => book.id === id) || null;
    }
}
