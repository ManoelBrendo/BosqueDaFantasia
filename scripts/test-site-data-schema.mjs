import assert from "node:assert/strict";
import { bookRecords } from "../data/books.js";
import { authorRecords } from "../data/authors.js";
import { glossaryRecords } from "../data/glossary.js";
import { readingPathRecords, topicThemeRecords } from "../data/themes.js";
import { validateSiteData } from "./site-data-schema.mjs";
import { publishedRecords } from "../data/editorial.js";

const validCollections = {
    bookRecords,
    authorRecords,
    glossaryRecords,
    topicThemeRecords,
    readingPathRecords
};

assert.deepEqual(validateSiteData(validCollections), []);
assert.ok(validateSiteData(null).some((error) => error.includes("objeto de colecoes")));

const invalidStableId = validateSiteData({
    ...validCollections,
    topicThemeRecords: [{ ...topicThemeRecords[0], id: "Tema invalido" }]
});
assert.ok(invalidStableId.some((error) => error.includes("kebab-case")));

const invalidStatus = validateSiteData({
    ...validCollections,
    authorRecords: [{ ...authorRecords[0], editorialStatus: "em-revisao" }]
});
assert.ok(invalidStatus.some((error) => error.includes("editorialStatus")));

const duplicateBook = { ...bookRecords[0], editorialStatus: "revisado" };
const duplicateIdErrors = validateSiteData({
    ...validCollections,
    bookRecords: [...bookRecords, duplicateBook]
});
assert.ok(duplicateIdErrors.some((error) => error.includes("duplicado")));

const missingEditorialStatus = validateSiteData({
    ...validCollections,
    glossaryRecords: [{ ...glossaryRecords[0], editorialStatus: undefined }]
});
assert.ok(missingEditorialStatus.some((error) => error.includes("editorialStatus")));

const brokenPath = validateSiteData({
    ...validCollections,
    readingPathRecords: [{ ...readingPathRecords[0], bookIds: ["missing-book"] }]
});
assert.ok(brokenPath.some((error) => error.includes("nao existe na curadoria")));

const missingRequiredField = validateSiteData({
    ...validCollections,
    authorRecords: [{ ...authorRecords[0], summary: "" }]
});
assert.ok(missingRequiredField.some((error) => error.includes("summary: campo obrigatorio")));

const unpublished = { id: "draft", editorialStatus: "rascunho" };
assert.deepEqual(publishedRecords([unpublished, { id: "public", editorialStatus: "publicado" }]), [
    { id: "public", editorialStatus: "publicado" }
]);

console.log("OK: editorial data IDs, required fields, statuses, publication filtering, and path references are valid.");
