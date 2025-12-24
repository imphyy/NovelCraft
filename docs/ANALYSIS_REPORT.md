# NovelCraft ChatGPT Conversation Log Analysis Report

## Executive Summary

This conversation log documents the complete planning and design process for **NovelCraft**, a personal writing web application for novelists. The discussion covers AI model selection, architecture design, technical stack choices, database schema, API specifications, and development workflow.

---

## Major Topics & Categories

### 1. AI Model Selection & Integration Strategy
**Location:** Lines 1-617

#### Key Decisions:
- **Primary Model:** GPT-5.x chosen as the main "canon" model for:
  - Long-term narrative consistency
  - Lore tracking and plot logic
  - Layered reality and mystery management
  - Meta-fiction and existential themes

- **Secondary Model:** Claude (Anthropic) for:
  - Emotional nuance and polish
  - Character interiority and dialogue refinement
  - Style editing (not primary canon work)

- **Reasoning:** Avoid model hopping to prevent tonal drift and lore contradictions

#### API vs Subscription:
- ChatGPT subscription ($20-200/mo) is flat-rate for interactive use
- API is pay-per-token, better for programmatic integration
- API data not used for training (privacy advantage)
- Cost structure: GPT-5 ~$1.25/1M input tokens, ~$10/1M output tokens

---

### 2. Lore Bible & Writing Assistant Rules
**Location:** Lines 396-551

#### Core Principles Defined:

**Canon Authority:**
- User decides canon, AI preserves consistency
- Never invent canon facts unless explicitly instructed
- Flag ambiguities rather than guessing
- Track: Hard Canon, Perceived Truth, Suppressed Truth, Unknown/Future Reveal

**Layered Reality Requirements:**
- Story contains false memories, suppressed knowledge, unreliable perspectives
- Do not resolve mysteries early
- Hints preferred over explanations
- Emotional dissonance is intentional

**Writing Rules:**
- Maintain consistent character voice
- Dialogue should imply more than it states
- Avoid modern idioms unless appropriate
- Never "solve" tension for the reader
- Preserve meaning and subtext
- Do not simplify ambiguity

**Tone & Theme:**
- Subtle unease over overt horror
- Wonder mixed with melancholy
- Mystery should feel intentional, not confusing
- Avoid exposition dumps

**Forbidden Actions:**
- Introduce definitive answers to unresolved mysteries
- Explain hidden systems unless told "reveal"
- Retcon canon without instruction
- Remove intentional ambiguity

#### Suggestion Format:
When generating ideas, provide:
- Option A (Safe / Canon-aligned)
- Option B (Risky / Tension-increasing)
- Option C (Subtle / Long-term payoff)

Flag: potential contradictions, unintended reveals, tonal risks

---

### 3. Technical Architecture
**Location:** Lines 727-1217

#### Stack Choice:
- **Frontend:** React + TypeScript (Vite)
- **Backend:** Go with Echo framework
- **Database:** PostgreSQL with pgvector extension
- **Deployment:** Railway (mentioned)
- **Repository:** Monorepo structure

#### Architecture Pattern: RAG (Retrieval-Augmented Generation)
**Why RAG:**
- Keeps novel text out of every prompt (cost savings)
- Better consistency (only relevant chunks sent to AI)
- Enables citation of sources

**How RAG Works:**
1. Store novel/wiki text in database
2. Split into chunks (~500-1,200 tokens each)
3. Create embeddings for each chunk
4. Store embeddings in vector index
5. On AI request: retrieve most relevant chunks, send only those to model

---

### 4. Feature Categories

#### A. Core Writing Features (Book Editor)
**Location:** Lines 862-921

**Project Structure:**
- Multiple projects/books
- Chapters with: title, order, status (draft/revising/final), word count, last edited
- Optional: scenes/sections inside chapters

**Editor:**
- Rich text or Markdown editor
- Autosave + manual save
- Chapter navigation sidebar
- Basic formatting: headings, italics, bold, quotes, lists
- Optional: focus mode

