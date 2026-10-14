import { readFile, realpath, stat } from "node:fs/promises";
import path from "node:path";

const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.ico': 'image/x-icon', '.webmanifest': 'application/manifest+json', '.woff2': 'font/woff2', '.md': 'text/markdown; charset=utf-8' };
const publicDirectories = new Set(["assets", "data"]);
export const servePublicFile = async (request, response, root) => {
    const fail = status => { response.writeHead(status, { 'Content-Type': 'text/plain; charset=utf-8' }); response.end(status === 404 ? 'Not found' : 'Invalid request'); };
    if (!['GET', 'HEAD'].includes(request.method)) return fail(405);
    let pathname;
    try { pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname); } catch { return fail(400); }
    if (pathname.includes('\\') || pathname.includes('\0')) return fail(400);
    const segments = pathname.split('/').filter(Boolean);
    if (segments.some(segment => segment.startsWith('.')) || (segments.length > 1 && !publicDirectories.has(segments[0]))) return fail(404);
    const file = segments.length ? segments.join('/') : 'index.html';
    if (path.extname(file) === ".md" && file !== "CREDITOS-IMAGENS.md") return fail(404);
    if (!types[path.extname(file)]) return fail(404);
    try {
        const target = await realpath(path.resolve(root, file));
        const relative = path.relative(await realpath(root), target);
        if (relative.startsWith('..') || path.isAbsolute(relative) || !(await stat(target)).isFile()) return fail(404);
        const content = await readFile(target);
        response.writeHead(200, { 'Content-Type': types[path.extname(file)], 'Content-Length': content.length, 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'no-cache' });
        response.end(request.method === 'HEAD' ? undefined : content);
    } catch { return fail(404); }
};
