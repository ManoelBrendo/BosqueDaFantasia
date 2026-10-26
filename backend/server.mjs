import { createServer } from "node:http";
import { config } from "./lib/config.mjs";
import { checkStoreHealth, initializeStore } from "./lib/json-store.mjs";
import { getAuthUser, loginUser, publicUser, registerUser, createToken, migrateUserRoles, provisionAdmin } from "./lib/auth.mjs";
import { readJsonBody, sendJson, serveStatic } from "./lib/http-utils.mjs";
import { listUserFiles, readUserFile, saveUserFile } from "./lib/files.mjs";
import { searchAmazon } from "./lib/amazon.mjs";

const withErrorHandling = async (handler, request, response) => {
    try {
        await handler(request, response);
    } catch (error) {
        sendJson(response, error.status || 500, {
            error: error.message || "Erro interno."
        });
    }
};

const authAttempts = new Map();
const checkAuthRateLimit = (request) => {
    const key = request.socket.remoteAddress || "unknown";
    const now = Date.now();
    const recent = (authAttempts.get(key) || []).filter((timestamp) => now - timestamp < 15 * 60 * 1000);
    if (recent.length >= 10) {
        throw Object.assign(new Error("Muitas tentativas. Aguarde alguns minutos."), { status: 429 });
    }
    recent.push(now);
    authAttempts.set(key, recent);
};

const requireUser = async (request) => {
    const user = await getAuthUser(request);

    if (!user) {
        throw Object.assign(new Error("Autenticacao necessaria."), { status: 401 });
    }

    return user;
};

const requireAdmin = async (request) => {
    const user = await requireUser(request);
    if (user.role !== "admin") {
        throw Object.assign(new Error("Permissao insuficiente."), { status: 403 });
    }
    return user;
};

const routeApi = async (request, response) => {
    const url = new URL(request.url || "/", `http://${request.headers.host || "localhost"}`);
    const route = url.pathname;

    if (request.method === "GET" && route === "/api/health") {
        await checkStoreHealth();
        sendJson(response, 200, {
            ok: true,
            name: "Bosque da Fantasia API",
            amazonConfigured: Boolean(config.amazon.accessKey && config.amazon.secretKey && config.amazon.partnerTag)
        });
        return;
    }

    if (request.method === "POST" && route === "/api/auth/register") {
        checkAuthRateLimit(request);
        const payload = await readJsonBody(request);
        const user = await registerUser(payload);
        sendJson(response, 201, {
            user: publicUser(user),
            token: createToken(user)
        });
        return;
    }

    if (request.method === "POST" && route === "/api/auth/login") {
        checkAuthRateLimit(request);
        const payload = await readJsonBody(request);
        const user = await loginUser(payload);
        sendJson(response, 200, {
            user: publicUser(user),
            token: createToken(user)
        });
        return;
    }

    if (request.method === "GET" && route === "/api/me") {
        const user = await requireUser(request);
        sendJson(response, 200, { user: publicUser(user) });
        return;
    }

    if (route.startsWith("/api/admin/")) {
        await requireAdmin(request);
        sendJson(response, 404, { error: "Rota administrativa nao encontrada." });
        return;
    }

    if (request.method === "GET" && route === "/api/files") {
        const user = await requireUser(request);
        sendJson(response, 200, { files: await listUserFiles(user) });
        return;
    }

    if (request.method === "POST" && route === "/api/files") {
        const user = await requireUser(request);
        const payload = await readJsonBody(request);
        const file = await saveUserFile(user, payload);
        sendJson(response, 201, { file });
        return;
    }

    if (request.method === "GET" && route.startsWith("/api/files/")) {
        const user = await requireUser(request);
        const file = await readUserFile(user, decodeURIComponent(route.replace("/api/files/", "")));
        sendJson(response, 200, { file });
        return;
    }

    if (request.method === "GET" && route === "/api/amazon/search") {
        const result = await searchAmazon({
            query: url.searchParams.get("q") || "",
            itemCount: url.searchParams.get("limit") || 6
        });
        sendJson(response, 200, result);
        return;
    }

    sendJson(response, 404, { error: "Rota de API nao encontrada." });
};

const server = createServer((request, response) => {
    if (request.method === "OPTIONS") {
        response.writeHead(204, {
            "Access-Control-Allow-Origin": config.corsOrigin,
            "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type,Authorization"
        });
        response.end();
        return;
    }

    if ((request.url || "").startsWith("/api/")) {
        withErrorHandling(routeApi, request, response);
        return;
    }

    withErrorHandling(serveStatic, request, response);
});

const start = async () => {
    await initializeStore();
    await migrateUserRoles();
    if (config.bootstrapAdminEmail || config.bootstrapAdminPassword) {
        if (!config.bootstrapAdminEmail || !config.bootstrapAdminPassword) {
            throw new Error("Configure BOSQUE_BOOTSTRAP_ADMIN_EMAIL e BOSQUE_BOOTSTRAP_ADMIN_PASSWORD juntos.");
        }
        const result = await provisionAdmin({ email: config.bootstrapAdminEmail, password: config.bootstrapAdminPassword });
        console.log(result.created ? "Administrador inicial provisionado." : "Administrador inicial ja provisionado.");
    }
    server.listen(config.port, config.host, () => {
        console.log(`Bosque API e site em http://${config.host}:${config.port}`);
    });
};

start().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
});
