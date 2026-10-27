const DB_NAME = "bosque-da-fantasia-db";
const DB_VERSION = 2;
const QUERY_STORE = "queries";
const BOOK_STORE = "books";
const META_STORE = "meta";
const STATE_STORE = "state";

const supportsIndexedDb = () => {
    return typeof window !== "undefined" && "indexedDB" in window;
};

const openDatabase = () => {
    return new Promise((resolve, reject) => {
        const request = window.indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = () => {
            const database = request.result;

            if (!database.objectStoreNames.contains(QUERY_STORE)) {
                database.createObjectStore(QUERY_STORE, { keyPath: "id" });
            }

            if (!database.objectStoreNames.contains(BOOK_STORE)) {
                database.createObjectStore(BOOK_STORE, { keyPath: "id" });
            }

            if (!database.objectStoreNames.contains(META_STORE)) {
                database.createObjectStore(META_STORE, { keyPath: "id" });
            }

            if (!database.objectStoreNames.contains(STATE_STORE)) {
                database.createObjectStore(STATE_STORE, { keyPath: "id" });
            }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

const runStoreAction = async (storeName, mode, handler) => {
    const database = await openDatabase();

    return new Promise((resolve, reject) => {
        const transaction = database.transaction(storeName, mode);
        const store = transaction.objectStore(storeName);
        const result = handler(store);

        transaction.oncomplete = () => {
            database.close();
            resolve(result);
        };

        transaction.onerror = () => {
            database.close();
            reject(transaction.error);
        };
    });
};

const readRequest = (request) => {
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
    });
};

const getAllRequest = (store) => {
    return new Promise((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
    });
};

const normalizeSearchTerm = (value) => {
    return String(value || "")
        .replace(/^subject:/i, "")
        .replace(/^subject_key:/i, "")
        .replace(/^"+|"+$/g, "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, " ")
        .trim();
};

const scoreBookForQuery = (book, normalizedQuery) => {
    const fields = [
        book.title,
        book.originalTitle,
        book.portugueseTitle,
        book.author,
        book.description,
        book.aura,
        book.whyRead,
        ...(Array.isArray(book.themes) ? book.themes : [])
    ];

    const haystack = normalizeSearchTerm(fields.join(" "));

    if (!haystack) {
        return 0;
    }

    if (haystack.includes(normalizedQuery)) {
        return normalizedQuery.length * 4;
    }

    const queryTokens = normalizedQuery.split(" ").filter(Boolean);

    return queryTokens.reduce((score, token) => {
        return haystack.includes(token) ? score + token.length : score;
    }, 0);
};

export class BosqueLibraryDb {
    constructor() {
        this.enabled = supportsIndexedDb();
    }

    async putQuery(id, payload) {
        if (!this.enabled) {
            return;
        }

        await runStoreAction(QUERY_STORE, "readwrite", (store) => {
            store.put({
                id,
                savedAt: Date.now(),
                payload
            });
        });
    }

    async getQuery(id) {
        if (!this.enabled) {
            return null;
        }

        return runStoreAction(QUERY_STORE, "readonly", async (store) => {
            const entry = await readRequest(store.get(id));
            return entry?.payload || null;
        });
    }

    async storeBooks(books) {
        if (!this.enabled || !Array.isArray(books)) {
            return;
        }

        await runStoreAction(BOOK_STORE, "readwrite", (store) => {
            books.forEach((book) => {
                store.put(book);
            });
        });
    }

    async storeMeta(id, payload) {
        if (!this.enabled) {
            return;
        }

        await runStoreAction(META_STORE, "readwrite", (store) => {
            store.put({
                id,
                payload,
                savedAt: Date.now()
            });
        });
    }

    async getMeta(id) {
        if (!this.enabled) {
            return null;
        }

        return runStoreAction(META_STORE, "readonly", async (store) => {
            const entry = await readRequest(store.get(id));
            return entry?.payload || null;
        });
    }

    async setState(id, payload) {
        if (!this.enabled) {
            return;
        }

        await runStoreAction(STATE_STORE, "readwrite", (store) => {
            store.put({
                id,
                payload,
                savedAt: Date.now()
            });
        });
    }

    async getState(id) {
        if (!this.enabled) {
            return null;
        }

        return runStoreAction(STATE_STORE, "readonly", async (store) => {
            const entry = await readRequest(store.get(id));
            return entry?.payload || null;
        });
    }

    async getAllBooks() {
        if (!this.enabled) {
            return [];
        }

        return runStoreAction(BOOK_STORE, "readonly", async (store) => {
            return getAllRequest(store);
        });
    }

    async searchBooks(query, limit = 9) {
        if (!this.enabled) {
            return [];
        }

        const normalizedQuery = normalizeSearchTerm(query);

        if (!normalizedQuery) {
            return [];
        }

        const books = await this.getAllBooks();

        return books
            .map((book) => ({
                book,
                score: scoreBookForQuery(book, normalizedQuery)
            }))
            .filter((entry) => entry.score > 0)
            .sort((left, right) => {
                if (right.score !== left.score) {
                    return right.score - left.score;
                }

                return String(left.book.title || "").localeCompare(String(right.book.title || ""), "pt-BR");
            })
            .slice(0, limit)
            .map((entry) => entry.book);
    }
}
