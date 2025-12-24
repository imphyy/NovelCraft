# NovelCraft API Specification

## Overview

The NovelCraft API is a RESTful JSON API built with Go + Echo. All endpoints use cookie-based authentication with HttpOnly session cookies.

**Base URL:** `/api`

---

## Authentication

All authenticated endpoints require a valid session cookie. If authentication fails, return `401 Unauthorized`.

### Cookie Details:
- **Name:** `novelcraft_session`
- **HttpOnly:** Yes
- **Secure:** Yes (in production)
- **SameSite:** Lax
- **Expires:** 7 days (configurable)

---

## Auth Endpoints

### POST /api/auth/register

Register a new user.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response (201 Created):**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "createdAt": "2025-01-01T00:00:00Z"
  }
}
```

**Sets Cookie:** `novelcraft_session`

**Errors:**
- `400` - Invalid email or weak password
- `409` - Email already exists

---

### POST /api/auth/login

Log in existing user.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response (200 OK):**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "createdAt": "2025-01-01T00:00:00Z"
  }
}
```

**Sets Cookie:** `novelcraft_session`

**Errors:**
- `400` - Missing email or password
- `401` - Invalid credentials

---

### POST /api/auth/logout

Log out current user.

**Request:** Empty body

**Response (200 OK):**
```json
{
  "ok": true
}
```

**Clears Cookie:** `novelcraft_session`

---

### GET /api/auth/me

Get current authenticated user.

