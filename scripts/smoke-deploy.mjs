const siteUrl = process.env.BOSQUE_SITE_URL;
const apiHealthUrl = process.env.BOSQUE_API_HEALTH_URL || "";

if (!siteUrl) {
    throw new Error("BOSQUE_SITE_URL precisa conter a URL publicada do site.");
}

const validateUrl = (value, name) => {
    const url = new URL(value);
    if (url.protocol !== "https:") {
        throw new Error(`${name} deve usar HTTPS.`);
    }
    return url.href;
};

const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

const fetchWithRetry = async (url, validateResponse, label) => {
    let lastError;
    for (let attempt = 1; attempt <= 10; attempt += 1) {
        try {
            const response = await fetch(url, { signal: AbortSignal.timeout(10_000) });
            if (!response.ok) {
                throw new Error(`${label} respondeu HTTP ${response.status}.`);
            }
            await validateResponse(response);
            console.log(`OK: ${label} respondeu.`);
            return;
        } catch (error) {
            lastError = error;
            if (attempt < 10) await wait(5_000);
        }
    }
    throw new Error(`${label} nao ficou disponivel apos 10 tentativas.`, { cause: lastError });
};

const publishedSiteUrl = validateUrl(siteUrl, "BOSQUE_SITE_URL");
await fetchWithRetry(publishedSiteUrl, async (response) => {
    const html = await response.text();
    if (!/<main[\s>]/i.test(html)) {
        throw new Error("A pagina publicada nao contem o elemento principal esperado.");
    }
}, "site publicado");

if (apiHealthUrl) {
    const publishedApiHealthUrl = validateUrl(apiHealthUrl, "BOSQUE_API_HEALTH_URL");
    await fetchWithRetry(publishedApiHealthUrl, async (response) => {
        let health;
        try {
            health = await response.json();
        } catch (error) {
            throw new Error("O health check da API nao retornou JSON valido.", { cause: error });
        }
        if (health?.ok !== true) {
            throw new Error("O health check da API nao confirmou estado saudavel.");
        }
    }, "health check da API");
} else {
    console.log("BOSQUE_API_HEALTH_URL nao configurada; teste da API ignorado.");
}
