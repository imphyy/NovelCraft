# NovelCraft – Build Progress Checklist

Use this checklist to track progress through the NovelCraft build.
Only check an item when it is fully complete and verified.

---

## 🧱 Foundations (M0)

- [x] Monorepo created with correct folder structure
- [x] Root README.md added
- [x] .gitignore configured
- [x] Docker Compose for Postgres + pgvector works
- [x] Database reachable via DATABASE_URL
- [x] Go module initialised
- [x] Echo server boots
- [x] /api/health returns ok
- [x] CI workflow builds frontend and backend

---

## 🔐 Authentication (M1)

- [x] users table migrated
- [x] sessions table migrated
- [x] Password hashing implemented
- [x] Session cookie configured correctly
- [x] POST /auth/register works
- [x] POST /auth/login works
- [x] GET /auth/me works
- [x] POST /auth/logout invalidates session
- [x] RequireAuth middleware blocks unauthenticated access

---

## 📚 Projects (M1)

- [x] projects table migrated
- [x] GET /projects lists only owned projects
- [x] POST /projects creates project
- [x] GET /projects/:id enforces ownership
- [x] PATCH /projects/:id updates fields
- [x] DELETE /projects/:id removes project

---

## ✍️ Chapters (M1)

- [x] chapters table migrated
- [x] GET chapters by project (ordered)
- [x] POST chapter appends correctly
- [x] GET chapter returns full content
- [x] PATCH chapter updates content
- [x] Chapter reorder endpoint works transactionally
- [x] Word count calculated server-side
- [ ] Autosave stable under rapid edits

Optional:
- [x] chapter_revisions table migrated
- [x] Revision snapshot creation works
- [x] Revision restore works

---

## 🧠 Wiki (M2)

- [x] wiki_pages table migrated
- [x] wiki_tags and junction tables migrated
- [x] Wiki CRUD endpoints implemented
- [x] Wiki types enforced
- [x] Tags can be added/removed
- [x] [[Wiki Links]] parsed correctly
- [x] Backlinks generated correctly
- [x] Mentions link wiki pages to chapters

---

## 🔍 Search (M2)

- [x] Search endpoint implemented
- [x] Chapters returned with snippets
- [x] Wiki pages returned with snippets
- [x] Results scoped to project only

---

## 🖥 Frontend – Core (M1)

- [x] Login page works
- [x] Auth redirect logic works
- [x] Project list page works
- [x] Project creation UI works
- [x] Chapter sidebar renders correctly
- [x] Editor saves content reliably
- [x] Loading/saving states visible

---

## 🧭 Frontend – Wiki (M2)

- [x] Wiki list page works
- [x] Wiki editor page works
- [x] Tag editor UI works
- [x] Backlinks panel visible
- [x] Mentions panel visible
- [x] Rebuild links button works

---

## 🤖 AI Foundations (M3 – Later)

- [ ] documents table migrated
- [ ] chunks table migrated
- [ ] pgvector index created
- [ ] Chunking on save implemented
- [ ] Embeddings stored correctly
- [ ] Retrieval returns relevant chunks

---

## 🧪 AI Features (M4 – Later)

- [ ] /api/ai/ask implemented
- [ ] Answers include citations
- [ ] Canon-safe mode enforced
- [ ] /api/ai/rewrite implemented
- [ ] Diff accept/reject UI works

---

## ✅ MVP COMPLETE WHEN

- [ ] You can write chapters comfortably
- [ ] Wiki functions as lore bible
- [ ] Search works
- [ ] No data leaks between projects
- [ ] CI is green
- [ ] You trust the tool for daily writing

---

## 🧠 FINAL RULE

If a box is checked prematurely, **uncheck it**.
Stability and correctness matter more than speed.
