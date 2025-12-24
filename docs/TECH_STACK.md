# NovelCraft Technical Stack

## Overview

NovelCraft uses a modern, straightforward tech stack optimized for a single developer building a personal writing application with AI integration.

---

## Stack Summary

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Frontend** | React + TypeScript (Vite) | Fast dev experience, strong typing, wide ecosystem |
| **Backend** | Go + Echo | Simple, fast, excellent concurrency for background tasks |
| **Database** | PostgreSQL + pgvector | Robust relational DB with vector search for AI embeddings |
| **Deployment** | Railway (or similar) | Simple deployment with managed Postgres |
| **Repository** | Monorepo | Keep frontend + backend in sync, simpler for solo dev |

---

## Frontend: React + TypeScript + Vite

### Why React?
- Mature, well-documented, large ecosystem
- Component reusability for complex editor UI
- Good TypeScript support
- You're already familiar with it

### Why Vite?
- Extremely fast hot reload
- Simple configuration
- Native ESM support
- Better than CRA for modern projects

### Editor Libraries
**Option 1: TipTap** (Recommended)
- Rich text editor built on ProseMirror
- Extensible, modern API
- Good TypeScript support
- Supports collaborative editing if needed later

**Option 2: Milkdown**
- Markdown-based
- Plugin system
- Lighter weight

**Decision:** Start with **TipTap** for rich text, can switch to Milkdown later if Markdown preferred.

---

## Backend: Go + Echo

### Why Go?
- **Simple deployment:** Single binary, no runtime needed
- **Performance:** Fast enough for AI integration, DB queries, chunking
- **Concurrency:** Goroutines excellent for background jobs (embeddings, chunking)
- **Type safety:** Compile-time checks prevent common bugs
- **Mature ecosystem:** pgx, Echo, golang-migrate all battle-tested

### Why Echo?
- **Lightweight:** Not over-engineered like some frameworks
- **Middleware:** Clean middleware pattern for auth, logging, CORS
- **Group routing:** Easy to organize `/api/auth`, `/api/projects`, etc.
- **Validation:** Built-in request binding + validation
- **Community:** Active, well-documented

### Alternatives Considered:
- **Gin:** Similar to Echo, slightly more popular but no major advantages
- **Chi:** More minimal, but Echo's features justify the slightly higher abstraction
- **stdlib net/http:** Too low-level for this project

---

## Database: PostgreSQL + pgvector

### Why PostgreSQL?
- **Maturity:** Rock-solid, widely deployed
- **Feature-rich:** JSONB, full-text search, extensions
- **Vector support:** pgvector extension for embeddings
- **Heroku/Railway support:** Easy to deploy

### Why pgvector?
- **Native vector storage:** Store embeddings directly in Postgres
- **Similarity search:** Fast cosine/L2 distance queries
- **No separate vector DB:** Avoids adding Pinecone/Weaviate/Qdrant
- **Relational + vector in one place:** Joins between chapters/wiki and embeddings

### Schema Design Principles:
- **Ownership enforcement:** Every resource tied to `user_id` or `project_id`
- **Cascading deletes:** Remove all related data when project deleted
- **Timestamps:** Track `created_at` and `updated_at` everywhere
- **UUIDs:** Avoid sequential ID leaks

---

## Authentication: Cookie-Based Sessions

### Why Cookies (Not JWT)?
- **Simpler for web app:** No need to store tokens in localStorage
- **HttpOnly:** Prevents XSS attacks
- **DB-backed sessions:** Can invalidate/rotate tokens server-side
- **SameSite=Lax:** CSRF protection

### Session Flow:
1. User logs in → server creates session row in DB
2. Server sets HttpOnly cookie with session token
3. Browser sends cookie with every request
4. Middleware validates token, loads user_id into context
5. Handlers access user_id for ownership checks

---

## AI Integration: RAG Architecture

### RAG = Retrieval-Augmented Generation

**Problem:** Sending entire manuscript to AI every time is:
- Expensive (GPT-5 $10/1M output tokens)
- Inefficient (most content irrelevant to query)
- Risks exceeding context limits

**Solution:** RAG
1. **Chunk** novel/wiki text into ~500-1,200 token pieces
2. **Embed** each chunk using OpenAI embeddings API (~$0.10/1M tokens)
3. **Store** embeddings in pgvector
4. **Retrieve** top K relevant chunks on AI request (cosine similarity)
5. **Send** only relevant chunks + prompt to GPT
6. **Cite** sources in response

