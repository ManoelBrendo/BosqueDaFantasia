import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import crypto from "node:crypto";
import path from "node:path";
import { config } from "./config.mjs";
import {
    importLegacyCollections as importPostgresLegacyCollections,
    initializePostgresStore,
    readPostgresFileContent,
    readPostgresCollection,
    savePostgresFileRecord,
    updatePostgresCollection,
    writePostgresCollection
} from "./postgres-store.mjs";

const ensureDataDir = () => mkdir(config.dataDir, { recursive: true });
const databasePath = path.join(config.dataDir, "bosque-db.json");
const defaultDatabase = {
    users: [],
    files: [],
    meta: {
        schemaVersion: 1,
        createdAt: new Date().toISOString()
    }
};

let storeQueue = Promise.resolve();
const withStoreLock = (operation) => {
    const result = storeQueue.then(operation);
    storeQueue = result.catch(() => {});
    return result;
};

const validateDatabase = (database) => {
    if (!database || typeof database !== "object" || Array.isArray(database)) {
        throw new Error("O banco local nao contem um objeto JSON valido.");
    }

    const normalized = { ...defaultDatabase, ...database };
    for (const collection of ["users", "files"]) {
        if (!Array.isArray(normalized[collection])) {
            throw new Error(`A colecao "${collection}" do banco local nao e valida.`);
        }
    }
    return normalized;
};

const writeDatabase = async (database) => {
    await ensureDataDir();
    const nextDatabase = {
        ...database,
        meta: {
            ...(database.meta || {}),
            schemaVersion: 2,
            updatedAt: new Date().toISOString()
        }
    };

    const tempDatabasePath = path.join(
        config.dataDir,
        `bosque-db.${process.pid}.${crypto.randomUUID()}.tmp`
    );
    try {
        await writeFile(tempDatabasePath, JSON.stringify(nextDatabase, null, 2), { encoding: "utf8", flag: "wx" });
        await rename(tempDatabasePath, databasePath);
    } finally {
        await rm(tempDatabasePath, { force: true });
    }
};

const readDatabase = async () => {
    await ensureDataDir();

    try {
        return {
            ...defaultDatabase,
            ...JSON.parse(await readFile(databasePath, "utf8"))
        };
    } catch (error) {
        if (error.code !== "ENOENT") {
            throw new Error(
                `Nao foi possivel ler o banco local (${error.message}). O arquivo foi preservado; restaure um backup valido antes de reiniciar a API.`,
                { cause: error }
            );
        }
        await writeDatabase(defaultDatabase);
        return validateDatabase(defaultDatabase);
    }
};

export const readCollection = (name) => withStoreLock(async () => {
    if (config.databaseUrl) {
        return readPostgresCollection(name);
    }

    const database = await readDatabase();

    if (!Array.isArray(database[name])) {
        throw new Error(`A colecao "${name}" do banco local nao e valida.`);
    }

    return database[name];
});

export const writeCollection = (name, value) => withStoreLock(async () => {
    if (config.databaseUrl) {
        return writePostgresCollection(name, value);
    }

    const database = await readDatabase();
    database[name] = value;
    await writeDatabase(database);
});

export const updateCollection = (name, updater) => withStoreLock(async () => {
    if (config.databaseUrl) {
        return updatePostgresCollection(name, updater);
    }

    const database = await readDatabase();
    if (!Array.isArray(database[name])) {
        throw new Error(`A colecao "${name}" do banco local nao e valida.`);
    }

    const updated = updater(database[name]);
    if (!Array.isArray(updated)) {
        throw new TypeError(`A atualizacao da colecao "${name}" deve retornar um array.`);
    }
    if (updated !== database[name]) {
        database[name] = updated;
        await writeDatabase(database);
    }
    return updated;
});

export const initializeStore = async () => {
    if (config.databaseUrl) {
        await initializePostgresStore();
    }
};

export const importLegacyCollections = async (payload) => {
    if (!config.databaseUrl) {
        throw new Error("DATABASE_URL e obrigatorio para importar dados ao PostgreSQL.");
    }
    return importPostgresLegacyCollections(payload);
};

export const saveFileInPostgres = async (file, content) => {
    if (!config.databaseUrl) {
        throw new Error("DATABASE_URL e obrigatoria para salvar arquivos no PostgreSQL.");
    }
    return savePostgresFileRecord(file, content);
};

export const readFileFromPostgres = async (fileId) => {
    if (!config.databaseUrl) {
        throw new Error("DATABASE_URL e obrigatoria para ler arquivos do PostgreSQL.");
    }
    return readPostgresFileContent(fileId);
};
