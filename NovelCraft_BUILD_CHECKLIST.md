# NovelCraft – Build Progress Checklist

Use this checklist to track progress through the NovelCraft build.
Only check an item when it is fully complete and verified.

---

## 🧱 Foundations (M0)

- [ ] Monorepo created with correct folder structure
- [ ] Root README.md added
- [ ] .gitignore configured
- [ ] Docker Compose for Postgres + pgvector works
- [ ] Database reachable via DATABASE_URL
- [ ] Go module initialised
- [ ] Echo server boots
- [ ] /api/health returns ok
- [ ] CI workflow builds frontend and backend

---

## 🔐 Authentication (M1)

- [ ] users table migrated
- [ ] sessions table migrated
- [ ] Password hashing implemented
- [ ] Session cookie configured correctly
- [ ] POST /auth/register works
- [ ] POST /auth/login works
- [ ] GET /auth/me works
- [ ] POST /auth/logout invalidates session
- [ ] RequireAuth middleware blocks unauthenticated access

---

## 📚 Projects (M1)

- [ ] projects table migrated
- [ ] GET /projects lists only owned projects
- [ ] POST /projects creates project
- [ ] GET /projects/:id enforces ownership
- [ ] PATCH /projects/:id updates fields
- [ ] DELETE /projects/:id removes project

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
