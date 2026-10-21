CREATE TABLE IF NOT EXISTS bosque_collections (
    name TEXT PRIMARY KEY,
    records JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT bosque_collections_records_array
        CHECK (jsonb_typeof(records) = 'array')
);
