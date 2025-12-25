CREATE TABLE wiki_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    source_type TEXT NOT NULL,
    source_id UUID NOT NULL,
    target_page_id UUID NOT NULL REFERENCES wiki_pages(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (source_type IN ('wiki_page', 'chapter')),
    UNIQUE (source_type, source_id, target_page_id)
);

CREATE INDEX idx_wiki_links_source ON wiki_links(source_type, source_id);
CREATE INDEX idx_wiki_links_target ON wiki_links(target_page_id);
CREATE INDEX idx_wiki_links_project_id ON wiki_links(project_id);