**Versioning:**
- Revision history per chapter
- Restore previous versions
- "Snapshot" / milestone tagging (e.g., "Draft 1 complete")

**Export:**
- Markdown (easy)
- DOCX (nice)
- PDF (optional)
- Compile order, include/exclude chapters

**Search:**
- Across chapter titles + contents
- Notes
- Wiki pages
- Filters: project, chapter, tag

#### B. Wiki / Lore Database Features
**Location:** Lines 921-956

**Wiki Page Types:**
- Character
- Location
- Faction
- Item
- Event
- Concept
- Misc

**Fields:**
- Name, short summary, full entry content
- Tags
- "Appears in" references (chapters/scenes)
- Relationships (character ↔ character, faction ↔ location, etc.)

**Linking:**
- Wiki-to-wiki links using [[WikiLink]] syntax
- Wiki links from chapter text (highlight + link)
- Backlinks: show "Referenced by..."

**Timeline (optional):**
- Events with date/order
- Link events to chapters + characters involved

**Media:**
- Image upload (character portraits / maps)
- Attachments per wiki entry (optional)

#### C. AI Functionality
**Location:** Lines 957-1023

**C1. AI "Ask my Novel/Wiki" (RAG)**
- Ask questions with citations:
  - "Where did we first mention X?"
  - "What's the description of the city?"
  - "List contradictions about Y"
- Sources cite: chapter + paragraph, or wiki page section

**C2. AI Writing Tools (Controlled Generation)**
Tools operating on selected text:
- Rewrite (tone/voice/style)
- Expand a scene
- Tighten prose
- Dialogue variants
- Show vs tell pass
- Summarize chapter (internal + reader-facing)
- Generate "next beat" options without breaking canon

**C3. AI Consistency Tools**
- Continuity check: detect conflicting facts
- "Open threads" tracker: unresolved setups
- Foreshadow suggestions: where to seed subtle hints
- Character voice checker (optional)

**C4. Lore Bible Integration (Guardrails)**
- System-level rules: canon vs perceived vs suppressed truth
- Don't reveal mysteries unless told
- "Canon locked" mode toggle: AI must only use retrieved sources + user notes

**C5. AI Cost Controls**
- Token budgeting per request
- Limit retrieval chunks
- Cache repeated context (lore bible + stable wiki snippets)
- Usage dashboard: requests/day, approximate spend

---

### 5. Database Schema
**Location:** Lines 1056-1899

#### Core Tables:

**users**
```sql
id UUID PRIMARY KEY
email TEXT NOT NULL UNIQUE
password_hash TEXT NOT NULL
created_at TIMESTAMPTZ NOT NULL DEFAULT now()
```

**projects**
```sql
id UUID PRIMARY KEY
user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
name TEXT NOT NULL
description TEXT NOT NULL DEFAULT ''
created_at TIMESTAMPTZ NOT NULL DEFAULT now()
updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
```

**chapters**
```sql
id UUID PRIMARY KEY
project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE
sort_order INT NOT NULL
title TEXT NOT NULL
status TEXT NOT NULL DEFAULT 'draft' -- draft|revising|final
content TEXT NOT NULL DEFAULT ''
created_at TIMESTAMPTZ NOT NULL DEFAULT now()
updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
UNIQUE (project_id, sort_order)
```

**chapter_revisions**
```sql
id UUID PRIMARY KEY
chapter_id UUID NOT NULL REFERENCES chapters(id) ON DELETE CASCADE
content TEXT NOT NULL
created_at TIMESTAMPTZ NOT NULL DEFAULT now()
note TEXT NOT NULL DEFAULT ''
```

