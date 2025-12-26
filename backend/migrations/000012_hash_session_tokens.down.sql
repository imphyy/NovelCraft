-- Revert token_hash back to token
DELETE FROM sessions; -- Clear existing sessions first

ALTER TABLE sessions
    RENAME COLUMN token_hash TO token;

-- Revert the index name as well
ALTER INDEX idx_sessions_token_hash RENAME TO idx_sessions_token;

COMMENT ON COLUMN sessions.token IS NULL;
