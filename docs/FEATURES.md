# NovelCraft Features Specification

## Overview

NovelCraft is a personal writing web application designed for novelists. Features are organized into **phases**, from core writing tools to advanced AI assistance.

---

## Phase 1: Core Writing Features (MVP)

### Project Management

**Purpose:** Organize multiple writing projects (books).

**Features:**
- Create new project with name + description
- List all projects
- Open project → view chapters
- Edit project metadata
- Delete project (with confirmation)

**UI:**
- Dashboard: Grid/list of project cards
- Each card shows: title, description snippet, word count, last edited date
- "New Project" button

---

### Chapter Editor

**Purpose:** Write and organize chapters within a project.

**Features:**
- **Chapter list sidebar:**
  - Ordered list of chapters (drag-to-reorder)
  - Click to load chapter in editor
  - Show: title, status (draft/revising/final), word count
  - "New Chapter" button

- **Editor:**
  - Rich text editor (TipTap) or Markdown (Milkdown)
  - Formatting: headings, italics, bold, quotes, lists
  - Autosave (debounced, every 2-3 seconds of inactivity)
  - Manual save button
  - Saving indicator ("Saving..." / "Saved at HH:MM")
  - Word count display (live update)
  - Focus mode (optional: hide sidebar, zen mode)

- **Chapter metadata:**
  - Title (editable inline)
  - Status dropdown (draft / revising / final)
  - Created/updated timestamps

**Autosave Behavior:**
- Debounce: Wait 2-3 seconds after last keystroke
- Send PATCH request to `/api/chapters/:id`
- Show "Saving..." indicator
- On success: Show "Saved at HH:MM"
- On error: Show "Error saving" + retry button

---

### Chapter Reordering

**Purpose:** Rearrange chapter order.

**Features:**
- Drag-and-drop in chapter sidebar
- POST to `/api/projects/:id/chapters/reorder` with new order
- Update `sort_order` transactionally

---

### Word Count

**Purpose:** Track writing progress.

**Features:**
- Per-chapter word count (calculated on backend)
- Total project word count (sum of all chapters)
- Display in: chapter sidebar, project dashboard, editor header

---

### Export

**Purpose:** Export manuscript for external use.

**Features (Phase 1):**
- **Markdown export:**
  - Compile all chapters into single `.md` file
  - Include chapter titles as headings
  - Respect chapter order
  - Download as file

**Features (Phase 2+):**
- **DOCX export:** Use library like `docx` (Node) or `github.com/nguyenthenguyen/docx` (Go)
- **PDF export:** Use library like `pdfkit` or `wkhtmltopdf`
- **Custom compile:** Include/exclude chapters, add front matter

---

### Search (Basic)

**Purpose:** Find content across project.

**Features:**
- Search bar on project dashboard or global nav
- Query endpoint: `GET /api/projects/:id/search?q=query`
- Return results:
  - Chapters: title + snippet
  - Wiki: title + snippet (Phase 2)
- Limit: 10-20 results per category
- Implementation: `ILIKE` in Postgres (FTS optional later)

---

## Phase 2: Wiki / Lore Database

### Wiki Pages

**Purpose:** Store character bios, locations, factions, lore, concepts.

**Features:**
- **Wiki page types:**
  - Character
  - Location
  - Faction
  - Item
  - Event
  - Concept
  - Misc

- **Page structure:**
  - Title (unique within project + type)
  - Type (dropdown)
  - Summary (short blurb, ~1-2 sentences)
  - Content (full wiki entry, rich text or Markdown)
  - Tags (multi-select)

- **CRUD:**
  - Create new wiki page
  - Edit page (title, summary, content, type)
  - Delete page (with confirmation)
  - List all pages (with filters: type, tag, search)

**UI:**
- Wiki list page: Grid/list of wiki cards
- Filters: Type dropdown, tag chips, search bar
- Click card → open wiki editor
- "New Wiki Page" button

---

### Tags

**Purpose:** Categorize wiki pages beyond type.

**Features:**
- Add tags to wiki pages (multi-select or autocomplete)
- Create new tags inline
- Filter wiki list by tag
- Show tag on wiki cards

**Examples:**
- Character tags: "protagonist", "antagonist", "mysterious", "dead", "alive"
- Location tags: "ruins", "city", "hidden", "safe"

---

### Wiki Links (`[[WikiLink]]`)

**Purpose:** Link wiki pages together.

