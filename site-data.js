// Compatibility barrel: keep existing imports stable while data lives by domain.
export const DEFAULT_QUERY = "subject:fantasy";

export const DEFAULT_LABEL = "Espadas e reinos";

export const RESULTS_PER_PAGE = 9;

export { featuredBooks } from "./data/books.js";

export { authorsCatalog } from "./data/authors.js";

export { glossaryTerms } from "./data/glossary.js";

export { topicThemes, readingPaths, advancedFilters, affinityQuestions } from "./data/themes.js";
