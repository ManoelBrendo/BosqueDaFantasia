CREATE TABLE IF NOT EXISTS bosque_legacy_imports (
    import_id TEXT PRIMARY KEY,
    source_sha256 TEXT NOT NULL,
    imported_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