**Features:**
- Syntax: `[[Page Title]]` in wiki content
- On save or explicit "Rebuild Links" button:
  - Parse content for `[[...]]`
  - Match against existing wiki page titles
  - Create rows in `wiki_links` table
  - Show "linked pages" section on wiki page

- **Backlinks:**
  - Show "Referenced by" section on wiki page
  - List all pages that link to this page

**UI:**
- Render `[[Page Title]]` as clickable link in wiki view
- Clicking opens linked page
- "Rebuild Links" button in wiki editor
- Backlinks panel below main content

---

### Wiki Mentions (Appears In)

**Purpose:** Link wiki pages to chapters where they appear.

**Features:**
- Manually link wiki page to chapters
- Or: Auto-detect `[[WikiLink]]` in chapter text
- Show "Appears in" panel on wiki page
- List: Chapter title, optional note ("First appearance", "Major scene")

**UI:**
- "Appears in" section on wiki page
- Click chapter → jump to chapter editor
- Add mention: Dropdown of chapters + note field

---

### Timeline (Optional Phase 2+)

**Purpose:** Track event chronology.

**Features:**
- Create timeline events with:
  - Title
  - Date/order
  - Description
  - Linked wiki pages (characters, locations involved)
  - Linked chapters
- View timeline as ordered list or visual timeline
- Filter by wiki page (show events involving character X)

---

## Phase 3: AI "Ask My Novel/Wiki" (RAG)

### Chunking & Embeddings

**Purpose:** Prepare text for AI retrieval.

**Process:**
1. When chapter/wiki saved, trigger chunking job
2. Split text into ~500-1,200 token chunks
3. Generate embeddings via OpenAI API (`text-embedding-3-small`)
4. Store in `chunks` table with `embedding` vector

**Background Job:**
- Run asynchronously (queue or goroutine)
- Update `documents` table with `updated_at`
- Delete old chunks, insert new chunks

---

### RAG Retrieval

**Purpose:** Find relevant text for AI queries.

**Process:**
1. User asks question
2. Generate embedding for question
3. Query `chunks` table for top K similar vectors (cosine similarity)
4. Return chunks with metadata (chapter/wiki title, snippet)

**Endpoint:**
- Internal: Not exposed to frontend directly
- Used by AI endpoints

---

### AI Ask Question

**Purpose:** Answer questions about the novel/wiki with citations.

**Features:**
- Input: Question text
- Process:
  1. Retrieve top 5-10 relevant chunks
  2. Construct prompt: chunks + question + lore bible rules
  3. Send to OpenAI API (GPT-4o or GPT-5)
  4. Parse response
  5. Return answer + citations

- Output:
  - Answer text
  - Citations: List of sources (chapter/wiki + snippet)

**UI:**
- Question input box (text area)
- "Ask" button
- Response panel: Answer + expandable citations
- Click citation → jump to source

**Cost Control:**
- Limit chunk count (max 10)
- Cache lore bible system prompt
- Track token usage in `ai_requests` table

---

### Usage Dashboard

**Purpose:** Monitor AI costs.

**Features:**
- Show: requests today, tokens used, estimated cost
- Chart: Usage over time
- Per-tool breakdown (ask, rewrite, expand, etc.)

**UI:**
- Dashboard widget on project page or settings
- Show total spend, requests per day

---

## Phase 4: AI Writing Tools

### Text Selection Actions

**Purpose:** AI-powered editing on selected text.

**Tools:**
1. **Rewrite:** Adjust tone/voice/style
2. **Expand:** Add detail, sensory description, internal monologue
3. **Tighten:** Remove redundancy, sharpen prose
4. **Dialogue Variants:** Suggest alternative dialogue options
5. **Show vs Tell:** Convert exposition to scene
6. **Summarize:** Generate internal or reader-facing summary

**UI:**
- Select text in editor
- Context menu or floating toolbar
- Click tool → modal/panel shows:
  - Original text
  - AI-generated version(s)
  - Accept / Reject buttons
  - Optional: Edit before accepting

**Backend:**
- POST to `/api/chapters/:id/ai/{tool}`
- Include: selected text, instruction (optional)
- Return: original + rewritten text

---

### Canon-Safe Mode Toggle

**Purpose:** Restrict AI to only use retrieved text.

**Features:**
- Toggle in project settings or per-request
- When ON: AI cannot invent facts, only use chunks
- When OFF: AI can suggest creative extensions

**UI:**
- Checkbox in AI request modal
- Project-level default setting

---

### Diff View

**Purpose:** Review AI changes before accepting.

**Features:**
- Show original vs rewritten side-by-side
- Or: Inline diff (track changes style)
- Accept → replace text in editor
- Reject → discard AI output

