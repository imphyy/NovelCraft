# NovelCraft – Full Build Instructions (Claude IDE Guide)

> **Purpose**: This document is a step‑by‑step implementation guide for building the NovelCraft monorepo.
> It is designed to be pasted directly into Claude (or another AI) inside your IDE and followed sequentially.

---

## 🔧 REQUIRED VALUES TO FILL IN (DO THIS FIRST)

Replace all placeholders before building:

- `<GITHUB_USERNAME>` → `imphyy`
- `<REPO_NAME>` → `NovelCraft`
- `<MODULE_PATH>` → `github.com/imphyy/NovelCraft/backend`
- `<FRONTEND_PORT>` → `5173`
- `<BACKEND_PORT>` → `8080`
- `<DATABASE_URL>` → `postgres://novelcraft:novelcraft@localhost:5432/novelcraft?sslmode=disable`
- `<SESSION_COOKIE_NAME>` → `novelcraft_session`
- `<PROJECT_NAME>` → `NovelCraft`

Optional (later):
- `<OPENAI_API_KEY>`
- `<AI_EMBEDDING_DIM>` → `1536`

---

## 1️⃣ PROJECT GOAL

Build a **personal writing web application** with:

- Book writing (Projects → Chapters)
- Autosaving editor
- Wiki / lore database (characters, locations, concepts, etc.)
- Internal linking (`[[Wiki Links]]`)
- Search
- Future AI features (RAG, rewrite tools, consistency checks)

Architecture:
- **Monorepo**
- Frontend: React (Vite + TypeScript)
- Backend: Go + Echo
- Database: Postgres + pgvector
- Auth: Cookie‑based sessions

---

## 2️⃣ MONOREPO STRUCTURE (REQUIRED)

Create this exact structure:

```
NovelCraft/
  frontend/
  backend/
    cmd/api/
    internal/
      auth/
      projects/
      chapters/
      wiki/
      httpapi/
      db/
      config/
    migrations/
  infra/
  docs/
  .github/workflows/
  README.md
```

---

## 3️⃣ LOCAL DATABASE (DOCKER)

Create `infra/docker-compose.yml`:

- Image: `pgvector/pgvector:pg16`
- Expose port `5432`
- User/password/db: `novelcraft`
- Named volume
- Healthcheck via `pg_isready`

Acceptance:
- `docker compose up -d` starts DB
- You can connect via `postgres://novelcraft:novelcraft@localhost:5432/novelcraft?sslmode=disable`

---

## 4️⃣ BACKEND – GO + ECHO

### 4.1 Go module
In `backend/`:
```
go mod init github.com/imphyy/NovelCraft/backend
```

### 4.2 Echo server
Create:
- `cmd/api/main.go`
- `internal/httpapi/server.go`
- `internal/httpapi/routes.go`
- `internal/httpapi/middleware.go`

Requirements:
- Base route `/api`
- `/api/health` → `ok`
- Middleware:
  - Recover
  - RequestID
  - Gzip
  - Secure
  - BodyLimit
- Dev CORS allow `http://localhost:5173` with credentials

---

## 5️⃣ DATABASE CONNECTION

Create `internal/db/db.go`:

- Use `pgxpool`
- Read `DATABASE_URL`
- Ping DB on startup
- Expose pool to services

---

## 6️⃣ DATABASE MIGRATIONS

Use `golang-migrate`.

### 6.1 Extensions
Enable:
- `uuid-ossp`
- `pgcrypto`
- `vector`

### 6.2 Core tables
Create tables:

- users
- projects
- chapters
- chapter_revisions
- wiki_pages
- wiki_tags
- wiki_page_tags
- wiki_links
- wiki_mentions

All tables must enforce ownership via `user_id` or `project_id`.

### 6.3 Sessions
Create `sessions` table:
- token (unique)
- expires_at
- linked to user

---

## 7️⃣ AUTHENTICATION (COOKIE SESSIONS)

Cookie:
- Name: `novelcraft_session`
- HttpOnly
- SameSite=Lax
- Secure in prod

Endpoints:
- POST `/auth/register`
- POST `/auth/login`
- POST `/auth/logout`
- GET `/auth/me`

Rules:
- Hash passwords (bcrypt or argon2)
- Store sessions in DB
- Middleware `RequireAuth` validates session and injects `user_id` into context

---

## 8️⃣ PROJECTS API

Protected routes:

- GET `/projects`
- POST `/projects`
- GET `/projects/:projectId`
- PATCH `/projects/:projectId`
- DELETE `/projects/:projectId`

Enforce ownership checks everywhere.

---

## 9️⃣ CHAPTERS API

Protected routes:

- GET `/projects/:projectId/chapters`
- POST `/projects/:projectId/chapters`
- GET `/chapters/:chapterId`
- PATCH `/chapters/:chapterId`
- POST `/projects/:projectId/chapters/reorder`

Rules:
- sort_order maintained per project
- word count calculated server‑side
- autosave friendly updates

Optional:
- chapter revision snapshots

---

## 🔟 WIKI API

Protected routes:

- GET `/projects/:projectId/wiki`
- POST `/projects/:projectId/wiki`
- GET `/wiki/:pageId`
- PATCH `/wiki/:pageId`
- DELETE `/wiki/:pageId`
- PUT `/wiki/:pageId/tags`
- POST `/wiki/:pageId/rebuild-links`
- PUT `/wiki/:pageId/mentions`

Rules:
- `[[Title]]` parsing rebuilds `wiki_links`
- backlinks derived from `wiki_links`
- wiki types: character, location, faction, item, event, concept, misc

---

## 1️⃣1️⃣ SEARCH API

- GET `/projects/:projectId/search?q=...`

Return grouped:
- chapters
- wiki pages

Use `ILIKE` first (FTS optional later).

---

## 1️⃣2️⃣ FRONTEND – REACT

Use Vite + React + TypeScript.

Pages:
- `/login`
- `/projects`
- `/projects/:projectId`
- `/wiki`
- `/wiki/:pageId`

API client:
- `fetch` with `credentials: "include"`
- Handle 401 → redirect to login

---

## 1️⃣3️⃣ WRITING UI

- Project dashboard
- Chapter sidebar
- Editor (textarea first)
- Autosave with debounce
- Saving indicator
- Reorder chapters

---

## 1️⃣4️⃣ WIKI UI

- Wiki list with filters
- Wiki editor
- Tag editor
- Backlinks + mentions panels
- Button: “Rebuild Links”

---

## 1️⃣5️⃣ CI

Create `.github/workflows/ci.yml`:

- Frontend: install + build
- Backend: go test + go build

---

## 1️⃣6️⃣ AI (LATER PHASES – PLACEHOLDERS ONLY)

- RAG tables: documents, chunks, ai_requests
- Chunking + embeddings on save
- `/api/ai/ask`
- `/api/ai/rewrite`
- Lore Bible guardrails
- Canon‑safe mode toggle

⚠️ Never send full manuscript to AI.
Always retrieve relevant chunks only.

---

## 1️⃣7️⃣ BUILD ORDER (STRICT)

1. Docker + migrations
2. DB connection
3. Auth
4. Projects
5. Chapters + editor
6. Wiki
7. Search
8. CI
9. AI foundations

---

## ✅ MVP COMPLETE WHEN

- Auth works
- Chapters autosave
- Wiki functions as lore bible
- Search works
- CI passes

---

## FINAL NOTE TO AI IMPLEMENTER

Keep the code:
- Simple
- Explicit
- Small functions
- Clear ownership checks
- No premature abstractions

Build **usability first**, AI second.