**wiki_pages**
```sql
id UUID PRIMARY KEY
project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE
type TEXT NOT NULL -- character|location|faction|item|event|concept|misc
title TEXT NOT NULL
summary TEXT NOT NULL DEFAULT ''
content TEXT NOT NULL DEFAULT ''
created_at TIMESTAMPTZ NOT NULL DEFAULT now()
updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
UNIQUE (project_id, type, title)
```

**wiki_tags & wiki_page_tags**
```sql
-- wiki_tags
id UUID PRIMARY KEY
project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE
name TEXT NOT NULL
UNIQUE (project_id, name)

-- wiki_page_tags (junction table)
wiki_page_id UUID NOT NULL REFERENCES wiki_pages(id) ON DELETE CASCADE
wiki_tag_id UUID NOT NULL REFERENCES wiki_tags(id) ON DELETE CASCADE
PRIMARY KEY (wiki_page_id, wiki_tag_id)
```

**wiki_links**
```sql
from_page_id UUID NOT NULL REFERENCES wiki_pages(id) ON DELETE CASCADE
to_page_id UUID NOT NULL REFERENCES wiki_pages(id) ON DELETE CASCADE
PRIMARY KEY (from_page_id, to_page_id)
```

**wiki_mentions**
```sql
id UUID PRIMARY KEY
wiki_page_id UUID NOT NULL REFERENCES wiki_pages(id) ON DELETE CASCADE
chapter_id UUID NOT NULL REFERENCES chapters(id) ON DELETE CASCADE
note TEXT NOT NULL DEFAULT ''
created_at TIMESTAMPTZ NOT NULL DEFAULT now()
UNIQUE (wiki_page_id, chapter_id)
```

**sessions**
```sql
id UUID PRIMARY KEY
user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
token TEXT NOT NULL UNIQUE
created_at TIMESTAMPTZ NOT NULL DEFAULT now()
expires_at TIMESTAMPTZ NOT NULL
```

#### AI/RAG Tables:

**documents**
```sql
id UUID PRIMARY KEY
project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE
kind TEXT NOT NULL -- chapter|wiki
source_id UUID NOT NULL -- chapters.id or wiki_pages.id
created_at TIMESTAMPTZ NOT NULL DEFAULT now()
updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
UNIQUE (kind, source_id)
```

**chunks**
```sql
id UUID PRIMARY KEY
document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE
chunk_index INT NOT NULL
start_char INT NOT NULL DEFAULT 0
end_char INT NOT NULL DEFAULT 0
text TEXT NOT NULL
embedding vector(1536) -- dimension depends on model
metadata JSONB NOT NULL DEFAULT '{}'::jsonb
created_at TIMESTAMPTZ NOT NULL DEFAULT now()
UNIQUE (document_id, chunk_index)
```

**ai_requests** (usage tracking)
```sql
id UUID PRIMARY KEY
project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE
user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
tool TEXT NOT NULL -- ask|rewrite|expand|tighten|etc
model TEXT NOT NULL DEFAULT ''
tokens_in INT NOT NULL DEFAULT 0
tokens_out INT NOT NULL DEFAULT 0
cost_estimate_usd NUMERIC(10, 4) NOT NULL DEFAULT 0
latency_ms INT NOT NULL DEFAULT 0
created_at TIMESTAMPTZ NOT NULL DEFAULT now()
meta JSONB NOT NULL DEFAULT '{}'::jsonb
```

---

### 6. API Endpoint Specifications
**Location:** Lines 1909-2185

#### Base: `/api`

#### Authentication (Cookie-based sessions)

**POST /api/auth/register**
```json
Request: { "email": "user@example.com", "password": "..." }
Response: { "user": { "id": "uuid", "email": "user@example.com" } }
```

**POST /api/auth/login**
```json
Request: { "email": "user@example.com", "password": "..." }
Response: { "user": { "id": "uuid", "email": "user@example.com" } }
Sets: HttpOnly session cookie
```

**POST /api/auth/logout**
```json
Response: { "ok": true }
```

