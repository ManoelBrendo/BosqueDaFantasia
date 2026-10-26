const SHELL_CACHE = "bosque-shell-v25";
const RUNTIME_CACHE = "bosque-runtime-v25";
const APP_SHELL = [
    "./site-config.js",
    "./assets/forest-fallback.svg",
    "./assets/design-system.css",
    "./assets/js/site-ui.js",
    "./assets/js/cover-images.js",
    "./search-policy.js",
    "./login.html",
    "./login.js",
    "./login.css",
    "./assets/site-polish.css",
    "./",
    "./index.html",
    "./livros.html",
    "./compra.html",
    "./app.js",
    "./render-books.js",
    "./search-quality.js",
    "./fantasy-effects.js",
    "./account-api.js",
    "./account-panel.js",
    "./assets/js/books-page.js",
    "./assets/js/purchase-page.js",
    "./audio-player.js",
    "./catalog-api.js",
    "./library-db.js",
    "./open-library-api.js",
    "./pwa.js",
    "./site-data.js",
    "./data/editorial.js",
    "./data/books.js",
    "./data/authors.js",
    "./data/glossary.js",
    "./data/themes.js",
    "./recommendation-engine.js",
    "./manifest.webmanifest",
    "./bosque-icon.svg",
    "./CREDITOS-IMAGENS.md"
];

const RUNTIME_HOSTS = new Set([
    "openlibrary.org",
    "covers.openlibrary.org",
    "upload.wikimedia.org",
    "commons.wikimedia.org"
]);

const cacheFirst = async (request, cacheName) => {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request, { ignoreSearch: request.mode === "navigate" });

    if (cachedResponse) {
        return cachedResponse;
    }

    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
        cache.put(request, networkResponse.clone());
    }
    return networkResponse;
};

const networkFirst = async (request, cacheName) => {
    const cache = await caches.open(cacheName);

    try {
        const response = await fetch(request);
        if (response.ok) {
            await cache.put(request, response.clone());
        }
        return response;
    } catch (error) {
        const cachedResponse = await cache.match(request);
        if (cachedResponse) return cachedResponse;
        throw error;
    }
};

const staleWhileRevalidate = async (request, cacheName) => {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    const networkPromise = fetch(request)
        .then((response) => {
            if (response.ok) {
                cache.put(request, response.clone());
            }
            return response;
        })
        .catch(() => cachedResponse);

    return cachedResponse || networkPromise;
};

self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(SHELL_CACHE)
            .then((cache) => cache.addAll(APP_SHELL))
    );
});

self.addEventListener("message", (event) => {
    if (event.data?.type === "SKIP_WAITING") {
        self.skipWaiting();
    }
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys
                    .filter((key) => (key.startsWith("bosque-shell-") || key.startsWith("bosque-runtime-")) && key !== SHELL_CACHE && key !== RUNTIME_CACHE)
                    .map((key) => caches.delete(key))
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener("fetch", (event) => {
    if (event.request.method !== "GET") {
        return;
    }

    const requestUrl = new URL(event.request.url);

    if (requestUrl.pathname.startsWith("/api/")) {
        return;
    }

    if (event.request.headers.has("range")) {
        return;
    }

    if (event.request.mode === "navigate") {
        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    const responseClone = response.clone();
                    caches.open(SHELL_CACHE).then((cache) => cache.put(event.request, responseClone));
                    return response;
                })
                .catch(async () => {
                    return await caches.match(event.request, { ignoreSearch: true })
                        || await caches.match("./index.html", { ignoreSearch: true });
                })
        );
        return;
    }

    if (requestUrl.origin === self.location.origin) {
        if (requestUrl.pathname === new URL("./site-config.js", self.location.href).pathname) {
            event.respondWith(networkFirst(event.request, SHELL_CACHE));
            return;
        }
        event.respondWith(cacheFirst(event.request, SHELL_CACHE));
        return;
    }

    if (requestUrl.hostname === "openlibrary.org" && requestUrl.pathname.endsWith(".json")) return;

    if (RUNTIME_HOSTS.has(requestUrl.hostname)) {
        event.respondWith(staleWhileRevalidate(event.request, RUNTIME_CACHE));
    }
});
