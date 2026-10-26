import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { config } from "./config.mjs";

const COLLECTIONS = new Set(["users", "files", "libraries"]);
const MIGRATION_LOCK_ID = 734208170;
const pool = config.databaseUrl
    ? new (await import("pg")).Pool({
        connectionString: config.databaseUrl,
        connectionTimeoutMillis: 10_000,
        idleTimeoutMillis: 30_000,
        max: 10
    })
    : null;

const assertCollection = (name) => {
    if (!COLLECTIONS.has(name)) {
        throw new Error(`Colecao PostgreSQL desconhecida: "${name}".`);
    }
};

const requirePool = () => {
    if (!pool) {
        throw new Error("DATABASE_URL nao foi configurada.");
    }
    return pool;
};

let initialization;
const ensureInitialized = () => {
    initialization ||= initializePostgresStore();
    return initialization;
};

export const initializePostgresStore = async () => {
    const database = requirePool();
    const client = await database.connect();

    try {
        await client.query(`
            CREATE TABLE IF NOT EXISTS bosque_schema_migrations (
                version INTEGER PRIMARY KEY,
                name TEXT NOT NULL,
                applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )
        `);
        await client.query("SELECT pg_advisory_lock($1)", [MIGRATION_LOCK_ID]);

        const migrationDirectory = path.join(config.backendRoot, "migrations");
        const migrationFiles = (await readdir(migrationDirectory))
            .filter((file) => /^\d{3}-[a-z0-9-]+\.sql$/i.test(file))
            .sort();
        const migrations = await Promise.all(migrationFiles.map(async (file) => {
            const [, version, name] = file.match(/^(\d{3})-([a-z0-9-]+)\.sql$/i);
            return {
                version: Number(version),
                name,
                sql: await readFile(path.join(migrationDirectory, file), "utf8")
            };
        }));
        const applied = await client.query("SELECT version FROM bosque_schema_migrations");
        const appliedVersions = new Set(applied.rows.map((row) => row.version));

        for (const migration of migrations) {
            if (appliedVersions.has(migration.version)) continue;

            await client.query("BEGIN");
            try {
                await client.query(migration.sql);
                await client.query(
                    "INSERT INTO bosque_schema_migrations (version, name) VALUES ($1, $2)",
                    [migration.version, migration.name]
                );
                await client.query("COMMIT");
            } catch (error) {
                await client.query("ROLLBACK");
                throw error;
            }
        }

        for (const name of COLLECTIONS) {
            await client.query(
                "INSERT INTO bosque_collections (name, records) VALUES ($1, '[]'::jsonb) ON CONFLICT (name) DO NOTHING",
                [name]
            );
        }
    } finally {
        try {
            await client.query("SELECT pg_advisory_unlock($1)", [MIGRATION_LOCK_ID]);
        } finally {
            client.release();
        }
    }
};

export const checkPostgresConnection = async () => {
    await ensureInitialized();
    await requirePool().query("SELECT 1");
};

export const readPostgresCollection = async (name) => {
    assertCollection(name);
    await ensureInitialized();
    const result = await requirePool().query(
        "SELECT records FROM bosque_collections WHERE name = $1",
        [name]
    );
    return result.rows[0]?.records || [];
};

export const writePostgresCollection = async (name, records) => {
    assertCollection(name);
    if (!Array.isArray(records)) {
        throw new TypeError(`A colecao "${name}" deve ser um array.`);
    }

    await ensureInitialized();
    await requirePool().query(
        `INSERT INTO bosque_collections (name, records, updated_at)
         VALUES ($1, $2::jsonb, NOW())
         ON CONFLICT (name) DO UPDATE
         SET records = EXCLUDED.records, updated_at = NOW()`,
        [name, JSON.stringify(records)]
    );
};

