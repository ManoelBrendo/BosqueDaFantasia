import crypto from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { config } from "./config.mjs";
import { readCollection, readFileFromPostgres, saveFileInPostgres, updateCollection } from "./json-store.mjs";

const safeFileName = (name) => {
    return String(name || "arquivo")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9._-]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 90) || "arquivo";
};

export const saveUserFile = async (user, payload) => {
    const contentBase64 = String(payload.contentBase64 || "");
    const buffer = Buffer.from(contentBase64, "base64");

    if (!buffer.length || buffer.length > 4_000_000) {
        throw Object.assign(new Error("Arquivo vazio ou maior que 4 MB."), { status: 400 });
    }

    const id = crypto.randomUUID();
    const originalName = safeFileName(payload.name);
    const storedName = `${id}-${originalName}`;

    const file = {
        id,
        userId: user.id,
        name: originalName,
        storedName,
        type: String(payload.type || "application/octet-stream"),
        size: buffer.length,
        createdAt: new Date().toISOString()
    };

    if (config.databaseUrl) {
        await saveFileInPostgres(file, buffer);
    } else {
        await mkdir(config.uploadDir, { recursive: true });
        await writeFile(path.join(config.uploadDir, storedName), buffer);
        await updateCollection("files", (files) => [...files, file]);
    }
    return file;
};

export const listUserFiles = async (user) => {
    const files = await readCollection("files");
    return files.filter((file) => file.userId === user.id);
};

export const readUserFile = async (user, fileId) => {
    const files = await readCollection("files");
    const file = files.find((entry) => entry.id === fileId && entry.userId === user.id);

    if (!file) {
        throw Object.assign(new Error("Arquivo nao encontrado."), { status: 404 });
    }

    const content = config.databaseUrl
        ? await readFileFromPostgres(file.id)
        : await readFile(path.join(config.uploadDir, file.storedName));
    if (!content) {
        throw new Error(`O conteudo do arquivo ${file.id} nao foi encontrado no armazenamento.`);
    }
    return {
        ...file,
        contentBase64: content.toString("base64")
    };
};
