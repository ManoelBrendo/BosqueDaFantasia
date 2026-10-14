import { access, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { bookRecords } from "../data/books.js";
import { authorRecords } from "../data/authors.js";
import { glossaryRecords } from "../data/glossary.js";
import { readingPathRecords, topicThemeRecords } from "../data/themes.js";
import { validateSiteData } from "./site-data-schema.mjs";

const root = process.cwd();
const htmlRefPattern = /\b(?:href|src)=["']([^"']+)["']/gi;
const importRefPattern = /\bimport\s+(?:[^"']+\s+from\s+)?["']([^"']+)["']/gi;
const skipPrefixes = ["#", "http://", "https://", "mailto:", "tel:", "data:", "javascript:"];
const checkedExtensions = new Set([".html", ".js", ".css", ".webmanifest"]);
const failures = [];
const dataErrors = validateSiteData({
    bookRecords,
    authorRecords,
    glossaryRecords,
    topicThemeRecords,
    readingPathRecords
});

const walk = async (directory) => {
    const entries = await readdir(directory, { withFileTypes: true });
    const files = [];

    for (const entry of entries) {
        if (entry.name === ".git" || entry.name === "dist" || entry.name === "node_modules") {
            continue;
        }

        const fullPath = path.join(directory, entry.name);
        const relativePath = path.relative(root, fullPath);

        if (relativePath === path.join("backend", "data") || relativePath === path.join("backend", "uploads")) {
            continue;
        }

        if (entry.isDirectory()) {
            files.push(...await walk(fullPath));
            continue;
        }

        if (checkedExtensions.has(path.extname(entry.name))) {
            files.push(fullPath);
        }
    }

    return files;
};

const stripQueryAndHash = (value) => value.split("#")[0].split("?")[0];

const isSkippable = (value) => {
    return skipPrefixes.some((prefix) => value.startsWith(prefix));
};

const checkReference = async ({ filePath, reference }) => {
    const rawReference = reference.trim();

    if (!rawReference || isSkippable(rawReference) || rawReference.includes("${")) {
        return;
    }

    const cleanReference = stripQueryAndHash(rawReference);

    if (!cleanReference || isSkippable(cleanReference)) {
        return;
    }

    const directory = path.dirname(filePath);
    const targetPath = path.resolve(directory, cleanReference);

    try {
        await access(targetPath);
    } catch {
        failures.push(`${path.relative(root, filePath)} -> ${rawReference}`);
    }
};

const checkFile = async (filePath) => {
    const content = await readFile(filePath, "utf8");
    const extension = path.extname(filePath);

    if (extension === ".js") {
        const matches = content.matchAll(importRefPattern);

        for (const match of matches) {
            await checkReference({ filePath, reference: match[1] });
        }

        return;
    }

    const matches = content.matchAll(htmlRefPattern);

    for (const match of matches) {
        await checkReference({ filePath, reference: match[1] });
    }
};

const files = await walk(root);

await Promise.all(files.map(checkFile));

if (failures.length > 0) {
    console.error("Referencias locais ausentes:");
    failures.forEach((failure) => console.error(`- ${failure}`));
    process.exit(1);
}

if (dataErrors.length > 0) {
    console.error("Dados editoriais invalidos:");
    dataErrors.forEach((error) => console.error(`- ${error}`));
    process.exit(1);
}

console.log(`OK: ${files.length} arquivos verificados sem referencias locais quebradas.`);