**UI:**
- Modal with two panels: Original | Rewritten
- Highlight differences
- Accept / Reject / Edit buttons

---

### Lore Bible Loaded

**Purpose:** Inject lore bible rules into AI system prompt.

**Implementation:**
- System prompt includes:
  - Canon authority rules
  - Layered reality instructions
  - Writing style rules
  - Forbidden actions
- Lore bible acts as "constitution" for AI behavior

---

## Phase 5: Consistency & Advanced Features

### Continuity Check

**Purpose:** Detect contradictions in novel/wiki.

**Features:**
- Scan all chapters + wiki for:
  - Direct contradictions (eye color, age, timeline)
  - Inconsistent facts (location descriptions, event order)
  - Character voice shifts (optional)

- Output:
  - List of potential issues
  - Sources for each side of contradiction
  - Confidence score (high/medium/low)

**UI:**
- "Run Consistency Check" button on project dashboard
- Results panel: List of issues
- Click issue → view sources side-by-side
- Mark as "intentional" or "fix needed"

---

### Open Threads Tracker

**Purpose:** Track unresolved setups.

**Features:**
- AI identifies:
  - Questions raised but not answered
  - Mysteries introduced
  - Chekhov's guns (items/characters mentioned but not used)

- Output:
  - List of open threads
  - Chapter where introduced
  - Suggested chapters to resolve (optional)

**UI:**
- "Open Threads" panel on project dashboard
- Mark thread as "resolved" or "intentional"

---

### Foreshadowing Suggestions

**Purpose:** Plant subtle hints for future reveals.

**Features:**
- AI suggests where/how to seed foreshadowing
- Based on: current chapters + planned reveals (user-provided)
- Suggestions should be subtle, not obvious

**UI:**
- "Suggest Foreshadowing" button
- Input: What to foreshadow (e.g., "character betrayal")
- Output: Suggestions with chapter + location

---

### Character Voice Checker (Optional)

**Purpose:** Detect voice inconsistencies.

**Features:**
- Train on existing character dialogue
- Flag outlier dialogue (doesn't match voice)
- Suggest corrections

**Implementation:**
- Requires significant dialogue corpus
- May use fine-tuning or prompt engineering

---

### Revision History

**Purpose:** Track chapter snapshots over time.

**Features (expanded from Phase 1):**
- Auto-snapshot every N edits (configurable)
- Manual "Save Revision" button
- Label revisions (e.g., "Draft 1 complete")
- Compare revisions (diff view)
- Restore previous revision

**UI:**
- "Revisions" panel in chapter editor
- List of revisions with timestamps + notes
- Click → view snapshot
- Restore button (with confirmation)

---

### Advanced Export

**Purpose:** Compile manuscript with customization.

**Features:**
- Include/exclude chapters
- Add front matter (title page, copyright, dedication)
- Custom formatting (fonts, spacing)
- Export to: DOCX, PDF, EPUB (optional)

**UI:**
- "Export" modal with options
- Preview before download

---

### Backups

**Purpose:** Prevent data loss.

**Features:**
- Auto-backup to S3 or similar
- Or: "Download Project" button → export all data as JSON
- Manual restore from backup

---

## Non-MVP Features (Future)

### Collaboration (Not Planned for MVP)
- Multi-user projects
- Real-time collaborative editing
- Comments / suggestions on text

### Mobile App (Not Planned for MVP)
- Native iOS/Android app
- Sync with web version
- Offline editing

### Outlining Tools (Not Planned for MVP)
- Visual outliner (cards, corkboard)
- Story structure templates (Hero's Journey, etc.)
- Beat sheets

### Plotting Tools (Not Planned for MVP)
- Character arc tracker
- Plot point timeline
- Scene-level planning

### Community Features (Not Planned for MVP)
- Share projects publicly
- Beta reader feedback
- Writing prompts

---

## MVP Definition

**Phase 1 + Phase 2 = MVP**

Deliverable:
- You can write a book comfortably
- Chapters autosave reliably
- Wiki functions as lore bible
- Search works
- No data leaks between users/projects
- CI is green

**Do not add AI until Phase 1 + 2 are solid.**

---

## End Notes

Features prioritize:
- **Usability first** (writing experience over AI bells and whistles)
- **Finishability** (help writers finish novels, not experiment with tools)
- **Canon integrity** (AI never breaks story continuity)
- **Cost efficiency** (RAG pattern, token limits, usage tracking)

**Build the writing tool first. Add AI second.**
