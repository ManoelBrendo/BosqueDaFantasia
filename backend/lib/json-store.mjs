import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { config } from "./config.mjs";

const ensureDataDir = () => mkdir(config.dataDir, { recursive: true });
const databasePath = path.join(config.dataDir, "bosque-db.json");
const tempDatabasePath = path.join(config.dataDir, "bosque-db.tmp.json");
const defaultDatabase = {
    users: [],
    files: [],
    meta: {
        schemaVersion: 1,
        createdAt: new Date().toISOString()
    }
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

    await writeFile(tempDatabasePath, JSON.stringify(nextDatabase, null, 2), "utf8");
    await rename(tempDatabasePath, databasePath);
};

const readDatabase = async () => {
    await ensureDataDir();

    try {
        return {
            ...defaultDatabase,
            ...JSON.parse(await readFile(databasePath, "utf8"))
        };
    } catch {
        await writeDatabase(defaultDatabase);
        return { ...defaultDatabase };
    }
};

export const readCollection = async (name, fallback = []) => {
    const database = await readDatabase();

    if (!Array.isArray(database[name])) {
        database[name] = fallback;
        await writeDatabase(database);
    }

    return database[name];
};

export const writeCollection = async (name, value) => {
    const database = await readDatabase();
    database[name] = value;
    await writeDatabase(database);
};