**GET /api/auth/me**
```json
Response: { "user": { "id": "uuid", "email": "user@example.com" } }
```

#### Projects

**GET /api/projects**
```json
Response: {
  "projects": [
    { "id": "uuid", "name": "Book 1", "description": "", "createdAt": "...", "updatedAt": "..." }
  ]
}
```

**POST /api/projects**
```json
Request: { "name": "Book 1", "description": "Optional" }
Response: { "project": { "id": "uuid", "name": "Book 1", "description": "Optional" } }
```

**GET /api/projects/:projectId**
**PATCH /api/projects/:projectId**
**DELETE /api/projects/:projectId**

#### Chapters

**GET /api/projects/:projectId/chapters**
```json
Response: {
  "chapters": [
    { "id": "uuid", "sortOrder": 1, "title": "Chapter 1", "status": "draft", "wordCount": 1234, "updatedAt": "..." }
  ]
}
```

**POST /api/projects/:projectId/chapters**
```json
Request: { "title": "Chapter 1" }
Response: { "chapter": { "id": "uuid", "sortOrder": 1, "title": "Chapter 1", "status": "draft" } }
```

**GET /api/chapters/:chapterId**
```json
Response: {
  "chapter": {
    "id": "uuid",
    "projectId": "uuid",
    "sortOrder": 1,
    "title": "Chapter 1",
    "status": "draft",
    "content": "...",
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

**PATCH /api/chapters/:chapterId**
```json
Request: { "title": "New title", "status": "revising", "content": "..." }
Response: { "chapter": { ... } }
```

**POST /api/projects/:projectId/chapters/reorder**
```json
Request: { "orderedChapterIds": ["uuid1", "uuid2", "uuid3"] }
Response: { "ok": true }
```

#### Chapter Revisions

**POST /api/chapters/:chapterId/revisions**
**GET /api/chapters/:chapterId/revisions**
**GET /api/revisions/:revisionId**
**POST /api/revisions/:revisionId/restore**

#### Wiki

**GET /api/projects/:projectId/wiki**
Query params: `type`, `q`, `tag`
```json
Response: {
  "pages": [
    { "id": "uuid", "type": "character", "title": "Rhea", "summary": "...", "updatedAt": "..." }
  ]
}
```

**POST /api/projects/:projectId/wiki**
**GET /api/wiki/:pageId** (includes tags, backlinks, mentions)
**PATCH /api/wiki/:pageId**
**DELETE /api/wiki/:pageId**

**PUT /api/wiki/:pageId/tags**
```json
Request: { "tags": ["mysterious", "ally"] }
Response: { "tags": ["mysterious", "ally"] }
```

**POST /api/wiki/:pageId/rebuild-links**
```json
Response: { "ok": true, "linksCreated": 3 }
```

**PUT /api/wiki/:pageId/mentions**
```json
Request: { "chapterIds": ["uuidA", "uuidB"] }
Response: { "ok": true }
```

#### Search

**GET /api/projects/:projectId/search?q=...**
```json
Response: {
  "chapters": [{ "id": "uuid", "title": "Chapter 3", "sortOrder": 3, "snippet": "..." }],
  "wiki": [{ "id": "uuid", "type": "location", "title": "Ganta Village", "snippet": "..." }]
}
```

---

### 7. Development Plan & Phases
**Location:** Lines 1083-1209

#### Phase 0 — Setup (1-2 sessions)
- Repo structure (frontend + backend)
- Auth + basic user table
- Project + chapter CRUD
- Deploy pipeline (Railway or similar)
- Postgres migrations
**Deliverable:** login + create project + create/edit chapters (plain text)

#### Phase 1 — Writing MVP (core usability)
- Proper editor (Markdown or rich text)
- Autosave + chapter list + reorder
- Search across chapters
- Export to Markdown (and/or DOCX later)
- Basic revision history (simple "save snapshots")
**Deliverable:** you can actually write a book comfortably

#### Phase 2 — Wiki MVP
- Wiki page CRUD
- Types + tags
- [[link]] support + backlinks
- Search across wiki
- Link a wiki page to chapters
**Deliverable:** wiki becomes your story bible

#### Phase 3 — AI "Ask my novel/wiki" (RAG)
- Chunking + embeddings pipeline
- Retrieval endpoint (top-K chunks)
- Q&A UI with citations (click to jump to source)
**Deliverable:** ask questions and get grounded answers with references

#### Phase 4 — AI writing tools
- Selected-text actions in editor: rewrite/expand/tighten/dialogue options
- "Lore Bible loaded" system prompt + canon-safe mode
- Output diff view (accept/reject changes)
**Deliverable:** AI becomes a writing assistant, not a text dump machine

#### Phase 5 — Consistency & advanced features
- Contradiction detector (AI + heuristics)
- Timeline/events module (optional)
- Character voice tooling (optional)
- Better export (DOCX/PDF)
- Backups + "download project"
**Deliverable:** a durable long-term tool for finishing a novel

#### MVP Scope Recommendation:
**MVP = Phase 1 + Phase 2** (Writing + Wiki first, no AI yet)
Then add Phase 3, then Phase 4.
This prevents building a fancy AI wrapper around a weak writing experience.

---

### 8. Backend Structure (Go + Echo)
**Location:** Lines 2186-2420

#### Directory Structure:
```
backend/
  cmd/api/
    main.go
  internal/
    config/
      config.go
    db/
      db.go
    httpapi/
      server.go
      middleware.go
      errors.go
      routes.go
    auth/
      handler.go
      service.go
    projects/
      handler.go
      service.go
    chapters/
      handler.go
      service.go
    wiki/
      handler.go
      service.go
  migrations/
