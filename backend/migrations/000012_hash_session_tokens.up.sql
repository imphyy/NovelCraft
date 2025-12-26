-- Rename token column to token_hash for security
-- Note: This will invalidate all existing sessions
DELETE FROM sessions; -- Clear existing sessions first

ALTER TABLE sessions
    RENAME COLUMN token TO token_hash;

-- Rename the index as well
ALTER INDEX idx_sessions_token RENAME TO idx_sessions_token_hash;

COMMENT ON COLUMN sessions.token_hash IS 'SHA-256 hash of the session token';
