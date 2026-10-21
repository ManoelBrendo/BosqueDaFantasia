import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { config } from "../backend/lib/config.mjs";
import { importLegacyCollections, initializeStore } from "../backend/lib/json-store.mjs";

if (!config.databaseUrl) {
    throw new Error("Configure DATABASE_URL para o PostgreSQL de destino antes de iniciar a importacao.");
}

const legacyPath = process.env.BOSQUE_LEGACY_DATABASE_FILE || path.join(config.dataDir, "bosque-db.json");
const rawDatabase = await readFile(legacyPath, "utf8");
const legacyDatabase = JSON.parse(rawDatabase);

assert.ok(Array.isArray(legacyDatabase.users), "O banco legado precisa conter uma colecao users valida.");
assert.ok(Array.isArray(legacyDatabase.files), "O banco legado precisa conter uma colecao files valida.");

const hash = createHash("sha256").update(rawDatabase);
const files = [];

for (const file of legacyDatabase.files) {
    if (!file || typeof file !== "object" || typeof file.id !== "string") {
        throw new Error("Registro de arquivo legado invalido; nenhuma importacao foi iniciada.");
    }
    if (typeof file.contentBase64 === "string") {
        const content = Buffer.from(file.contentBase64, "base64");
        if (!content.length || content.length > 4_000_000) {
            throw new Error(`Conteudo invalido para o arquivo legado ${file.id || "(sem ID)"}.`);
        }
        hash.update(file.id || "");
        hash.update(content);
        files.push({ ...file, contentBase64: content.toString("base64") });
        continue;
    }

    if (
        typeof file.storedName !== "string" ||
        path.basename(file.storedName) !== file.storedName ||
        /[\\/]/.test(file.storedName)
    ) {
        throw new Error(`Nome de arquivo legado invalido para ${file.id || "(sem ID)"}; nenhuma importacao foi iniciada.`);
    }
    const contentPath = path.join(config.uploadDir, file.storedName);
    const content = await readFile(contentPath);
    if (!content.length || content.length > 4_000_000) {
        throw new Error(`Conteudo invalido para o arquivo legado ${file.id || "(sem ID)"}.`);
    }
    if (Number.isFinite(file.size) && file.size !== content.length) {
        throw new Error(`Tamanho divergente para o arquivo legado ${file.id || "(sem ID)"}; nenhuma importacao foi iniciada.`);
    }
    hash.update(file.storedName);
    hash.update(content);
    files.push({ ...file, contentBase64: content.toString("base64") });
}

await initializeStore();
const result = await importLegacyCollections({
    importId: "legacy-json-v1",
    sourceSha256: hash.digest("hex"),
    users: legacyDatabase.users,
    files
});

console.log(result.alreadyImported
    ? "Importacao legada ja realizada; nenhuma alteracao foi feita."
    : `Importacao concluida: ${legacyDatabase.users.length} contas e ${files.length} arquivos. A origem foi preservada.`);
