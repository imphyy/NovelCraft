# NovelCraft Database Schema

## Overview

NovelCraft uses PostgreSQL with the pgvector extension for storing both relational data (users, projects, chapters, wiki) and vector embeddings for AI-powered RAG (Retrieval-Augmented Generation).

---

## Extensions Required

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";
```

---

## Core Tables

### users

Stores user accounts.

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_users_email ON users(email);
```

**Notes:**
- Email is unique identifier for login
- Password hashed with bcrypt or argon2
- No soft deletes (user deletion cascades to all owned data)

---

### sessions

Cookie-based session storage.

```sql
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_sessions_token ON sessions(token);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);
```

**Notes:**
- Token stored in HttpOnly cookie
- Expires after configured duration (e.g., 7 days)
- Clean up expired sessions periodically

---

### projects

Top-level writing projects (books).

```sql
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_projects_user_id ON projects(user_id);
```

**Notes:**
- Each project is a separate novel/work
- All content scoped to project (chapters, wiki, etc.)
- Ownership enforced via `user_id`

---

### chapters

Individual chapters within a project.

```sql
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
```

**Notes:**
- `sort_order` determines chapter sequence
- `content` is the main text (Markdown or rich text as JSON)
- Word count calculated on-demand (not stored to avoid sync issues)
- Status helps track progress

---

### chapter_revisions

Revision history for chapters (optional snapshots).

```sql
CREATE TABLE chapter_revisions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chapter_id UUID NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    note TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_chapter_revisions_chapter_id ON chapter_revisions(chapter_id);
CREATE INDEX idx_chapter_revisions_created_at ON chapter_revisions(chapter_id, created_at DESC);
```

**Notes:**
- Snapshots created on explicit "save revision" action
- Or: automatic snapshots every N edits
- Can restore previous version by copying content back to chapter

---

## Wiki / Lore Bible Tables

### wiki_pages

Lore database entries.

```sql
CREATE TABLE wiki_pages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- character|location|faction|item|event|concept|misc
    title TEXT NOT NULL,
    summary TEXT NOT NULL DEFAULT '',
    content TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (project_id, type, title)
);

CREATE INDEX idx_wiki_pages_project_id ON wiki_pages(project_id);
CREATE INDEX idx_wiki_pages_type ON wiki_pages(project_id, type);
CREATE INDEX idx_wiki_pages_title ON wiki_pages(project_id, title);
```

**Notes:**
- Type categorizes entries (character, location, etc.)
- Title must be unique within project + type
- Summary is short blurb, content is full entry
- Supports full-text search later via `tsvector` if needed

---

### wiki_tags

Tags for wiki pages.

```sql
CREATE TABLE wiki_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    UNIQUE (project_id, name)
);

CREATE INDEX idx_wiki_tags_project_id ON wiki_tags(project_id);
```

---

### wiki_page_tags

Junction table linking pages to tags (many-to-many).

```sql
CREATE TABLE wiki_page_tags (
    wiki_page_id UUID NOT NULL REFERENCES wiki_pages(id) ON DELETE CASCADE,
    wiki_tag_id UUID NOT NULL REFERENCES wiki_tags(id) ON DELETE CASCADE,
    PRIMARY KEY (wiki_page_id, wiki_tag_id)
);

CREATE INDEX idx_wiki_page_tags_page_id ON wiki_page_tags(wiki_page_id);
CREATE INDEX idx_wiki_page_tags_tag_id ON wiki_page_tags(wiki_tag_id);
```

---

### wiki_links

Internal wiki-to-wiki links (e.g., `[[Character Name]]`).

```sql
CREATE TABLE wiki_links (
    from_page_id UUID NOT NULL REFERENCES wiki_pages(id) ON DELETE CASCADE,
    to_page_id UUID NOT NULL REFERENCES wiki_pages(id) ON DELETE CASCADE,
    PRIMARY KEY (from_page_id, to_page_id)
);

CREATE INDEX idx_wiki_links_from ON wiki_links(from_page_id);
CREATE INDEX idx_wiki_links_to ON wiki_links(to_page_id);
```

**Notes:**
- Parsed from `[[WikiLink]]` syntax in wiki content
- Backlinks derived by querying reverse direction
- Rebuild via explicit action or on save

---

### wiki_mentions

Links wiki pages to chapters where they appear.

```sql
CREATE TABLE wiki_mentions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wiki_page_id UUID NOT NULL REFERENCES wiki_pages(id) ON DELETE CASCADE,
    chapter_id UUID NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
    note TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (wiki_page_id, chapter_id)
);

CREATE INDEX idx_wiki_mentions_page_id ON wiki_mentions(wiki_page_id);
CREATE INDEX idx_wiki_mentions_chapter_id ON wiki_mentions(chapter_id);
```

**Notes:**
- Manually curated (user links wiki page to chapter)
- Or: auto-detected from `[[WikiLink]]` in chapter text
- Shows "Appears in" panel on wiki page

---

## AI / RAG Tables

### documents

Represents a text source for chunking (chapter or wiki page).

```sql
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    kind TEXT NOT NULL, -- chapter|wiki
    source_id UUID NOT NULL, -- chapters.id or wiki_pages.id
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (kind, source_id)
);

CREATE INDEX idx_documents_project_id ON documents(project_id);
CREATE INDEX idx_documents_source ON documents(kind, source_id);
```

**Notes:**
- Acts as a pointer to the original content
- When chapter/wiki updated, regenerate chunks

---

### chunks

Text chunks with embeddings for RAG retrieval.

