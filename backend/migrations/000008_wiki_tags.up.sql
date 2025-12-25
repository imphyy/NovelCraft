CREATE TABLE wiki_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (project_id, name)
);

CREATE TABLE wiki_page_tags (
    wiki_page_id UUID NOT NULL REFERENCES wiki_pages(id) ON DELETE CASCADE,
    wiki_tag_id UUID NOT NULL REFERENCES wiki_tags(id) ON DELETE CASCADE,
    PRIMARY KEY (wiki_page_id, wiki_tag_id)
);

CREATE INDEX idx_wiki_tags_project_id ON wiki_tags(project_id);
CREATE INDEX idx_wiki_page_tags_page_id ON wiki_page_tags(wiki_page_id);
CREATE INDEX idx_wiki_page_tags_tag_id ON wiki_page_tags(wiki_tag_id);