```

#### Authentication Approach:
- Cookie-based sessions (simpler for web app)
- Cookie name: `novelcraft_session`
- HttpOnly, Secure in prod, SameSite=Lax
- DB-backed sessions (can invalidate/rotate)
- Sessions table stores: id, user_id, token, created_at, expires_at

#### Echo Middleware Stack:
- Recover
- RequestID
- Gzip
- Secure
- BodyLimit ("2M")
- CORS (dev: allow http://localhost:5173 with credentials)

#### Database Layer:
- Use pgxpool for connection pooling
- Read DATABASE_URL from environment
- Ping on startup to verify connection

---

### 9. Infrastructure Setup
**Location:** Lines 1681-1708, 2460-2478

#### Docker Compose (infra/docker-compose.yml)
```yaml
services:
  db:
    image: pgvector/pgvector:pg16
    container_name: novelcraft-db
    environment:
      POSTGRES_USER: novelcraft
      POSTGRES_PASSWORD: novelcraft
      POSTGRES_DB: novelcraft
    ports:
      - "5432:5432"
    volumes:
      - novelcraft_db:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U novelcraft -d novelcraft"]
      interval: 5s
      timeout: 3s
      retries: 10
```

#### Migrations Framework:
- Use golang-migrate/migrate CLI
- Migrations in backend/migrations/
- Run: `migrate -path backend/migrations -database "postgres://..." up`

---

### 10. Frontend Architecture
**Location:** Lines 2711-2780

#### Tech Stack:
- Vite + React + TypeScript
- Editor options: TipTap (rich text) or Milkdown (markdown-like)

#### Core Pages:
- `/login`
- `/projects` (dashboard)
- `/projects/:projectId` (chapter list + editor)
- `/wiki` and `/wiki/:pageId`

#### API Client:
- Central fetch wrapper
- credentials: "include" (for cookies)
- Handles 401 → redirect to login

#### Features:
- Project dashboard (list, create, open)
- Chapter sidebar (list, reorder, create)
- Editor with autosave (debounced) + saving indicator
- Wiki list with type filter + search
- Wiki editor (title/type/summary/content/tags)
- Backlinks + mentions panels
- "Rebuild links" button

---

### 11. CI/CD
**Location:** Lines 1356-1370, 2782-2794

#### GitHub Actions (.github/workflows/ci.yml)
On push/PR:
- Frontend: install + build
- Backend: go test + go build

---

### 12. Repository Structure & GitHub Setup
**Location:** Lines 1230-1592

#### Monorepo Structure:
```
novelcraft/
  frontend/                 # React app
  backend/                  # Go API
    cmd/api/                # main
    internal/               # packages (auth, projects, chapters, wiki, ai)
    migrations/             # SQL migrations
  docs/                     # planning, api spec, schema
  infra/                    # docker-compose, local scripts
  .github/workflows/        # CI
  README.md
  .gitignore
