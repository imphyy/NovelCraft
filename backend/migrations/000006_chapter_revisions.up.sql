-- Create chapter_revisions table
CREATE TABLE chapter_revisions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chapter_id UUID NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    note TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_chapter_revisions_chapter_id ON chapter_revisions(chapter_id);
CREATE INDEX idx_chapter_revisions_created_at ON chapter_revisions(chapter_id, created_at DESC);
