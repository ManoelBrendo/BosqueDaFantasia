import { servePublicFile } from "../../scripts/static-files.mjs";
import { config } from "./config.mjs";

export const sendJson = (response, status, payload, headers = {}) => {
    response.writeHead(status, {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
        "Access-Control-Allow-Origin": config.corsOrigin,
        "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type,Authorization",
        ...headers
    });
    response.end(JSON.stringify(payload));
};

export const readJsonBody = async (request) => {
    const chunks = [];
    let size = 0;

    for await (const chunk of request) {
        size += chunk.length;

        if (size > config.maxJsonBytes) {
            throw Object.assign(new Error("Payload muito grande."), { status: 413 });
        }

        chunks.push(chunk);
    }

    const rawBody = Buffer.concat(chunks).toString("utf8");
    try { return rawBody ? JSON.parse(rawBody) : {}; } catch { throw Object.assign(new Error("JSON inválido."), { status: 400 }); }
};

export const serveStatic = (request, response) => servePublicFile(request, response, config.publicRoot);