### Why This Works:
- **Cost:** Only pay for relevant context
- **Consistency:** Only send chunks that matter
- **Citations:** Know exactly where AI got information
- **Privacy:** Never send full manuscript to API

### Models:
- **Primary:** GPT-5.x (or GPT-4o) for canon consistency
- **Secondary:** Claude for emotional polish (optional)
- **Embeddings:** `text-embedding-3-small` (1536 dimensions, cheap)

---

## Infrastructure

### Local Development:
- **Docker Compose:** Run Postgres + pgvector locally
- **Air (optional):** Live reload for Go backend
- **Vite dev server:** Frontend hot reload

### CI/CD:
- **GitHub Actions:**
  - Frontend: `npm install` + `npm run build`
  - Backend: `go test` + `go build`

### Deployment (Railway or similar):
- **Frontend:** Deploy as static site or SPA
- **Backend:** Deploy Go binary with managed Postgres
- **Migrations:** Run on deploy via `golang-migrate`

---

## Migration Strategy

### Tool: golang-migrate

**Migrations stored in:** `backend/migrations/`

**Format:**
```
000001_init.up.sql
000001_init.down.sql
000002_add_wiki.up.sql
000002_add_wiki.down.sql
```

**Run locally:**
```bash
migrate -path backend/migrations -database "postgres://..." up
```

**Run in CI/deploy:**
```bash
migrate -path backend/migrations -database "$DATABASE_URL" up
```

---

## Repository Structure

```
NovelCraft/
  frontend/                 # Vite + React + TS
    src/
      components/
      pages/
      api/
      types/
  backend/                  # Go + Echo
    cmd/api/                # main.go
    internal/               # packages
      auth/
      projects/
      chapters/
      wiki/
      httpapi/              # server, routes, middleware
      db/                   # pgxpool connection
      config/               # env config
    migrations/             # SQL migrations
  infra/
    docker-compose.yml      # Local Postgres
  docs/                     # Planning, specs, guides
  .github/workflows/        # CI
  README.md
  .gitignore
```

---

## Cost Analysis

### OpenAI API (Pay-as-you-go)

| Model | Input | Output | Use Case |
|-------|-------|--------|----------|
| GPT-5 (or GPT-4o) | ~$1.25/1M tokens | ~$10/1M tokens | Canon consistency, Q&A, rewriting |
| text-embedding-3-small | ~$0.10/1M tokens | — | Embeddings for RAG |

**Example costs:**
- Embed 100K word novel (~130K tokens): **$0.013**
- Ask 10 questions (1K context + 500 output each): **~$0.06**
- Rewrite 500 words (1K in, 700 out): **$0.008**

**Monthly estimate for active use:** $5-20/month

### Railway (or similar PaaS)
- Free tier: Limited
- Starter plan: ~$5-10/month for Postgres + small backend
- Scales as needed

---

## Development Workflow

### Backend:
1. Write Go code
2. Run tests: `go test ./...`
3. Run locally: `go run cmd/api/main.go`
4. Apply migrations: `migrate up`

### Frontend:
1. Write React components
2. Run dev server: `npm run dev`
3. Build: `npm run build`

### Database:
1. Create migration: `migrate create -ext sql -dir backend/migrations -seq <name>`
2. Apply: `migrate up`
3. Rollback: `migrate down 1`

---

## Key Design Principles

1. **Keep it simple:** No microservices, no Kubernetes, no premature abstractions
2. **Explicit over clever:** Clear functions, obvious ownership checks
3. **Fail fast:** Validate early, return errors immediately
4. **RAG first:** Never send full manuscript to AI
5. **Privacy by default:** API data not used for training, session-based auth
6. **Ownership everywhere:** Every resource tied to user/project

---

## Future Considerations (Not MVP)

- **WebSockets:** For real-time autosave feedback
- **Collaborative editing:** Multiple users (not needed for personal tool)
- **Mobile app:** Native iOS/Android (web-first is fine)
- **Offline support:** PWA with local storage
- **Self-hosting:** Docker image for complete self-hosting

---

## End Notes

This stack is chosen for:
- **Speed of development** (one developer can manage everything)
- **Cost efficiency** (minimal infrastructure, pay-per-use AI)
- **Maintainability** (simple, boring tech that won't break)
- **Future-proof** (RAG architecture scales to larger novels/features)

**Build usability first, AI second.**
