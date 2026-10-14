import { createServer } from 'node:http';
import path from 'node:path';
import { servePublicFile } from './static-files.mjs';
const root = path.resolve(process.argv[2] || '.');
const port = Number(process.argv[3] || 4173);
createServer((request, response) => servePublicFile(request, response, root)).listen(port, '127.0.0.1', () => console.log(`Bosque da Fantasia em http://127.0.0.1:${port}`));
