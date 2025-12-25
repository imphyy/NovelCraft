# NovelCraft

A personal writing web application for novelists with AI-powered assistance.

## Features

- **Project Management** - Organize multiple books/novels
- **Chapter Editor** - Rich text editor with autosave
- **Wiki System** - Lore database for characters, locations, events, etc.
- **Internal Linking** - `[[Wiki Links]]` syntax for connecting content
- **Full-Text Search** - Search across all chapters and wiki pages
- **AI Features** (optional with OpenAI API key):
  - Ask questions about your novel (RAG-based Q&A)
  - AI rewrite tools (expand, tighten, dialogue variants, etc.)
  - Canon-safe mode for strict retrieval

## Tech Stack

- **Backend**: Go + Echo + PostgreSQL + pgvector
- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **AI**: OpenAI (embeddings + GPT-4o)
- **Auth**: Cookie-based sessions

## Quick Start

### Prerequisites

- Go 1.21+
- Node.js 20+
- Docker & Docker Compose
- make (optional, for convenience)

### 1. Clone the Repository

```bash
git clone https://github.com/imphyy/NovelCraft.git
cd NovelCraft
```

### 2. Start the Database

```bash
make docker-up
# OR
cd infra && docker compose up -d
```

### 3. Run Migrations

```bash
make migrate-up
# OR
./migrate -path backend/migrations -database "postgres://novelcraft:novelcraft@localhost:5432/novelcraft?sslmode=disable" up
```

### 4. Configure Environment (Optional)

Set OpenAI API key for AI features:

```bash
export OPENAI_API_KEY="sk-..."
```

### 5. Start Backend

```bash
make run
# OR
cd backend && go run ./cmd/api
```

Backend will be available at: http://localhost:8080

### 6. Start Frontend

```bash
make dev-frontend
# OR
cd frontend && npm install && npm run dev
```

Frontend will be available at: http://localhost:5173

## Development

### Running Tests

**All tests:**
```bash
make test
```

**Backend tests only:**
```bash
make test-backend
```

**Frontend tests only:**
```bash
make test-frontend
```

**With coverage:**
```bash
make test-backend-coverage
make test-frontend-coverage
```

### Setup Test Environment

```bash
make setup-test
```

This creates a test database and runs migrations.

### Backend Tests

The backend includes:
- Unit tests for services
- Integration tests for API endpoints
- AI service tests

Run unit tests only (no database required):
```bash
cd backend
go test -short ./...
```

Run all tests (requires test database):
```bash
cd backend
go test -v ./...
```

### Frontend Tests

The frontend uses Vitest + React Testing Library.

Run tests in watch mode:
```bash
cd frontend
npm run test
```

Run tests with UI:
```bash
cd frontend
npm run test:ui
```

Run tests with coverage:
```bash
cd frontend
npm run test:coverage
```

## Project Structure

```
NovelCraft/
├── backend/
│   ├── cmd/api/              # Main application entry point
│   ├── internal/
│   │   ├── ai/               # AI services (RAG, embeddings, chat)
│   │   ├── auth/             # Authentication
│   │   ├── chapters/         # Chapters management
│   │   ├── config/           # Configuration
│   │   ├── db/               # Database connection
│   │   ├── httpapi/          # HTTP server and routes
│   │   ├── projects/         # Projects management
│   │   ├── search/           # Full-text search
│   │   └── wiki/             # Wiki system
│   ├── migrations/           # Database migrations
│   └── go.mod
├── frontend/
│   ├── src/
│   │   ├── api/              # API client
│   │   ├── components/       # React components
│   │   ├── contexts/         # React contexts (auth)
│   │   ├── pages/            # Page components
│   │   ├── types/            # TypeScript types
│   │   └── test/             # Test setup
│   ├── package.json
│   └── vitest.config.ts
├── infra/
│   └── docker-compose.yml    # PostgreSQL + pgvector
├── docs/                     # Documentation
├── .github/workflows/        # CI/CD
├── Makefile                  # Development commands
└── README.md
```

## API Documentation

API endpoints are documented in `docs/API_SPEC.md`.

Key endpoints:
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/projects` - List projects
- `GET /api/projects/:id/chapters` - List chapters
- `GET /api/projects/:id/wiki` - List wiki pages
- `GET /api/projects/:id/search?q=query` - Search
- `POST /api/projects/:id/ai/ask` - Ask AI (requires API key)
- `POST /api/chapters/:id/ai/rewrite` - Rewrite text (requires API key)

## Database Schema

See `docs/DATABASE_SCHEMA.md` for full schema documentation.

Key tables:
- `users` - User accounts
- `sessions` - Session management
- `projects` - Writing projects
- `chapters` - Chapter content
- `wiki_pages` - Wiki entries
- `documents` - AI document tracking
- `chunks` - Vector embeddings for RAG

## AI Integration

NovelCraft uses RAG (Retrieval-Augmented Generation) for AI features:

1. **Chunking**: Text is split into ~1000 character chunks
2. **Embeddings**: OpenAI text-embedding-3-small (1536 dimensions)
3. **Storage**: pgvector for similarity search
4. **Retrieval**: Cosine similarity search for relevant chunks
5. **Generation**: GPT-4o for answers and rewrites

See `docs/AI_INTEGRATION.md` for detailed architecture.

## Environment Variables

### Backend

- `DATABASE_URL` - PostgreSQL connection string (default: `postgres://novelcraft:novelcraft@localhost:5432/novelcraft?sslmode=disable`)
- `PORT` - Server port (default: `8080`)
- `OPENAI_API_KEY` - OpenAI API key (optional, for AI features)

### Frontend

- `VITE_API_URL` - Backend API URL (default: `http://localhost:8080/api`)

## Continuous Integration

The project uses GitHub Actions for CI:

- Backend tests with PostgreSQL service
- Frontend tests with Vitest
- Code coverage reporting
- Build verification

See `.github/workflows/ci.yml` for details.

## Makefile Commands

```bash
make help              # Show all commands
make setup             # Setup development environment
make setup-test        # Setup test environment
make docker-up         # Start database
make docker-down       # Stop database
make migrate-up        # Run migrations
make migrate-down      # Rollback migrations
make build             # Build backend
make build-frontend    # Build frontend
make run               # Run backend
make dev-frontend      # Run frontend dev server
make test              # Run all tests
make test-backend      # Run backend tests
make test-frontend     # Run frontend tests
make lint-backend      # Lint Go code
make lint-frontend     # Lint frontend code
make clean             # Clean build artifacts
```

## Contributing

1. Create a feature branch
2. Make changes with tests
3. Run `make test` to verify
4. Run `make lint-backend` and `make lint-frontend`
5. Submit a pull request

## License

Private project - All rights reserved.

## Support

For issues or questions, please open a GitHub issue.

---

Built with ❤️ using Go, React, and Claude Code.
