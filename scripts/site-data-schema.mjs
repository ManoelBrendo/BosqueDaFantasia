const EDITORIAL_STATUSES = new Set(["rascunho", "revisado", "publicado"]);
const STABLE_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const collectionRules = {
    bookRecords: {
        fields: ["title", "originalTitle", "author", "year", "cover", "description"]
    },
    authorRecords: {
        fields: ["name", "summary", "bestFor", "climate"],
        arrays: ["works"]
    },
    glossaryRecords: {
        fields: ["term", "category", "short", "long"]
    },
    topicThemeRecords: {
        fields: ["label", "query", "description"]
    },
    readingPathRecords: {
        fields: ["name", "description", "focusLabel", "focusQuery"],
        arrays: ["bookIds"]
    }
};

export const validateSiteData = (collections) => {
    const errors = [];
    const seenIds = new Map();

    if (!collections || typeof collections !== "object" || Array.isArray(collections)) {
        return ["Dados editoriais: esperado um objeto de colecoes."];
    }

    for (const [collectionName, rules] of Object.entries(collectionRules)) {
        const collection = collections[collectionName];

        if (!Array.isArray(collection)) {
            errors.push(`${collectionName}: esperado um array.`);
            continue;
        }

        collection.forEach((item, index) => {
            const location = `${collectionName}[${index}]`;

            if (!item || typeof item !== "object" || Array.isArray(item)) {
                errors.push(`${location}: esperado um objeto.`);
                return;
            }

            if (typeof item.id !== "string" || !STABLE_ID_PATTERN.test(item.id)) {
                errors.push(`${location}.id: use um identificador estavel em kebab-case.`);
            } else if (seenIds.has(item.id)) {
                errors.push(`${location}.id: "${item.id}" duplicado em ${seenIds.get(item.id)}.`);
            } else {
                seenIds.set(item.id, location);
            }

            if (!EDITORIAL_STATUSES.has(item.editorialStatus)) {
                errors.push(`${location}.editorialStatus: use rascunho, revisado ou publicado.`);
            }

            for (const field of rules.fields) {
                if (typeof item[field] !== "string" || item[field].trim() === "") {
                    errors.push(`${location}.${field}: campo obrigatorio.`);
                }
            }

            for (const field of rules.arrays || []) {
                if (!Array.isArray(item[field]) || item[field].length === 0) {
                    errors.push(`${location}.${field}: esperado um array nao vazio.`);
                }
            }
        });
    }

    const books = Array.isArray(collections.bookRecords) ? collections.bookRecords : [];
    const readingPaths = Array.isArray(collections.readingPathRecords) ? collections.readingPathRecords : [];
    const bookIds = new Set(books.map((book) => book?.id));
    for (const [index, readingPath] of readingPaths.entries()) {
        for (const bookId of readingPath?.bookIds || []) {
            if (!bookIds.has(bookId)) {
                errors.push(`readingPathRecords[${index}].bookIds: livro "${bookId}" nao existe na curadoria.`);
            }
        }
    }

    return errors;
};

export const siteDataContract = Object.freeze({
    editorialStatuses: [...EDITORIAL_STATUSES],
    stableIdPattern: STABLE_ID_PATTERN.source,
    collections: Object.fromEntries(
        Object.entries(collectionRules).map(([name, rules]) => [
            name,
            Object.freeze({
                required: Object.freeze(["id", "editorialStatus", ...rules.fields]),
                arrays: Object.freeze(rules.arrays || [])
            })
        ])
    )
});
