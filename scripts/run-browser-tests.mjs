import { spawn, spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const server = spawn(process.execPath, [
    path.join(projectRoot, "scripts", "dev-server.mjs"),
    projectRoot,
    "4173"
], {
    cwd: projectRoot,
    stdio: "inherit"
});

const delay = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

const waitForServer = async () => {
    for (let attempt = 0; attempt < 100; attempt += 1) {
        if (server.exitCode !== null) {
            throw new Error(`O servidor local encerrou antes de iniciar (codigo ${server.exitCode}).`);
        }

        try {
            const response = await fetch("http://127.0.0.1:4173/", {
                signal: AbortSignal.timeout(500)
            });
            if (response.ok) return;
        } catch {
            await delay(100);
        }
    }

    throw new Error("O servidor local nao respondeu em http://127.0.0.1:4173.");
};

try {
    await waitForServer();
    for (const script of ["test-browser.mjs", "test-accessibility.mjs", "test-pwa.mjs"]) {
        const result = spawnSync(process.execPath, [
            path.join(projectRoot, "scripts", script)
        ], {
            cwd: projectRoot,
            env: process.env,
            stdio: "inherit"
        });

        if (result.error) throw result.error;
        if (result.status !== 0) {
            throw new Error(`${script} falhou${result.signal ? ` com sinal ${result.signal}` : ` com codigo ${result.status}`}.`);
        }
    }
} finally {
    if (server.exitCode === null) {
        const closed = new Promise((resolve) => server.once("exit", resolve));
        server.kill();
        await closed;
    }
}
