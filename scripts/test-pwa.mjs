import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const workerSource = await readFile(path.join(root, "sw.js"), "utf8");
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
const launchOptions = { headless: true };
if (process.env.BOSQUE_BROWSER_EXECUTABLE_PATH) {
    launchOptions.executablePath = process.env.BOSQUE_BROWSER_EXECUTABLE_PATH;
} else {
    launchOptions.channel = process.env.BOSQUE_BROWSER_CHANNEL || "msedge";
}

const browser = await chromium.launch(launchOptions);
const context = await browser.newContext();
let workerVersion = 24;
await context.route("**/*", async (route) => {
    const url = new URL(route.request().url());

    if (url.origin !== "http://127.0.0.1:4173") {
        return route.abort();
    }

    if (url.pathname === "/sw.js") {
        const source = workerSource
            .replaceAll("bosque-shell-v25", `bosque-shell-v${workerVersion}`)
            .replaceAll("bosque-runtime-v25", `bosque-runtime-v${workerVersion}`);
        return route.fulfill({ status: 200, contentType: "text/javascript", body: source });
    }

    return route.continue();
});

const page = await context.newPage();
await page.addInitScript(() => {
    const key = "bosque-pwa-test-navigations";
    sessionStorage.setItem(key, String(Number(sessionStorage.getItem(key) || "0") + 1));
});
let mainFrameNavigations = 0;
page.on("framenavigated", (frame) => {
    if (frame === page.mainFrame()) {
        mainFrameNavigations += 1;
    }
});

try {
    await page.goto("http://127.0.0.1:4173/index.html");
    await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
    const initialNavigations = mainFrameNavigations;
    const registration = await page.evaluate(() => navigator.serviceWorker.ready.then((ready) => ({
        scope: ready.scope
    })));
    assert.ok(registration.scope.endsWith("/"));
    assert.equal(await page.locator("#pwa-update-notice").isVisible(), false);
    assert.equal(mainFrameNavigations, initialNavigations, "first install must not reload the active page");

    workerVersion = 26;
    await page.evaluate(async () => {
        const registration = await navigator.serviceWorker.ready;
        await registration.update();
    });
    await page.locator("#update-app").waitFor({ state: "visible", timeout: 30000 });
    assert.match(await page.locator("#pwa-update-notice").innerText(), /nova versão do Bosque está pronta/i);
    assert.equal(mainFrameNavigations, initialNavigations, "a waiting update must not interrupt the reader");

    await page.locator("#update-app").focus();
    await page.keyboard.press("Enter");
    await page.waitForFunction(() => sessionStorage.getItem("bosque-pwa-test-navigations") === "2", null, { timeout: 30000 });
    await page.waitForFunction(async () => (await caches.keys()).includes("bosque-shell-v26"), null, { timeout: 30000 });
    assert.equal(await page.locator("#pwa-update-notice").isVisible(), false);
    console.log("OK: service worker update waits for reader approval and reloads only after activation.");
} finally {
    await context.close();
    await browser.close();
}
