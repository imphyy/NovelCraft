-- Create chapters table
CREATE TABLE chapters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    sort_order INT NOT NULL,
    title TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft', -- draft|revising|final
    content TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (project_id, sort_order)
);

CREATE INDEX idx_chapters_project_id ON chapters(project_id);
CREATE INDEX idx_chapters_sort_order ON chapters(project_id, sort_order);