export const updatePostgresCollection = async (name, updater) => {
    assertCollection(name);
    const database = requirePool();
    await ensureInitialized();
    const client = await database.connect();

    try {
        await client.query("BEGIN");
        const result = await client.query(
            "SELECT records FROM bosque_collections WHERE name = $1 FOR UPDATE",
            [name]
        );
        const current = result.rows[0]?.records || [];
        const updated = updater(current);

        if (!Array.isArray(updated)) {
            throw new TypeError(`A atualizacao da colecao "${name}" deve retornar um array.`);
        }
        if (updated !== current) {
            await client.query(
                "UPDATE bosque_collections SET records = $2::jsonb, updated_at = NOW() WHERE name = $1",
                [name, JSON.stringify(updated)]
            );
        }

        await client.query("COMMIT");
        return updated;
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};

export const savePostgresFileRecord = async (file, content) => {
    const database = requirePool();
    await ensureInitialized();
    const client = await database.connect();

    try {
        await client.query("BEGIN");
        await client.query(
            "INSERT INTO bosque_file_blobs (file_id, content) VALUES ($1, $2)",
            [file.id, content]
        );
        const result = await client.query(
            "SELECT records FROM bosque_collections WHERE name = 'files' FOR UPDATE"
        );
        const files = result.rows[0]?.records || [];
        await client.query(
            "UPDATE bosque_collections SET records = $1::jsonb, updated_at = NOW() WHERE name = 'files'",
            [JSON.stringify([...files, file])]
        );
        await client.query("COMMIT");
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};

export const readPostgresFileContent = async (fileId) => {
    await ensureInitialized();
    const result = await requirePool().query(
        "SELECT content FROM bosque_file_blobs WHERE file_id = $1",
        [fileId]
    );
    return result.rows[0]?.content || null;
};

export const importLegacyCollections = async ({ importId, sourceSha256, users, files }) => {
    if (!importId || !/^[a-f0-9]{64}$/.test(sourceSha256 || "")) {
        throw new TypeError("Importacao exige um ID e SHA-256 de origem validos.");
    }
    if (!Array.isArray(users) || !Array.isArray(files)) {
        throw new TypeError("Importacao exige colecoes validas de usuarios e arquivos.");
    }

    await ensureInitialized();
    const database = requirePool();
    const client = await database.connect();

    try {
        await client.query("BEGIN");
        const previous = await client.query(
            "SELECT source_sha256 FROM bosque_legacy_imports WHERE import_id = $1 FOR UPDATE",
            [importId]
        );
        if (previous.rowCount) {
            if (previous.rows[0].source_sha256 !== sourceSha256) {
                throw new Error("Este ID de importacao ja foi usado para outra origem; nenhum dado foi alterado.");
            }
            await client.query("COMMIT");
            return { imported: false, alreadyImported: true };
        }

        const current = await client.query(
            "SELECT name, records FROM bosque_collections WHERE name IN ('users', 'files') FOR UPDATE"
        );
        const currentByName = new Map(current.rows.map((row) => [row.name, row.records]));
        if ((currentByName.get("users") || []).length || (currentByName.get("files") || []).length) {
            throw new Error("As colecoes users/files do destino nao estao vazias; importacao cancelada sem sobrescrever dados.");
        }

        await client.query(
            "UPDATE bosque_collections SET records = $2::jsonb, updated_at = NOW() WHERE name = 'users'",
            [JSON.stringify(users)]
        );
        const fileRecords = files.map(({ contentBase64, ...file }) => file);
        await client.query(
            "UPDATE bosque_collections SET records = $2::jsonb, updated_at = NOW() WHERE name = 'files'",
            [JSON.stringify(fileRecords)]
        );
        for (const file of files) {
            if (typeof file.contentBase64 !== "string") {
                throw new Error(`Conteudo ausente para o arquivo legado ${file.id || "(sem ID)"}; importacao cancelada.`);
            }
            await client.query(
                "INSERT INTO bosque_file_blobs (file_id, content) VALUES ($1, $2)",
                [file.id, Buffer.from(file.contentBase64, "base64")]
            );
        }
        await client.query(
            "INSERT INTO bosque_legacy_imports (import_id, source_sha256) VALUES ($1, $2)",
            [importId, sourceSha256]
        );
        await client.query("COMMIT");
        return { imported: true, alreadyImported: false };
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};
