import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const baselineDirectory = path.join(root, "scripts", "visual-baselines");
const diffDirectory = path.join(root, "artifacts", "visual-regressions");
const updateBaselines = process.argv.includes("--update");
const maxDiffPixelRatio = 0.012;
const maxPixelDelta = 0.18;
const fixtureCover = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="460" viewBox="0 0 320 460"><rect width="320" height="460" fill="#20382f"/><path d="M28 28h264v404H28z" fill="none" stroke="#dcbf83" stroke-width="4"/><circle cx="160" cy="230" r="60" fill="#dcbf83"/><path d="M160 190v80m-40-40h80" stroke="#20382f" stroke-width="8"/></svg>`;
const docs = Array.from({ length: 5 }, (_, index) => ({
    key: `/works/OL${index + 1}W`,
    title: ["The Lantern in the Greenwood", "The Silver Path", "A Crown of Ferns", "The Last Starlight", "The Hidden Kingdom"][index],
    author_name: ["A. W. Reader"],
    first_publish_year: 1937 + index,
    edition_count: 2 + index,
    cover_i: 70000 + index,
    subject: ["fantasy", "forests", "myth"],
    editions: {
        docs: [{
            key: `/books/OL${index + 1}M`,
            title: ["The Lantern in the Greenwood", "The Silver Path", "A Crown of Ferns", "The Last Starlight", "The Hidden Kingdom"][index],
            language: ["eng"],
            cover_i: 70000 + index,
            ebook_access: "public"
        }]
    }
}));
const states = [
    { name: "home-desktop", url: "index.html", selector: "#inicio", width: 1440, height: 1000 },
    { name: "home-mobile", url: "index.html", selector: "#inicio", width: 390, height: 844 },
    { name: "catalog-search-desktop", url: "livros.html?q=elves", selector: ".catalog-hero", width: 1440, height: 1000 },
    { name: "catalog-search-mobile", url: "livros.html?q=elves", selector: ".catalog-hero", width: 390, height: 844 },
    { name: "catalog-results-desktop", url: "livros.html?q=elves", selector: "#resultados .container", width: 1440, height: 1000 },
    { name: "catalog-results-mobile", url: "livros.html?q=elves", selector: "#resultados .container", width: 390, height: 844 },
    { name: "book-detail-desktop", url: "compra.html?book=OL1W", selector: ".detail-layout", width: 1440, height: 1000 },
    { name: "book-detail-mobile", url: "compra.html?book=OL1W", selector: ".detail-layout", width: 390, height: 844 },
    { name: "login-desktop", url: "login.html", selector: ".login-page", width: 1440, height: 1000 },
    { name: "login-mobile", url: "login.html", selector: ".login-page", width: 390, height: 844 }
];

if (updateBaselines && process.env.CI) {
    throw new Error("As referencias visuais nao podem ser atualizadas durante o CI.");
}

const comparisonProbe = new PNG({ width: 2, height: 2 });
const changedProbe = new PNG({ width: 2, height: 2 });
comparisonProbe.data.fill(0);
changedProbe.data.fill(255);
assert.ok(
    pixelmatch(comparisonProbe.data, changedProbe.data, null, 2, 2, { threshold: maxPixelDelta }) > 0,
    "the visual comparator must detect a clear pixel change"
);

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
const launchOptions = { headless: true };
if (process.env.BOSQUE_BROWSER_EXECUTABLE_PATH) {
    launchOptions.executablePath = process.env.BOSQUE_BROWSER_EXECUTABLE_PATH;
} else {
    launchOptions.channel = process.env.BOSQUE_BROWSER_CHANNEL || "msedge";
}

const browser = await chromium.launch(launchOptions);
const context = await browser.newContext({
    locale: "pt-BR",
    reducedMotion: "reduce",
    serviceWorkers: "block"
});
await context.route("**/*", async (route) => {
    const url = new URL(route.request().url());

    if (url.origin === "http://127.0.0.1:4173") {
        if (url.pathname === "/api/health") {
            return route.fulfill({ json: { ok: true } });
        }
        if (url.pathname === "/api/auth/login") {
            return route.fulfill({ status: 401, json: { error: "Credenciais invalidas." } });
        }
        return route.continue();
    }

    if (url.hostname === "openlibrary.org" && url.pathname === "/search.json") {
        const query = url.searchParams.get("q") || "";
        const selectedDocs = query.includes("key:/works/OL1W") ? docs.slice(0, 1) : docs;
        return route.fulfill({ json: { numFound: selectedDocs.length, docs: selectedDocs } });
    }

    if (["commons.wikimedia.org", "upload.wikimedia.org", "covers.openlibrary.org"].includes(url.hostname)) {
        return route.fulfill({ status: 200, contentType: "image/svg+xml", body: fixtureCover });
    }

    return route.abort();
});

const page = await context.newPage();
const pageErrors = [];
page.on("pageerror", (error) => pageErrors.push(error.message));

try {
    await mkdir(baselineDirectory, { recursive: true });
    await mkdir(diffDirectory, { recursive: true });

    for (const state of states) {
        await page.setViewportSize({ width: state.width, height: state.height });
        await page.goto(`http://127.0.0.1:4173/${state.url}`, { waitUntil: "domcontentloaded" });
        if (state.name.startsWith("catalog-results")) {
            await page.locator("#results-grid .book-card").first().waitFor();
        } else if (state.name.startsWith("book-detail")) {
            await page.waitForFunction(() => {
                const title = document.querySelector("#purchase-title")?.textContent;
                return title && title !== "Carregando livro…" && title !== "Livro do bosque";
            });
            assert.match(await page.locator("#purchase-title").textContent(), /Lantern|Lanterna/i);
        } else if (state.name.startsWith("login")) {
            await page.waitForFunction(() => document.querySelector("#api-status")?.dataset.tone !== "idle");
        }
        await page.evaluate(() => document.fonts.ready);
        const target = page.locator(state.selector);
        await target.waitFor({ state: "visible" });
        await target.scrollIntoViewIfNeeded();
        await target.evaluate(async (element) => {
            const images = [...element.querySelectorAll("img")];
            images.forEach((image) => {
                image.loading = "eager";
            });
            await Promise.all(images.map((image) => image.decode().catch(() => undefined)));
        });
        await page.evaluate(() => window.scrollTo(0, 0));
        // Hide glyphs so snapshots focus on layout and surfaces across CI operating systems.
        await page.addStyleTag({
            content: `
                *, *::before, *::after {
                    animation: none !important;
                    transition: none !important;
                    scroll-behavior: auto !important;
                    caret-color: transparent !important;
                    font-family: Arial, sans-serif !important;
                    -webkit-text-fill-color: transparent !important;
                    text-shadow: none !important;
                }
                body, body * {
                    color: transparent !important;
                }
            `
        });

        const screenshot = await target.screenshot({ animations: "disabled" });
        const baselinePath = path.join(baselineDirectory, `${state.name}.png`);

        if (updateBaselines) {
            await writeFile(baselinePath, screenshot);
            console.log(`Updated ${path.relative(root, baselinePath)}`);
            continue;
        }

        let baseline;
        try {
            baseline = PNG.sync.read(await readFile(baselinePath));
        } catch (error) {
            if (error.code !== "ENOENT") {
                throw error;
            }
            throw new Error(`Referencia ausente: ${path.relative(root, baselinePath)}. Rode npm run test:visual:update para revisar e atualizar as capturas.`);
        }

        const actual = PNG.sync.read(screenshot);
        assert.equal(actual.width, baseline.width, `${state.name}: screenshot width changed`);
        assert.equal(actual.height, baseline.height, `${state.name}: screenshot height changed`);

        const difference = new PNG({ width: actual.width, height: actual.height });
        const differingPixels = pixelmatch(baseline.data, actual.data, difference.data, actual.width, actual.height, {
            threshold: maxPixelDelta,
            includeAA: false
        });
        const ratio = differingPixels / (actual.width * actual.height);

        if (ratio > maxDiffPixelRatio) {
            const diffPath = path.join(diffDirectory, `${state.name}-diff.png`);
            await writeFile(diffPath, PNG.sync.write(difference));
            throw new Error(
                `${state.name}: ${(ratio * 100).toFixed(2)}% pixels differ (limit ${(maxDiffPixelRatio * 100).toFixed(2)}%). `
                + `Compare ${path.relative(root, diffPath)} with ${path.relative(root, baselinePath)} and update approved references with npm run test:visual:update.`
            );
        }

        console.log(`OK ${state.name}: ${(ratio * 100).toFixed(3)}% changed pixels`);
    }

    assert.deepEqual(pageErrors, [], "visual test pages should not emit uncaught errors");
    console.log(updateBaselines
        ? `Updated ${states.length} approved visual references.`
        : `OK: ${states.length} visual regression states match their approved references.`);
} finally {
    await context.close();
    await browser.close();
}