```sql
CREATE TABLE chunks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    chunk_index INT NOT NULL,
    start_char INT NOT NULL DEFAULT 0,
    end_char INT NOT NULL DEFAULT 0,
    text TEXT NOT NULL,
    embedding vector(1536), -- dimension depends on model (1536 for text-embedding-3-small)
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (document_id, chunk_index)
);

CREATE INDEX idx_chunks_document_id ON chunks(document_id);
CREATE INDEX idx_chunks_embedding ON chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
```

**Notes:**
- `chunk_index` orders chunks within a document
- `start_char`/`end_char` track position in original text (for citations)
- `embedding` is the vector representation (OpenAI embeddings)
- `metadata` can store: chapter title, wiki page title, type, etc.
- **ivfflat index** speeds up similarity search (tune `lists` based on data size)

**Retrieval Query Example:**
```sql
SELECT
    c.id,
    c.text,
    c.metadata,
    1 - (c.embedding <=> :query_embedding) AS similarity
FROM chunks c
WHERE c.document_id IN (SELECT id FROM documents WHERE project_id = :project_id)
ORDER BY c.embedding <=> :query_embedding
LIMIT 10;
```

---

### ai_requests

Tracks AI usage for cost monitoring.

```sql
CREATE TABLE ai_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tool TEXT NOT NULL, -- ask|rewrite|expand|tighten|etc
    model TEXT NOT NULL DEFAULT '',
    tokens_in INT NOT NULL DEFAULT 0,
    tokens_out INT NOT NULL DEFAULT 0,
    cost_estimate_usd NUMERIC(10, 4) NOT NULL DEFAULT 0,
    latency_ms INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    meta JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX idx_ai_requests_project_id ON ai_requests(project_id);
CREATE INDEX idx_ai_requests_user_id ON ai_requests(user_id);
CREATE INDEX idx_ai_requests_created_at ON ai_requests(created_at DESC);
```

**Notes:**
- Log every AI request
- Calculate cost: `(tokens_in * input_price + tokens_out * output_price)`
- Dashboard can show: requests/day, total cost, average latency
- `meta` can store: prompt snippet, retrieval chunk count, etc.

---

## Ownership & Access Control

**Every resource is scoped to a user or project:**

| Table | Ownership | Access Check |
|-------|-----------|--------------|
| users | Self | User can only access their own account |
| sessions | User | Session validates user_id |
| projects | User | Check `projects.user_id = current_user_id` |
| chapters | Project → User | Check via `chapters.project_id → projects.user_id` |
| wiki_pages | Project → User | Check via `wiki_pages.project_id → projects.user_id` |
| documents | Project → User | Check via `documents.project_id → projects.user_id` |
| chunks | Document → Project → User | Check via chain |
| ai_requests | User + Project | Check `user_id` or `project_id` |

**Golden Rule:** Never trust IDs in requests. Always verify ownership in every handler.

---

## Migration Strategy

Use `golang-migrate` for versioned migrations.

**Example migration file structure:**
```
backend/migrations/
  000001_init.up.sql          # Create extensions, users, sessions
  000001_init.down.sql
  000002_projects.up.sql      # Create projects table
  000002_projects.down.sql
  000003_chapters.up.sql      # Create chapters, chapter_revisions
  000003_chapters.down.sql
  000004_wiki.up.sql          # Create wiki tables
  000004_wiki.down.sql
  000005_ai_rag.up.sql        # Create documents, chunks, ai_requests
  000005_ai_rag.down.sql
```

**Run migrations:**
```bash
migrate -path backend/migrations -database "postgres://..." up
```

---

## Sample Data Flow

### Writing a Chapter:
1. User creates chapter → row in `chapters`
2. User edits content → update `chapters.content`, `updated_at`
3. User saves revision → insert into `chapter_revisions`
4. (Later) AI chunking → insert into `documents`, `chunks` with embeddings

### Using Wiki:
1. User creates wiki page → row in `wiki_pages`
2. User adds tags → rows in `wiki_tags`, `wiki_page_tags`
3. User writes `[[Another Page]]` in content → parser creates row in `wiki_links`
4. User links to chapter → row in `wiki_mentions`

### AI Ask Query:
1. User types question
2. Backend embeds question
3. Query `chunks` for top K similar embeddings
4. Send chunks + question to GPT
5. Log request in `ai_requests`
6. Return answer with citations (chunk metadata)

---

## Performance Considerations

### Indexes:
- All foreign keys indexed
- Composite indexes for common queries (e.g., `project_id, sort_order`)
- Vector index (ivfflat) for embeddings

### Cascading Deletes:
- Deleting a project removes: chapters, wiki, documents, chunks, ai_requests
- Clean and automatic, no orphaned data

### Chunk Size:
- 500-1,200 tokens per chunk (~375-900 words)
- Balance: small enough for precision, large enough for context
- Test and tune based on query quality

### Vector Index Tuning:
- **ivfflat lists:** Start with `lists = 100`, increase for larger datasets
- **Rebuild index:** After bulk chunk inserts

---

## Future Enhancements (Not MVP)

- **Full-Text Search:** Add `tsvector` columns to chapters, wiki_pages
- **Timeline:** Separate `timeline_events` table with date fields
- **Relationships:** Dedicated `wiki_relationships` table (character ↔ location, etc.)
- **Media:** `wiki_media` table for images/attachments
- **Backups:** Automated snapshots to S3 or similar

---

## End Notes

This schema is designed for:
- **Ownership enforcement** (user_id checks everywhere)
- **RAG efficiency** (pgvector for embeddings)
- **Simplicity** (no premature abstractions)
- **Scalability** (indexes ready for growth)

**Never expose data without ownership validation.**
