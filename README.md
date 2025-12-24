# NovelCraft

A personal writing web application for novelists.

## Features

- **Book Writing**: Organize your work into projects and chapters
- **Autosaving Editor**: Never lose your progress
- **Wiki/Lore Database**: Track characters, locations, factions, items, events, and concepts
- **Internal Linking**: Use `[[Wiki Links]]` to connect your lore
- **Search**: Find content across chapters and wiki pages
- **AI-Assisted Writing** (Coming later): RAG-powered assistance while respecting your canon

## Tech Stack

- **Frontend**: React + TypeScript (Vite)
- **Backend**: Go + Echo
- **Database**: PostgreSQL + pgvector
- **Authentication**: Cookie-based sessions

## Project Structure

```
NovelCraft/
  frontend/          # React frontend
  backend/           # Go backend
    cmd/api/         # Main application entry point
    internal/        # Internal packages
    migrations/      # Database migrations
  infra/             # Infrastructure (Docker, etc.)
  docs/              # Documentation
```

## Getting Started

Documentation coming soon.

## License

Private project - All rights reserved.
