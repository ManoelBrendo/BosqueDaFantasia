import { copyFile, mkdir, readdir, rm, stat } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const dist = path.join(root, "dist");
const ignored = new Set([".git", "dist", "node_modules", "artifacts", "backend", "docs", "scripts", ".env", ".env.local"]);
const ignoredNested = new Set([
    path.join("backend", "data"),
    path.join("backend", "uploads")
]);

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });

const copyDirectory = async (sourceDirectory, targetDirectory) => {
    await mkdir(targetDirectory, { recursive: true });
    const entries = await readdir(sourceDirectory, { withFileTypes: true });

    for (const entry of entries) {
        if (ignored.has(entry.name)) {
            continue;
        }

        const sourcePath = path.join(sourceDirectory, entry.name);
        const targetPath = path.join(targetDirectory, entry.name);
        const relativePath = path.relative(root, sourcePath);

        if (ignoredNested.has(relativePath)) {
            continue;
        }

        if (entry.isDirectory()) {
            await copyDirectory(sourcePath, targetPath);
            continue;
        }

        const stats = await stat(sourcePath);

        if (stats.isFile()) {
            await copyFile(sourcePath, targetPath);
        }
    }
};

await copyDirectory(root, dist);

console.log(`Build estatico criado em ${path.relative(root, dist)}.`);
