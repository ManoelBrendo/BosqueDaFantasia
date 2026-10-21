import crypto from "node:crypto";
import { readCollection, updateCollection } from "./json-store.mjs";
import { config } from "./config.mjs";

const hashPassword = (password, salt = crypto.randomBytes(16).toString("hex")) => {
    const hash = crypto.scryptSync(password, salt, 64).toString("hex");
    return `${salt}:${hash}`;
};

const invalidPasswordHash = hashPassword("Bosque invalid login password");

const verifyPassword = (password, storedHash) => {
    const [salt, expectedHash] = String(storedHash || "").split(":");

    if (
        typeof password !== "string" ||
        password.length > 1024 ||
        !/^[a-f0-9]{32}$/.test(salt || "") ||
        !/^[a-f0-9]{128}$/.test(expectedHash || "")
    ) {
        return false;
    }

    const candidate = hashPassword(password, salt).split(":")[1];
    return crypto.timingSafeEqual(Buffer.from(candidate, "hex"), Buffer.from(expectedHash, "hex"));
};

const base64Url = (value) => Buffer.from(JSON.stringify(value)).toString("base64url");
const normalizeEmail = (email) => typeof email === "string" ? email.trim().toLowerCase() : "";
const isValidEmail = (email) => email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const isRecord = (value) => value !== null && typeof value === "object" && !Array.isArray(value);

export const createToken = (user) => {
    const header = base64Url({ alg: "HS256", typ: "JWT" });
    const payload = base64Url({
        sub: user.id,
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 8
    });
    const signature = crypto
        .createHmac("sha256", config.jwtSecret)
        .update(`${header}.${payload}`)
        .digest("base64url");

    return `${header}.${payload}.${signature}`;
};

export const verifyToken = (token) => {
    if (String(token || "").split(".").length !== 3) return null;
    const [header, payload, signature] = String(token || "").split(".");

    if (!header || !payload || !signature) {
        return null;
    }

    const expectedSignature = crypto
        .createHmac("sha256", config.jwtSecret)
        .update(`${header}.${payload}`)
        .digest("base64url");

    if (Buffer.byteLength(signature) !== Buffer.byteLength(expectedSignature) || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
        return null;
    }

    let parsedHeader;
    let parsedPayload;
    try {
        parsedHeader = JSON.parse(Buffer.from(header, "base64url").toString("utf8"));
        parsedPayload = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    } catch {
        return null;
    }

    if (
        parsedHeader?.alg !== "HS256" ||
        parsedHeader?.typ !== "JWT" ||
        typeof parsedPayload?.sub !== "string" ||
        !parsedPayload.sub ||
        !Number.isFinite(parsedPayload.exp) ||
        parsedPayload.exp <= Math.floor(Date.now() / 1000)
    ) {
        return null;
    }

    return parsedPayload;
};

export const getAuthUser = async (request) => {
    const header = request.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : "";
    const payload = verifyToken(token);

    if (!payload) {
        return null;
    }

    const users = await readCollection("users");
    const user = users.find((entry) => entry.id === payload.sub) || null;
    return user && user.disabled !== true ? { ...user, role: user.role === "admin" ? "admin" : "reader" } : null;
};

export const migrateUserRoles = async () => {
    await updateCollection("users", (users) => {
        let changed = false;
        const migrated = users.map((user) => {
            if (user.role === "reader" || user.role === "admin") return user;
            changed = true;
            return { ...user, role: "reader" };
        });
        return changed ? migrated : users;
    });
};

export const provisionAdmin = async (payload) => {
    const { email, password } = isRecord(payload) ? payload : {};
    const normalizedEmail = normalizeEmail(email);
    if (!isValidEmail(normalizedEmail) || typeof password !== "string" || password.length < 12 || password.length > 1024) {
        throw new Error("Provisionamento admin exige email valido e senha com pelo menos 12 caracteres.");
    }
    const user = {
        id: crypto.randomUUID(), email: normalizedEmail,
        name: "Administrador do Bosque", role: "admin", disabled: false,
        passwordHash: hashPassword(password), createdAt: new Date().toISOString()
    };
    let result;
    await updateCollection("users", (users) => {
        const existingAdmins = users.filter((entry) => entry.role === "admin");
        if (existingAdmins.length) {
            const existing = users.find((entry) => entry.email === normalizedEmail);
            if (existing?.role === "admin") {
                result = { created: false, alreadyProvisioned: true };
                return users;
            }
            throw new Error("Ja existe administrador. O provisionamento inicial nao altera contas existentes.");
        }
        const existing = users.find((entry) => entry.email === normalizedEmail);
        if (existing) {
            throw new Error("O email informado ja pertence a uma conta comum; provisionamento nao promove contas automaticamente.");
        }
        result = { created: true, user };
        return [...users, user];
    });
    return result;
};

export const registerUser = async (payload) => {
    const { email, password, name } = isRecord(payload) ? payload : {};
    const normalizedEmail = normalizeEmail(email);
    const cleanName = typeof name === "string" && name.trim() ? name.trim() : "Leitor do Bosque";

    if (
        !isValidEmail(normalizedEmail) ||
        typeof password !== "string" ||
        password.length < 6 ||
        password.length > 1024 ||
        typeof name !== "undefined" && (typeof name !== "string" || name.length > 100)
    ) {
        throw Object.assign(new Error("Informe e-mail valido e senha com pelo menos 6 caracteres."), { status: 400 });
    }

    const user = {
        id: crypto.randomUUID(),
        email: normalizedEmail,
        name: cleanName,
        role: "reader",
        disabled: false,
        passwordHash: hashPassword(password),
        createdAt: new Date().toISOString()
    };

    await updateCollection("users", (users) => {
        if (users.some((entry) => entry.email === normalizedEmail)) {
            throw Object.assign(new Error("Este e-mail ja esta cadastrado."), { status: 409 });
        }
        return [...users, user];
    });
    return user;
};

export const loginUser = async (payload) => {
    const { email, password } = isRecord(payload) ? payload : {};
    const normalizedEmail = normalizeEmail(email);
    const users = await readCollection("users");
    const user = users.find((entry) => entry.email === normalizedEmail && entry.disabled !== true);
    const passwordMatches = verifyPassword(
        typeof password === "string" && password.length <= 1024 ? password : "",
        user?.passwordHash || invalidPasswordHash
    );

    if (!isValidEmail(normalizedEmail) || !user || typeof password !== "string" || password.length > 1024 || !passwordMatches) {
        throw Object.assign(new Error("Credenciais invalidas."), { status: 401 });
    }

    return user;
};

export const publicUser = (user) => ({
    id: user.id,
    email: user.email,
    name: user.name,
    createdAt: user.createdAt,
    role: user.role === "admin" ? "admin" : "reader"
});