```

#### GitHub Labels:
**Type:** epic, story, task, bug
**Area:** frontend, backend, db, ai, infra, docs
**Priority:** p0, p1, p2
**Status:** blocked, ready, in-progress

#### Milestones:
- M0 – Foundations (repo, CI, local dev, DB)
- M1 – Writing MVP (projects/chapters/editor/autosave/export basic)
- M2 – Wiki MVP (wiki pages, types, tags, links/backlinks)
- M3 – AI Ask (RAG) (embeddings, retrieval, ask-with-citations)
- M4 – AI Writing Tools (rewrite/expand + diff + lore bible guardrails)
- M5 – Consistency Suite (contradictions, open threads, timeline optional)

#### GitHub Repo Description:
"A personal writing platform for novels, combining chapter-based editing, a lore wiki, and continuity-safe AI assistance."

---

### 13. IDE Setup & Development Environment
**Location:** Lines 3160-3531

#### JetBrains IDE Recommendation:
With All Products Pack:
- **GoLand** for backend (Echo + Postgres + migrations)
- **WebStorm** for frontend (React + Vite + TS)
- Or: Use GoLand as main IDE (handles React/TS adequately)

#### WSL Setup (Windows):
**For GoLand/WebStorm Terminal:**
1. Settings → Tools → Terminal → Shell path: `wsl.exe` or `wsl.exe -d Ubuntu`
2. Settings → Build, Execution, Deployment → WSL: ensure distro configured
3. Settings → Go → GOROOT: add WSL SDK (Type: WSL, Path: /usr/lib/go)

**Best Practice:**
- Clone repo in WSL: `~/code/NovelCraft`
- Open in IDE via: `\\wsl$\Ubuntu\home\youruser\code\NovelCraft`
- Avoids file watcher bugs, slow I/O, Docker volume issues

**JetBrains AI Assistant / Junie + WSL:**
- Known issues with terminal execution in WSL (hangs, wrong shell)
- Workaround: Use Junie for code edits, run commands manually in terminal
- Or: Keep terminal as PowerShell if Junie hangs with WSL

---

### 14. Story-Specific Context
**Location:** Lines 204-395

#### Story Characteristics:
- Long-form, lore-heavy, character-driven
- Mystery, memory loss, layered reality
- Slow reveals
- Hidden truths, unreliable memory
- Gradual reveals, lore must not contradict
- Meta-fiction & layered reality
- Liminal experiences, existential undertones
- "The reader knows something is wrong, but not what"

#### Why GPT-5.x Works Best:
- Strong at tracking internal logic
- Maintains thematic continuity
- Remembers rules within session/context
- Excellent at liminal experiences
- Good co-author behavior (expands, sharpens, explores alternatives)

---

## Documents Created/Referenced

The conversation mentions several downloadable documents were created:

1. **NovelCraft_README.md** - Master build plan with step-by-step instructions
2. **NovelCraft_AI_EXECUTION_GUIDE.md** - AI behavior rules and lore constraints
3. **NovelCraft_CLAUDE_SYSTEM_PROMPT.md** - JetBrains-specific system prompt
4. **NovelCraft_BUILD_CHECKLIST.md** - Progress tracking checklist

---

## Implementation Order (Critical Path)

1. Docker DB + migrations + DB connection
2. Auth (sessions + middleware)
3. Projects API + UI
4. Chapters API + editor UI + autosave
5. Wiki API + wiki UI + tags + backlinks
6. Search endpoint + UI
7. CI
8. AI foundations (only after app is usable)

---

## Key Design Patterns & Principles

### RAG Pattern for AI Integration:
1. Chunk novel/wiki text
2. Create embeddings
3. Store in vector DB (pgvector)
4. On AI request: retrieve relevant chunks only
5. Send chunks + prompt to model
6. Return answer with citations

### "Canon-Safe Mode":
- Toggle that restricts AI to only use retrieved sources
- Prevents hallucination/invention
- Critical for maintaining story consistency

### Cost Optimization:
- Don't send entire manuscript to AI
- Use cached context for lore bible
- Track token usage and costs
- Use cheaper models for simple tasks, expensive for complex

### Security/Privacy:
- Cookie-based sessions with HttpOnly
- DB-backed sessions (can invalidate)
- API data not used for training
- Keep manuscript private (never send whole thing)

---

## Recommended Content Organization

Based on this analysis, the content should be organized into these reference files:

### 1. **Architecture & Technical Stack** (TECH_STACK.md)
- Stack choices (React, Go, Postgres, pgvector)
- Why each technology was chosen
- Echo framework details
- RAG architecture explanation

### 2. **Database Schema** (DATABASE_SCHEMA.md)
- All table definitions with migrations
- Relationships and indexes
- pgvector setup
- Migration strategy

### 3. **API Specifications** (API_SPEC.md)
- All endpoint definitions
- Request/response formats
- Authentication flow
- Error handling

### 4. **Development Plan** (DEV_PLAN.md)
- Phased implementation approach
- Milestones (M0-M5)
- Implementation order
- Definition of done for MVP

### 5. **Lore Bible & AI Rules** (LORE_BIBLE.md)
- Canon authority principles
- Layered reality requirements
- Writing rules
- Forbidden actions
- Suggestion format

### 6. **Feature Specifications** (FEATURES.md)
- Core writing features
- Wiki/lore database features
- AI functionality (all 5 categories)
- Search and export

### 7. **Infrastructure & DevOps** (INFRASTRUCTURE.md)
- Docker setup
- CI/CD configuration
- Deployment strategy
- IDE setup (GoLand/WebStorm + WSL)

### 8. **AI Integration Guide** (AI_INTEGRATION.md)
- RAG implementation details
- Embeddings strategy
- Cost controls
- Model selection rationale
- Canon-safe mode implementation

### 9. **GitHub Project Setup** (GITHUB_SETUP.md)
- Repository structure
- Labels and milestones
- Issue templates
- PR workflow

### 10. **Quick Start Guide** (QUICKSTART.md)
- How to run locally
- Docker compose commands
- Migration commands
- Development workflow

---

## Critical Success Factors

1. **Start with Writing MVP, not AI** - Build a usable writing tool before adding AI
2. **Use RAG, not full manuscript prompts** - Cost and consistency
3. **Maintain single canon model** - Avoid tonal drift
4. **Implement canon-safe mode** - Prevent AI from breaking story logic
5. **Track all changes with revisions** - Never lose work
6. **Citation-based answers** - Always know where information comes from
7. **Phase implementation strictly** - Don't jump ahead to AI before basics work

---

## End Notes

This conversation represents a complete, production-ready plan for building NovelCraft. All major technical decisions have been made, the architecture is sound, and the implementation path is clear. The focus on story consistency, privacy, and cost-effective AI integration makes this particularly well-suited for serious novel writing work.

The emphasis on RAG architecture and "canon-safe" AI assistance is the key innovation that differentiates this from generic writing tools - it's designed specifically for complex, long-form fiction with strict internal continuity requirements.
