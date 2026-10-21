import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { createHmac } from "node:crypto";
import { createServer } from "node:http";
import { copyFile, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const tempRoot = await mkdtemp(path.join(os.tmpdir(), "bosque-auth-test-"));
const jwtSecret = "test-only-secret-with-at-least-32-characters";
const bootstrapEmail = "admin@bosque.test";
const bootstrapPassword = "test-bootstrap-password";
const runningApis = new Set();

const delay = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

const findPort = async () => {
    const probe = createServer();
    await new Promise((resolve, reject) => {
        probe.once("error", reject);
        probe.listen(0, "127.0.0.1", resolve);
    });
    const { port } = probe.address();
    await new Promise((resolve, reject) => probe.close((error) => error ? reject(error) : resolve()));
    return port;
};

const copyServerFiles = async () => {
    await mkdir(path.join(tempRoot, "backend", "lib"), { recursive: true });
    await mkdir(path.join(tempRoot, "scripts"), { recursive: true });
    await copyFile(
        path.join(projectRoot, "backend", "server.mjs"),
        path.join(tempRoot, "backend", "server.mjs")
    );
    await copyFile(
        path.join(projectRoot, "scripts", "static-files.mjs"),
        path.join(tempRoot, "scripts", "static-files.mjs")
    );

    const libraryFiles = await readdir(path.join(projectRoot, "backend", "lib"));
    for (const file of libraryFiles.filter((entry) => entry.endsWith(".mjs"))) {
        await copyFile(
            path.join(projectRoot, "backend", "lib", file),
            path.join(tempRoot, "backend", "lib", file)
        );
    }
};

const startApi = async ({ adminEmail = bootstrapEmail, adminPassword = bootstrapPassword } = {}) => {
    const port = await findPort();
    const child = spawn(process.execPath, [path.join(tempRoot, "backend", "server.mjs")], {
        cwd: tempRoot,
        env: {
            ...process.env,
            NODE_ENV: "test",
            BOSQUE_API_HOST: "127.0.0.1",
            BOSQUE_API_PORT: String(port),
            DATABASE_URL: "",
            BOSQUE_JWT_SECRET: jwtSecret,
            BOSQUE_BOOTSTRAP_ADMIN_EMAIL: adminEmail,
            BOSQUE_BOOTSTRAP_ADMIN_PASSWORD: adminPassword,
            BOSQUE_CORS_ORIGIN: "https://bosque.example.test"
        },
        stdio: ["ignore", "pipe", "pipe"]
    });
    let output = "";
    child.stdout.setEncoding("utf8").on("data", (chunk) => { output += chunk; });
    child.stderr.setEncoding("utf8").on("data", (chunk) => { output += chunk; });
    const exited = new Promise((resolve) => child.once("exit", (code) => resolve(code)));
    const closed = new Promise((resolve) => child.once("close", resolve));
    const api = {
        child,
        base: `http://127.0.0.1:${port}`,
        get output() { return output; },
        async stop() {
            if (child.exitCode === null) {
                child.kill();
                await exited;
            }
            runningApis.delete(api);
        }
    };
    runningApis.add(api);

    for (let attempt = 0; attempt < 50; attempt += 1) {
        if (child.exitCode !== null) {
            await closed;
            throw new Error(`A API encerrou antes de iniciar: ${output}`);
        }
        try {
            const response = await fetch(`${api.base}/api/health`, {
                signal: AbortSignal.timeout(500)
            });
            if (response.ok) return api;
        } catch {
            await delay(50);
        }
    }

    await api.stop();
    throw new Error(`A API nao respondeu ao health check: ${output}`);
};

const postJson = (base, route, body, token = "") => fetch(`${base}${route}`, {
    method: "POST",
    headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(body)
});

const getJson = (base, route, token = "") => fetch(`${base}${route}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
});

const makeToken = (header, payload) => {
    const encodedHeader = Buffer.from(JSON.stringify(header)).toString("base64url");
    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
    const signature = createHmac("sha256", jwtSecret)
        .update(`${encodedHeader}.${encodedPayload}`)
        .digest("base64url");
    return `${encodedHeader}.${encodedPayload}.${signature}`;
};

const productionSecretCheck = () => {
    const configUrl = pathToFileURL(path.join(projectRoot, "backend", "lib", "config.mjs")).href;
    const checkSecret = (secret) => {
        const env = { ...process.env, NODE_ENV: "production" };
        env.DATABASE_URL = "postgres://bosque:test@127.0.0.1:5432/bosque_test";
        if (secret === null) delete env.BOSQUE_JWT_SECRET;
        else env.BOSQUE_JWT_SECRET = secret;
        return spawnSync(process.execPath, [
            "--input-type=module",
            "-e",
            `import(${JSON.stringify(configUrl)})`
        ], { cwd: projectRoot, env, encoding: "utf8" });
    };

    for (const secret of [null, "x".repeat(31)]) {
        const result = checkSecret(secret);
        assert.notEqual(result.status, 0, "A API deve recusar segredo JWT ausente ou fraco em producao.");
        assert.match(result.stderr, /BOSQUE_JWT_SECRET/);
    }
    assert.equal(checkSecret("x".repeat(32)).status, 0, "A API deve aceitar segredo JWT com 32 caracteres em producao.");

    const missingDatabaseEnv = {
        ...process.env,
        NODE_ENV: "production",
        BOSQUE_JWT_SECRET: "x".repeat(32)
    };
    delete missingDatabaseEnv.DATABASE_URL;
    const missingDatabase = spawnSync(process.execPath, [
        "--input-type=module",
        "-e",
        `import(${JSON.stringify(configUrl)})`
    ], { cwd: projectRoot, env: missingDatabaseEnv, encoding: "utf8" });
    assert.notEqual(missingDatabase.status, 0, "A API nao pode iniciar em producao usando JSON local.");
    assert.match(missingDatabase.stderr, /DATABASE_URL/);

    const railwayConfigEnv = {
        ...process.env,
        NODE_ENV: "production",
        BOSQUE_JWT_SECRET: "x".repeat(32),
        DATABASE_URL: "postgres://bosque:test@127.0.0.1:5432/bosque_test",
        PORT: "4199",
        BOSQUE_API_PORT: "4180"
    };
    const railwayConfig = spawnSync(process.execPath, [
        "--input-type=module",
        "-e",
        `import(${JSON.stringify(configUrl)}).then(({config}) => console.log(JSON.stringify({host: config.host, port: config.port})))`
    ], { cwd: projectRoot, env: railwayConfigEnv, encoding: "utf8" });
    assert.equal(railwayConfig.status, 0);
    assert.deepEqual(JSON.parse(railwayConfig.stdout.trim()), { host: "0.0.0.0", port: 4199 });
};

try {
    productionSecretCheck();
    await copyServerFiles();
    await mkdir(path.join(tempRoot, "backend", "data"), { recursive: true });
    await writeFile(
        path.join(tempRoot, "backend", "data", "bosque-db.json"),
        JSON.stringify({
            users: [{
                id: "legacy-reader",
                email: "legacy@bosque.test",
                name: "Leitor antigo",
                passwordHash: "invalid-hash"
            }],
            files: []
        }),
        "utf8"
    );

    let api = await startApi();
    const adminRoute = "/api/admin/catalog";
    const anonymous = await getJson(api.base, adminRoute);
    assert.equal(anonymous.status, 401);

    const localToken = await getJson(api.base, adminRoute, "local:forged-token");
    assert.equal(localToken.status, 401);

    const expiredToken = makeToken(
        { alg: "HS256", typ: "JWT" },
        { sub: "legacy-reader", exp: Math.floor(Date.now() / 1000) - 1 }
    );
    assert.equal((await getJson(api.base, adminRoute, expiredToken)).status, 401);

    const wrongAlgorithmToken = makeToken(
        { alg: "none", typ: "JWT" },
        { sub: "legacy-reader", exp: Math.floor(Date.now() / 1000) + 60 }
    );
    assert.equal((await getJson(api.base, adminRoute, wrongAlgorithmToken)).status, 401);

    const malformedRegistration = await postJson(api.base, "/api/auth/register", null);
    assert.equal(malformedRegistration.status, 400);
    const malformedHashLogin = await postJson(api.base, "/api/auth/login", {
        email: "legacy@bosque.test",
        password: "some-password"
    });
    assert.equal(malformedHashLogin.status, 401);

    const registration = await postJson(api.base, "/api/auth/register", {
        name: "Leitora de teste",
        email: "reader@bosque.test",
        password: "reader-password",
        role: "admin",
        disabled: true
    });
    assert.equal(registration.status, 201);
    assert.equal(registration.headers.get("access-control-allow-origin"), "https://bosque.example.test");
    const readerSession = await registration.json();
    assert.equal(readerSession.user.role, "reader");
    assert.equal(Object.hasOwn(readerSession.user, "passwordHash"), false);
    assert.equal((await (await getJson(api.base, "/api/me", readerSession.token)).json()).user.role, "reader");
    assert.equal((await getJson(api.base, adminRoute, readerSession.token)).status, 403);

    const upload = await postJson(api.base, "/api/files", {
        name: "../nota.txt",
        type: "text/plain",
        contentBase64: Buffer.from("arquivo de teste").toString("base64")
    }, readerSession.token);
    assert.equal(upload.status, 201);
    const uploadedFile = (await upload.json()).file;
    const listedFiles = await getJson(api.base, "/api/files", readerSession.token);
    assert.equal((await listedFiles.json()).files[0].id, uploadedFile.id);
    const downloadedFile = await getJson(api.base, `/api/files/${uploadedFile.id}`, readerSession.token);
    assert.equal((await downloadedFile.json()).file.contentBase64, Buffer.from("arquivo de teste").toString("base64"));

    const duplicateRegistrations = await Promise.all([
        postJson(api.base, "/api/auth/register", {
            name: "Conta concorrente A",
            email: "concurrent@bosque.test",
            password: "reader-password"
        }),
        postJson(api.base, "/api/auth/register", {
            name: "Conta concorrente B",
            email: "concurrent@bosque.test",
            password: "reader-password"
        })
    ]);
    assert.deepEqual(duplicateRegistrations.map((response) => response.status).sort(), [201, 409]);

    const adminLogin = await postJson(api.base, "/api/auth/login", {
        email: bootstrapEmail,
        password: bootstrapPassword
    });
    assert.equal(adminLogin.status, 200);
    const adminSession = await adminLogin.json();
    assert.equal(adminSession.user.role, "admin");
    assert.equal((await getJson(api.base, adminRoute, adminSession.token)).status, 404);
    assert.equal((await getJson(api.base, `/api/files/${uploadedFile.id}`, adminSession.token)).status, 404);

    const databasePath = path.join(tempRoot, "backend", "data", "bosque-db.json");
    let database = JSON.parse(await readFile(databasePath, "utf8"));
    assert.equal(database.users.find((user) => user.id === "legacy-reader").role, "reader");
    const registeredReader = database.users.find((user) => user.email === "reader@bosque.test");
    assert.equal(registeredReader.role, "reader");
    assert.equal(registeredReader.disabled, false);

    for (let attempt = 0; attempt < 4; attempt += 1) {
        const invalidLogin = await postJson(api.base, "/api/auth/login", {
            email: "unknown@bosque.test",
            password: "incorrect-password"
        });
        assert.equal(invalidLogin.status, 401);
        assert.match((await invalidLogin.json()).error, /Credenciais invalidas/);
    }
    assert.equal((await postJson(api.base, "/api/auth/login", {
        email: "unknown@bosque.test",
        password: "incorrect-password"
    })).status, 429);

    database.users.find((user) => user.email === bootstrapEmail).role = "reader";
    await writeFile(databasePath, JSON.stringify(database), "utf8");
    assert.equal((await getJson(api.base, adminRoute, adminSession.token)).status, 403);
    assert.equal(
        (await (await getJson(api.base, "/api/me", adminSession.token)).json()).user.role,
        "reader"
    );

    database.users.find((user) => user.email === bootstrapEmail).role = "admin";
    database.users.find((user) => user.email === bootstrapEmail).disabled = true;
    await writeFile(databasePath, JSON.stringify(database), "utf8");
    assert.equal((await getJson(api.base, adminRoute, adminSession.token)).status, 401);
    await api.stop();

    api = await startApi();
    assert.match(api.output, /Administrador inicial ja provisionado/);
    assert.doesNotMatch(api.output, /test-bootstrap-password/);
    database = JSON.parse(await readFile(databasePath, "utf8"));
    assert.equal(database.users.filter((user) => user.role === "admin").length, 1);
    assert.equal(database.users.find((user) => user.email === bootstrapEmail).disabled, true);
    await api.stop();

    await assert.rejects(
        startApi({ adminEmail: "another-admin@bosque.test" }),
        /Ja existe administrador/
    );

    const corruptDatabase = "{invalid json";
    await writeFile(databasePath, corruptDatabase, "utf8");
    await assert.rejects(
        startApi(),
        /Nao foi possivel ler o banco local/
    );
    assert.equal(await readFile(databasePath, "utf8"), corruptDatabase, "O banco invalido deve ser preservado para recuperacao.");

    console.log("OK: auth roles, bootstrap, token validation, account migration, file access, concurrent registration, data preservation, rate limits and Railway production config.");
} finally {
    for (const api of runningApis) await api.stop();
    await rm(tempRoot, { recursive: true, force: true });
}
