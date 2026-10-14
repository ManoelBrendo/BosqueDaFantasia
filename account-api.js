const API_PORT = "4180";
const TOKEN_KEY = "bosque-api-token";
const USER_KEY = "bosque-api-user";
const SESSION_MODE_KEY = "bosque-session-mode";
const LOCAL_USERS_KEY = "bosque-local-users";
const LOCAL_TOKEN_PREFIX = "local:";
const LOCAL_MODE = "local";
const REMOTE_MODE = "remote";
const HEALTH_TIMEOUT_MS = 1800;

const resolveApiConnection = () => {
    const { hostname, origin, port, protocol } = window.location;
    const isFile = protocol === "file:";
    const isLocalHost = ["127.0.0.1", "localhost", "::1", "0.0.0.0", ""].includes(hostname);
    const apiHost = hostname && hostname !== "0.0.0.0" ? hostname : "127.0.0.1";

    if (window.BOSQUE_API_BASE) {
        return {
            base: String(window.BOSQUE_API_BASE).replace(/\/+$/g, ""),
            enabled: true
        };
    }

    if (port === API_PORT) {
        return {
            base: "",
            enabled: true
        };
    }

    return {
        base: isFile || isLocalHost || port ? `${isFile ? "http:" : protocol}//${apiHost}:${API_PORT}` : origin,
        enabled: false
    };
};

const API_CONNECTION = resolveApiConnection();
const API_BASE = API_CONNECTION.base;
const REMOTE_API_ENABLED = API_CONNECTION.enabled;

const getStorage = () => {
    try {
        return window.localStorage;
    } catch {
        return null;
    }
};

const storage = getStorage();

const getToken = () => storage?.getItem(TOKEN_KEY) || "";

const getStoredUser = () => {
    try {
        return JSON.parse(storage?.getItem(USER_KEY) || "null");
    } catch {
        return null;
    }
};

const clearLegacyMasterSession = () => {
    const user = getStoredUser();
    const token = getToken();
    if (String(user?.id || "") === "master" || String(user?.name || "").includes("Master do Bosque") || (token.startsWith(LOCAL_TOKEN_PREFIX) && readLocalTokenPayload()?.sub === "master")) {
        clearSession();
    }
};

const buildRemoteUnavailableError = (cause) => {
    const error = new Error("A API legada nao respondeu. Use uma conta local deste navegador ou publique o backend junto do site.");
    error.code = "API_UNAVAILABLE";
    error.cause = cause;
    return error;
};

const getHeaders = (options = {}) => {
    const headers = {
        "Content-Type": "application/json",
        ...(options.headers || {})
    };
    const token = getToken();

    if (token && !token.startsWith(LOCAL_TOKEN_PREFIX)) {
        headers.Authorization = `Bearer ${token}`;
    }

    return headers;
};

const fetchJson = async (path, options, base = API_BASE) => {
    let response;

    try {
        response = await fetch(`${base}${path}`, {
            ...options,
            headers: getHeaders(options)
        });
    } catch (error) {
        throw buildRemoteUnavailableError(error);
    }

    const contentType = response.headers.get("content-type") || "";
    const payload = contentType.includes("application/json")
        ? await response.json().catch(() => ({}))
        : {};

    if (!contentType.includes("application/json")) {
        throw buildRemoteUnavailableError(new Error("A rota de API respondeu HTML."));
    }

    if (!response.ok) {
        throw new Error(payload.error || "A API nao respondeu com sucesso.");
    }

    return payload;
};

const request = async (path, options = {}) => {
    if (!REMOTE_API_ENABLED) {
        throw buildRemoteUnavailableError(new Error("API remota nao configurada para hospedagem estatica."));
    }

    try {
        return await fetchJson(path, options);
    } catch (error) {
        throw error;
    }
};

const requireSessionPayload = (result) => {
    if (!result?.token || !result?.user) {
        throw new Error("A autenticacao respondeu sem usuario ou token.");
    }

    return result;
};

const setSession = ({ token, user, mode = REMOTE_MODE }) => {
    if (token) {
        storage?.setItem(TOKEN_KEY, token);
    }

    if (user) {
        storage?.setItem(USER_KEY, JSON.stringify(user));
    }

    storage?.setItem(SESSION_MODE_KEY, mode);
    window.dispatchEvent(new CustomEvent("bosque:session", { detail: { user, mode } }));
};

const clearSession = () => {
    storage?.removeItem(TOKEN_KEY);
    storage?.removeItem(USER_KEY);
    storage?.removeItem(SESSION_MODE_KEY);
    window.dispatchEvent(new CustomEvent("bosque:session", { detail: { user: null } }));
};

const readLocalUsers = () => {
    try {
        const users = JSON.parse(storage?.getItem(LOCAL_USERS_KEY) || "[]");
        return Array.isArray(users) ? users : [];
    } catch {
        return [];
    }
};

const writeLocalUsers = (users) => {
    storage?.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
};

const hashLocalPassword = async (password) => {
    const input = `bosque:${String(password || "")}`;

    if (window.crypto?.subtle) {
        const digest = await window.crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
        return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
    }

    return btoa(unescape(encodeURIComponent(input)));
};

