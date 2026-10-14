export const EDITORIAL_STATUSES = Object.freeze({
    DRAFT: "rascunho",
    REVIEWED: "revisado",
    PUBLISHED: "publicado"
});

export const publishedRecords = (records) => {
    return records.filter((record) => record.editorialStatus === EDITORIAL_STATUSES.PUBLISHED);
};
