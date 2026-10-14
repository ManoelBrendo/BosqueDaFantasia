import assert from "node:assert/strict";

const values = new Map();
const localStorage = {
    getItem(key) { return values.get(key) ?? null; },
    setItem(key, value) { values.set(key, String(value)); },
    removeItem(key) { values.delete(key); }
};

globalThis.window = {
    BOSQUE_API_BASE: "https://api.bosque.example.test",
    location: {
        hostname: "bosque.example.test",
        origin: "https://bosque.example.test",
        port: "",
        protocol: "https:"
    },
    localStorage,
    setTimeout,
    clearTimeout,
    dispatchEvent() {}
};
globalThis.CustomEvent = class CustomEvent {
    constructor(type, options) {
        this.type = type;
        this.detail = options?.detail;
    }
};

const accountApiUrl = new URL("../account-api.js", import.meta.url);
const { bosqueApi, describeAuthError } = await import(accountApiUrl.href);
const jsonResponse = (status, payload) => new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" }
});

try {
    globalThis.fetch = async () => jsonResponse(401, { error: "Credenciais invalidas." });
    await assert.rejects(bosqueApi.login({
        email: "reader@bosque.example.test",
        password: "wrong-password"
    }), (error) => {
        assert.equal(error.code, "INVALID_CREDENTIALS");
        assert.equal(describeAuthError(error), "E-mail ou senha incorretos.");
        return true;
    });

    globalThis.fetch = async () => { throw new TypeError("network unavailable"); };
    await assert.rejects(bosqueApi.login({
        email: "remote@bosque.example.test",
        password: "wrong-password"
    }), (error) => {
        assert.equal(error.code, "LOCAL_INVALID_CREDENTIALS");
        assert.equal(error.cause.code, "API_UNAVAILABLE");
        assert.match(describeAuthError(error), /Contas remotas não podem entrar agora/);
        return true;
    });

    window.BOSQUE_API_BASE = "";
    const localOnlyUrl = new URL("../account-api.js", import.meta.url);
    localOnlyUrl.searchParams.set("test-mode", "local-only");
    const { bosqueApi: localOnlyApi, describeAuthError: describeLocalError } = await import(localOnlyUrl.href);
    await assert.rejects(localOnlyApi.login({
        email: "unregistered@bosque.example.test",
        password: "wrong-password"
    }), (error) => {
        assert.equal(error.code, "LOCAL_INVALID_CREDENTIALS");
        assert.match(describeLocalError(error), /Credenciais locais incorretas/);
        assert.doesNotMatch(describeLocalError(error), /servidor da conta está indisponível/);
        return true;
    });

    const localSession = await bosqueApi.register({
        name: "Leitor local",
        email: "local@bosque.example.test",
        password: "local-password"
    });
    assert.equal(localSession.mode, "local");
    assert.match(describeAuthError(Object.assign(new Error("expired"), { code: "SESSION_EXPIRED" })), /sessão expirou/i);
    assert.match(describeAuthError(Object.assign(new Error("limited"), { code: "RATE_LIMITED" })), /Muitas tentativas/);
    assert.match(describeAuthError(Object.assign(new Error("server"), { code: "API_ERROR" })), /encontrou um erro/);

    globalThis.fetch = async () => jsonResponse(401, { error: "Autenticacao necessaria." });
    localStorage.setItem("bosque-api-token", "remote-session-token");
    await assert.rejects(bosqueApi.me(), (error) => {
        assert.equal(error.code, "SESSION_EXPIRED");
        assert.equal(describeAuthError(error), "Sua sessão expirou. Entre novamente.");
        return true;
    });
    console.log("OK: account client distinguishes invalid credentials, API outage, local fallback and expired sessions.");
} finally {
    delete globalThis.window;
    delete globalThis.CustomEvent;
    delete globalThis.fetch;
}