**Response (200 OK):**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "createdAt": "2025-01-01T00:00:00Z"
  }
}
```

**Errors:**
- `401` - Not authenticated

---

## Project Endpoints

### GET /api/projects

List all projects for authenticated user.

**Response (200 OK):**
```json
{
  "projects": [
    {
      "id": "uuid",
      "name": "My Novel",
      "description": "A story about...",
      "createdAt": "2025-01-01T00:00:00Z",
      "updatedAt": "2025-01-15T12:00:00Z"
    }
  ]
}
```

---

### POST /api/projects

Create a new project.

**Request:**
```json
{
  "name": "My Novel",
  "description": "Optional description"
}
```

**Response (201 Created):**
```json
{
  "project": {
    "id": "uuid",
    "name": "My Novel",
    "description": "Optional description",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2025-01-01T00:00:00Z"
  }
}
```

**Errors:**
- `400` - Missing name

---

### GET /api/projects/:projectId

Get a specific project.

**Response (200 OK):**
```json
{
  "project": {
    "id": "uuid",
    "name": "My Novel",
    "description": "Optional description",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2025-01-15T12:00:00Z"
  }
}
```

**Errors:**
- `403` - User does not own this project
- `404` - Project not found

---

### PATCH /api/projects/:projectId

Update a project.

**Request:**
```json
{
  "name": "Updated Title",
  "description": "New description"
}
```

**Response (200 OK):**
```json
{
  "project": {
    "id": "uuid",
    "name": "Updated Title",
    "description": "New description",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2025-01-16T10:00:00Z"
  }
}
```

**Errors:**
- `403` - User does not own this project
- `404` - Project not found

---

### DELETE /api/projects/:projectId

Delete a project (cascades to chapters, wiki, etc.).

**Response (204 No Content)**

**Errors:**
- `403` - User does not own this project
- `404` - Project not found

---

## Chapter Endpoints

### GET /api/projects/:projectId/chapters

List all chapters in a project (ordered by `sort_order`).

**Response (200 OK):**
```json
{
  "chapters": [
    {
      "id": "uuid",
      "projectId": "uuid",
      "sortOrder": 1,
      "title": "Chapter 1",
      "status": "draft",
      "wordCount": 1234,
      "createdAt": "2025-01-01T00:00:00Z",
      "updatedAt": "2025-01-10T14:00:00Z"
    }
  ]
}
```

**Errors:**
- `403` - User does not own this project

---

### POST /api/projects/:projectId/chapters

Create a new chapter (appended to end).

**Request:**
```json
{
  "title": "Chapter 1"
}
```

**Response (201 Created):**
```json
{
  "chapter": {
    "id": "uuid",
    "projectId": "uuid",
    "sortOrder": 1,
    "title": "Chapter 1",
    "status": "draft",
    "content": "",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2025-01-01T00:00:00Z"
  }
}
```

**Errors:**
- `400` - Missing title
- `403` - User does not own this project

---

### GET /api/chapters/:chapterId

Get a specific chapter (includes full content).

**Response (200 OK):**
```json
{
  "chapter": {
    "id": "uuid",
    "projectId": "uuid",
    "sortOrder": 1,
    "title": "Chapter 1",
    "status": "draft",
    "content": "Full chapter text here...",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2025-01-10T14:00:00Z"
  }
}
```

**Errors:**
- `403` - User does not own this chapter's project
- `404` - Chapter not found

---

### PATCH /api/chapters/:chapterId

Update a chapter (title, status, content).

**Request:**
```json
{
  "title": "Updated Title",
  "status": "revising",
  "content": "Updated chapter content..."
}
```

**Response (200 OK):**
```json
{
  "chapter": {
    "id": "uuid",
    "projectId": "uuid",
    "sortOrder": 1,
    "title": "Updated Title",
    "status": "revising",
    "content": "Updated chapter content...",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2025-01-10T15:00:00Z"
  }
}
```

**Errors:**
- `403` - User does not own this chapter's project
- `404` - Chapter not found

---

### POST /api/projects/:projectId/chapters/reorder

Reorder chapters within a project.

**Request:**
```json
{
  "orderedChapterIds": ["uuid1", "uuid2", "uuid3"]
}
```

**Response (200 OK):**
```json
{
  "ok": true
}
```

**Notes:**
- All chapter IDs must belong to the project
- Updates `sort_order` for all chapters transactionally

**Errors:**
- `400` - Invalid chapter IDs or missing chapters
- `403` - User does not own this project

---

## Chapter Revision Endpoints (Optional)

### POST /api/chapters/:chapterId/revisions

Create a revision snapshot.

**Request:**
```json
{
  "note": "Draft 1 complete"
}
```

**Response (201 Created):**
```json
{
  "revision": {
    "id": "uuid",
    "chapterId": "uuid",
    "content": "Snapshot of chapter content...",
    "note": "Draft 1 complete",
    "createdAt": "2025-01-10T16:00:00Z"
  }
}
```

---

### GET /api/chapters/:chapterId/revisions

List all revisions for a chapter.

**Response (200 OK):**
```json
{
  "revisions": [
    {
      "id": "uuid",
      "chapterId": "uuid",
      "note": "Draft 1 complete",
      "createdAt": "2025-01-10T16:00:00Z"
    }
  ]
}
```

---

### GET /api/revisions/:revisionId

Get a specific revision (includes content).

**Response (200 OK):**
```json
{
  "revision": {
    "id": "uuid",
    "chapterId": "uuid",
    "content": "Snapshot content...",
    "note": "Draft 1 complete",
    "createdAt": "2025-01-10T16:00:00Z"
  }
}
```

---

### POST /api/revisions/:revisionId/restore

Restore a chapter to a previous revision.

**Response (200 OK):**
```json
{
  "chapter": {
    "id": "uuid",
    "content": "Restored content...",
    "updatedAt": "2025-01-11T10:00:00Z"
  }
}
```

---

## Wiki Endpoints

### GET /api/projects/:projectId/wiki

List wiki pages in a project.

**Query Params:**
- `type` (optional): Filter by type (character, location, etc.)
- `q` (optional): Search query (title/content)
- `tag` (optional): Filter by tag name

**Response (200 OK):**
```json
{
  "pages": [
    {
      "id": "uuid",
      "projectId": "uuid",
      "type": "character",
      "title": "Rhea",
      "summary": "A mysterious traveler...",
      "createdAt": "2025-01-01T00:00:00Z",
      "updatedAt": "2025-01-05T12:00:00Z"
    }
  ]
}
```

---

### POST /api/projects/:projectId/wiki

Create a new wiki page.

**Request:**
```json
{
  "type": "character",
  "title": "Rhea",
  "summary": "A mysterious traveler...",
  "content": "Full wiki entry content..."
}
```

**Response (201 Created):**
```json
{
  "page": {
    "id": "uuid",
    "projectId": "uuid",
    "type": "character",
    "title": "Rhea",
    "summary": "A mysterious traveler...",
    "content": "Full wiki entry content...",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2025-01-01T00:00:00Z"
  }
}
```

**Errors:**
- `400` - Missing type or title
- `409` - Title already exists for this type in project

---

### GET /api/wiki/:pageId

Get a specific wiki page (includes tags, backlinks, mentions).

**Response (200 OK):**
```json
{
  "page": {
    "id": "uuid",
    "projectId": "uuid",
    "type": "character",
    "title": "Rhea",
    "summary": "A mysterious traveler...",
    "content": "Full wiki entry content...",
    "tags": ["mysterious", "ally"],
    "backlinks": [
      { "id": "uuid", "title": "Ganta Village", "type": "location" }
    ],
    "mentions": [
      { "id": "uuid", "chapterId": "uuid", "chapterTitle": "Chapter 3", "note": "First appearance" }
    ],
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2025-01-05T12:00:00Z"
  }
}
```

**Errors:**
- `403` - User does not own this wiki page's project
- `404` - Wiki page not found

---

### PATCH /api/wiki/:pageId

Update a wiki page.

**Request:**
```json
{
  "title": "Updated Title",
  "summary": "Updated summary",
  "content": "Updated content..."
}
```

**Response (200 OK):**
```json
{
  "page": {
    "id": "uuid",
    "projectId": "uuid",
    "type": "character",
    "title": "Updated Title",
    "summary": "Updated summary",
    "content": "Updated content...",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2025-01-06T10:00:00Z"
  }
}
```

---

### DELETE /api/wiki/:pageId

Delete a wiki page.

**Response (204 No Content)**

**Errors:**
- `403` - User does not own this wiki page's project
- `404` - Wiki page not found

---

### PUT /api/wiki/:pageId/tags

Set tags for a wiki page (replaces existing tags).

**Request:**
```json
{
  "tags": ["mysterious", "ally", "magic-user"]
}
```

**Response (200 OK):**
```json
{
  "tags": ["mysterious", "ally", "magic-user"]
}
```

---

### POST /api/wiki/:pageId/rebuild-links

Parse wiki content for `[[WikiLinks]]` and rebuild `wiki_links` table.

**Response (200 OK):**
```json
{
  "ok": true,
  "linksCreated": 3
}
```

**Notes:**
- Deletes old links from this page
- Parses content for `[[Title]]` syntax
- Creates new links if matching wiki pages exist

---

### PUT /api/wiki/:pageId/mentions

Link wiki page to chapters where it appears.

**Request:**
```json
{
  "mentions": [
    { "chapterId": "uuid1", "note": "First appearance" },
    { "chapterId": "uuid2", "note": "Major scene" }
  ]
}
```

**Response (200 OK):**
```json
{
  "ok": true
}
```

---

## Search Endpoint

### GET /api/projects/:projectId/search

Search chapters and wiki pages.

**Query Params:**
- `q` (required): Search query

**Response (200 OK):**
```json
{
  "chapters": [
    {
      "id": "uuid",
      "title": "Chapter 3",
      "sortOrder": 3,
      "snippet": "...matching text snippet..."
    }
  ],
  "wiki": [
    {
      "id": "uuid",
      "type": "location",
      "title": "Ganta Village",
      "snippet": "...matching text snippet..."
    }
  ]
}
```

**Notes:**
- Use `ILIKE` for simple text search (FTS optional later)
- Return max 10-20 results per category

---

## AI Endpoints (Phase 3+)

### POST /api/projects/:projectId/ai/ask

Ask a question about the novel/wiki (RAG-powered).

**Request:**
```json
{
  "question": "Where did we first mention the crystal?"
}
```

**Response (200 OK):**
```json
{
  "answer": "The crystal was first mentioned in Chapter 2...",
  "sources": [
    {
      "kind": "chapter",
      "id": "uuid",
      "title": "Chapter 2",
      "snippet": "...text containing mention..."
    }
  ],
  "tokensIn": 1234,
  "tokensOut": 567
}
```

---

### POST /api/chapters/:chapterId/ai/rewrite

Rewrite selected text with AI.

**Request:**
```json
{
  "text": "Selected text to rewrite...",
  "instruction": "Make it more tense",
  "canonSafeMode": true
}
```

**Response (200 OK):**
```json
{
  "original": "Selected text to rewrite...",
  "rewritten": "AI rewritten version...",
  "tokensIn": 234,
  "tokensOut": 156
}
```

---

### POST /api/chapters/:chapterId/ai/expand

Expand selected text.

**Request:**
```json
{
  "text": "He left the room.",
  "instruction": "Add sensory details"
}
```

**Response (200 OK):**
```json
{
  "original": "He left the room.",
  "expanded": "He pushed back his chair and left the room, the door clicking softly behind him...",
  "tokensIn": 123,
  "tokensOut": 89
}
```

---

### POST /api/projects/:projectId/ai/check-consistency

Run consistency check on project.

**Response (200 OK):**
```json
{
  "contradictions": [
    {
      "description": "Character eye color inconsistent",
      "sources": [
        { "kind": "chapter", "id": "uuid", "title": "Chapter 1", "snippet": "blue eyes" },
        { "kind": "chapter", "id": "uuid", "title": "Chapter 5", "snippet": "green eyes" }
      ]
    }
  ]
}
```

---

## Error Response Format

All errors follow this structure:

```json
{
  "error": "Human-readable error message"
}
```

**Common HTTP Status Codes:**
- `400 Bad Request` - Invalid input
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not authorized to access resource
- `404 Not Found` - Resource not found
- `409 Conflict` - Resource already exists
- `500 Internal Server Error` - Server error

---

## CORS Configuration

**Development:**
- Allow origin: `http://localhost:5173`
- Allow credentials: `true`
- Allow methods: `GET, POST, PUT, PATCH, DELETE, OPTIONS`
- Allow headers: `Content-Type, Authorization`

**Production:**
- Allow origin: `https://yourdomain.com`
- Same settings as above

---

## Rate Limiting (Future)

Consider rate limiting AI endpoints:
- `/api/ai/*` → 10 requests/minute per user
- Other endpoints → 100 requests/minute per user

---

## End Notes

This API is designed for:
- **Ownership enforcement** (every endpoint validates user access)
- **Simplicity** (RESTful, predictable structure)
- **AI-first** (RAG endpoints separate from CRUD)
- **Usability** (clear errors, consistent responses)

**Never trust client input. Always validate and check ownership.**
