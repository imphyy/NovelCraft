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

- [ ] chapters table migrated
- [ ] GET chapters by project (ordered)
- [ ] POST chapter appends correctly
- [ ] GET chapter returns full content
- [ ] PATCH chapter updates content
- [ ] Chapter reorder endpoint works transactionally
- [ ] Word count calculated server-side
- [ ] Autosave stable under rapid edits

Optional:
- [ ] chapter_revisions table migrated
- [ ] Revision snapshot creation works
- [ ] Revision restore works

---

## 🧠 Wiki (M2)

- [ ] wiki_pages table migrated
- [ ] wiki_tags and junction tables migrated
- [ ] Wiki CRUD endpoints implemented
- [ ] Wiki types enforced
- [ ] Tags can be added/removed
- [ ] [[Wiki Links]] parsed correctly
- [ ] Backlinks generated correctly
- [ ] Mentions link wiki pages to chapters

---

## 🔍 Search (M2)

- [ ] Search endpoint implemented
- [ ] Chapters returned with snippets
- [ ] Wiki pages returned with snippets
- [ ] Results scoped to project only

---

## 🖥 Frontend – Core (M1)

- [ ] Login page works
- [ ] Auth redirect logic works
- [ ] Project list page works
- [ ] Project creation UI works
- [ ] Chapter sidebar renders correctly
- [ ] Editor saves content reliably
- [ ] Loading/saving states visible

---

## 🧭 Frontend – Wiki (M2)

- [ ] Wiki list page works
- [ ] Wiki editor page works
- [ ] Tag editor UI works
- [ ] Backlinks panel visible
- [ ] Mentions panel visible
- [ ] Rebuild links button works

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