const publicLocalUser = (user) => ({
    id: user.id,
    email: user.email,
    name: user.name,
    createdAt: user.createdAt,
    localOnly: true
});

const createLocalToken = (user) => {
    const payload = JSON.stringify({
        sub: user.id,
        email: user.email,
        createdAt: Date.now()
    });

    return `${LOCAL_TOKEN_PREFIX}${btoa(unescape(encodeURIComponent(payload)))}`;
};

const readLocalTokenPayload = () => {
    const token = getToken();

    if (!token.startsWith(LOCAL_TOKEN_PREFIX)) {
        return null;
    }

    try {
        return JSON.parse(decodeURIComponent(escape(atob(token.slice(LOCAL_TOKEN_PREFIX.length)))));
    } catch {
        return null;
    }
};

clearLegacyMasterSession();

const registerLocal = async ({ email, password, name }) => {
    const normalizedEmail = String(email || "").trim().toLowerCase();
    const cleanName = String(name || "Leitor do Bosque").trim();

    if (!normalizedEmail.includes("@") || String(password || "").length < 6) {
        throw new Error("Informe e-mail valido e senha com pelo menos 6 caracteres.");
    }

    const users = readLocalUsers();

    if (users.some((user) => user.email === normalizedEmail)) {
        throw new Error("Este e-mail ja existe no modo local deste navegador.");
    }

    const user = {
        id: `local-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
        email: normalizedEmail,
        name: cleanName,
        passwordHash: await hashLocalPassword(password),
        createdAt: new Date().toISOString()
    };

    users.push(user);
    writeLocalUsers(users);

    return {
        token: createLocalToken(user),
        user: publicLocalUser(user),
        mode: LOCAL_MODE
    };
};

const loginLocal = async ({ email, password }) => {
    const normalizedEmail = String(email || "").trim().toLowerCase();

    const passwordHash = await hashLocalPassword(password);
    const user = readLocalUsers().find((entry) => entry.email === normalizedEmail);

    if (!user || user.passwordHash !== passwordHash) {
        throw new Error("Credenciais invalidas no modo local. Crie uma conta local neste navegador.");
    }

    return {
        token: createLocalToken(user),
        user: publicLocalUser(user),
        mode: LOCAL_MODE
    };
};

const meLocal = () => {
    const payload = readLocalTokenPayload();

    if (!payload) {
        throw new Error("Sessao local expirada.");
    }

    const user = readLocalUsers().find((entry) => entry.id === payload.sub);

    if (!user) {
        throw new Error("Usuario local nao encontrado.");
    }

    return {
        user: publicLocalUser(user),
        mode: LOCAL_MODE
    };
};

const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || "").split(",")[1] || "");
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
    });
};

export const bosqueApi = {
    getToken,
    getStoredUser,
    isRemoteAdmin: () => bosqueApi.getMode() === REMOTE_MODE && getStoredUser()?.role === "admin" && !getToken().startsWith(LOCAL_TOKEN_PREFIX),
    getMode: () => storage?.getItem(SESSION_MODE_KEY) || "",
    getApiBase: () => API_BASE || window.location.origin,
    canUseRemoteApi: () => REMOTE_API_ENABLED,
    clearSession,
    async health() {
        const controller = new AbortController();
        const timer = window.setTimeout(() => controller.abort(), HEALTH_TIMEOUT_MS);

        try {
            return await request("/api/health", { signal: controller.signal });
        } finally {
            window.clearTimeout(timer);
        }
    },
    async register(payload) {
        try {
            const result = requireSessionPayload(await request("/api/auth/register", {
                method: "POST",
                body: JSON.stringify(payload)
            }));
            setSession({ ...result, mode: REMOTE_MODE });
            return { ...result, mode: REMOTE_MODE };
        } catch (error) {
            if (error.code !== "API_UNAVAILABLE") throw error;
            const result = requireSessionPayload(await registerLocal(payload));
            setSession(result);
            return result;
        }
    },
    async login(payload) {
        try {
            const result = requireSessionPayload(await request("/api/auth/login", {
                method: "POST",
                body: JSON.stringify(payload)
            }));
            setSession({ ...result, mode: REMOTE_MODE });
            return { ...result, mode: REMOTE_MODE };
        } catch (error) {
            if (error.code !== "API_UNAVAILABLE") {
                throw error;
            }

            const result = requireSessionPayload(await loginLocal(payload));
            setSession(result);
            return result;
        }
    },
    async me() {
        if (getToken().startsWith(LOCAL_TOKEN_PREFIX)) {
            return meLocal();
        }

        return request("/api/me");
    },
    async listFiles() {
        if (getToken().startsWith(LOCAL_TOKEN_PREFIX)) {
            return { files: [] };
        }

        return request("/api/files");
    },
    async uploadFile(file) {
        const contentBase64 = await fileToBase64(file);
        return request("/api/files", {
            method: "POST",
            body: JSON.stringify({
                name: file.name,
                type: file.type,
                contentBase64
            })
        });
    },
    async searchAmazon(query) {
        return request(`/api/amazon/search?q=${encodeURIComponent(query)}`);
    }
};
