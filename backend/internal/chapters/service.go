package chapters

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

var (
	ErrNotFound     = errors.New("chapter not found")
	ErrUnauthorized = errors.New("unauthorized access to chapter")
)

type Service struct {
	db *pgxpool.Pool
}

func NewService(db *pgxpool.Pool) *Service {
	return &Service{db: db}
}

type Chapter struct {
	ID        string    `json:"id"`
	ProjectID string    `json:"projectId"`
	SortOrder int       `json:"sortOrder"`
	Title     string    `json:"title"`
	Status    string    `json:"status"`
	Content   string    `json:"content"`
	WordCount int       `json:"wordCount"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

type ChapterRevision struct {
	ID        string    `json:"id"`
	ChapterID string    `json:"chapterId"`
	Content   string    `json:"content"`
	Note      string    `json:"note"`
	CreatedAt time.Time `json:"createdAt"`
}

// ListByProject returns all chapters for a project
func (s *Service) ListByProject(ctx context.Context, projectID, userID string) ([]Chapter, error) {
	// First verify ownership
	if err := s.verifyProjectOwnership(ctx, projectID, userID); err != nil {
		return nil, err
	}

	rows, err := s.db.Query(ctx, `
		SELECT id, project_id, sort_order, title, status, content, created_at, updated_at
		FROM chapters
		WHERE project_id = $1
		ORDER BY sort_order ASC
	`, projectID)
	if err != nil {
		return nil, fmt.Errorf("failed to list chapters: %w", err)
	}
	defer rows.Close()

	var chapters []Chapter
	for rows.Next() {
		var c Chapter
		if err := rows.Scan(&c.ID, &c.ProjectID, &c.SortOrder, &c.Title, &c.Status, &c.Content, &c.CreatedAt, &c.UpdatedAt); err != nil {
			return nil, fmt.Errorf("failed to scan chapter: %w", err)
		}
		c.WordCount = calculateWordCount(c.Content)
		chapters = append(chapters, c)
	}

	return chapters, nil
}

// Create creates a new chapter (appends to end)
func (s *Service) Create(ctx context.Context, projectID, userID, title string) (*Chapter, error) {
	// Verify ownership
	if err := s.verifyProjectOwnership(ctx, projectID, userID); err != nil {
		return nil, err
	}

	// Get next sort_order
	var maxOrder int
	err := s.db.QueryRow(ctx, `
		SELECT COALESCE(MAX(sort_order), 0) FROM chapters WHERE project_id = $1
	`, projectID).Scan(&maxOrder)
	if err != nil {
		return nil, fmt.Errorf("failed to get max sort_order: %w", err)
	}

	var chapter Chapter
	err = s.db.QueryRow(ctx, `
		INSERT INTO chapters (project_id, sort_order, title)
		VALUES ($1, $2, $3)
		RETURNING id, project_id, sort_order, title, status, content, created_at, updated_at
	`, projectID, maxOrder+1, title).Scan(
		&chapter.ID,
		&chapter.ProjectID,
		&chapter.SortOrder,
		&chapter.Title,
		&chapter.Status,
		&chapter.Content,
		&chapter.CreatedAt,
		&chapter.UpdatedAt,
	)

	if err != nil {
		return nil, fmt.Errorf("failed to create chapter: %w", err)
	}

	chapter.WordCount = calculateWordCount(chapter.Content)
	return &chapter, nil
}

// Get returns a single chapter by ID
func (s *Service) Get(ctx context.Context, chapterID, userID string) (*Chapter, error) {
	var chapter Chapter
	err := s.db.QueryRow(ctx, `
		SELECT c.id, c.project_id, c.sort_order, c.title, c.status, c.content, c.created_at, c.updated_at
		FROM chapters c
		JOIN projects p ON c.project_id = p.id
		WHERE c.id = $1 AND p.user_id = $2
	`, chapterID, userID).Scan(
		&chapter.ID,
		&chapter.ProjectID,
		&chapter.SortOrder,
		&chapter.Title,
		&chapter.Status,
		&chapter.Content,
		&chapter.CreatedAt,
		&chapter.UpdatedAt,
	)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("failed to get chapter: %w", err)
	}

	chapter.WordCount = calculateWordCount(chapter.Content)
	return &chapter, nil
}

// Update updates a chapter
func (s *Service) Update(ctx context.Context, chapterID, userID string, title, status, content *string) (*Chapter, error) {
	// Build dynamic update query
	updates := []string{}
	args := []interface{}{chapterID, userID}
	argPos := 3

	if title != nil {
		updates = append(updates, fmt.Sprintf("title = $%d", argPos))
		args = append(args, *title)
		argPos++
	}

	if status != nil {
		updates = append(updates, fmt.Sprintf("status = $%d", argPos))
		args = append(args, *status)
		argPos++
	}

	if content != nil {
		updates = append(updates, fmt.Sprintf("content = $%d", argPos))
		args = append(args, *content)
		argPos++
	}

	if len(updates) == 0 {
		return s.Get(ctx, chapterID, userID)
	}

	updates = append(updates, "updated_at = now()")

	query := fmt.Sprintf(`
		UPDATE chapters c
		SET %s
		FROM projects p
		WHERE c.id = $1 AND c.project_id = p.id AND p.user_id = $2
		RETURNING c.id, c.project_id, c.sort_order, c.title, c.status, c.content, c.created_at, c.updated_at
	`, strings.Join(updates, ", "))

	var chapter Chapter
	err := s.db.QueryRow(ctx, query, args...).Scan(
		&chapter.ID,
		&chapter.ProjectID,
		&chapter.SortOrder,
		&chapter.Title,
		&chapter.Status,
		&chapter.Content,
		&chapter.CreatedAt,
		&chapter.UpdatedAt,
	)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("failed to update chapter: %w", err)
	}

	chapter.WordCount = calculateWordCount(chapter.Content)
	return &chapter, nil
}

// Reorder reorders chapters within a project
func (s *Service) Reorder(ctx context.Context, projectID, userID string, orderedChapterIDs []string) error {
	// Verify ownership
	if err := s.verifyProjectOwnership(ctx, projectID, userID); err != nil {
		return err
	}

	// Start transaction
	tx, err := s.db.Begin(ctx)
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback(ctx)

	// Update each chapter's sort_order
	for i, chapterID := range orderedChapterIDs {
		_, err := tx.Exec(ctx, `
			UPDATE chapters
			SET sort_order = $1
			WHERE id = $2 AND project_id = $3
		`, i+1, chapterID, projectID)
		if err != nil {
			return fmt.Errorf("failed to update sort_order: %w", err)
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return fmt.Errorf("failed to commit transaction: %w", err)
	}

	return nil
}

// CreateRevision creates a revision snapshot
func (s *Service) CreateRevision(ctx context.Context, chapterID, userID, note string) (*ChapterRevision, error) {
	// Get chapter to verify ownership and get content
	chapter, err := s.Get(ctx, chapterID, userID)
	if err != nil {
		return nil, err
	}

	var revision ChapterRevision
	err = s.db.QueryRow(ctx, `
		INSERT INTO chapter_revisions (chapter_id, content, note)
		VALUES ($1, $2, $3)
		RETURNING id, chapter_id, content, note, created_at
	`, chapter.ID, chapter.Content, note).Scan(
		&revision.ID,
		&revision.ChapterID,
		&revision.Content,
		&revision.Note,
		&revision.CreatedAt,
	)

	if err != nil {
		return nil, fmt.Errorf("failed to create revision: %w", err)
	}

	return &revision, nil
}

// ListRevisions returns all revisions for a chapter
func (s *Service) ListRevisions(ctx context.Context, chapterID, userID string) ([]ChapterRevision, error) {
	// Verify ownership
	if _, err := s.Get(ctx, chapterID, userID); err != nil {
		return nil, err
	}

	rows, err := s.db.Query(ctx, `
		SELECT id, chapter_id, note, created_at
		FROM chapter_revisions
		WHERE chapter_id = $1
		ORDER BY created_at DESC
	`, chapterID)
	if err != nil {
		return nil, fmt.Errorf("failed to list revisions: %w", err)
	}
	defer rows.Close()

	var revisions []ChapterRevision
	for rows.Next() {
		var r ChapterRevision
		if err := rows.Scan(&r.ID, &r.ChapterID, &r.Note, &r.CreatedAt); err != nil {
			return nil, fmt.Errorf("failed to scan revision: %w", err)
		}
		revisions = append(revisions, r)
	}

	return revisions, nil
}

// GetRevision returns a specific revision
func (s *Service) GetRevision(ctx context.Context, revisionID, userID string) (*ChapterRevision, error) {
	var revision ChapterRevision
	err := s.db.QueryRow(ctx, `
		SELECT r.id, r.chapter_id, r.content, r.note, r.created_at
		FROM chapter_revisions r
		JOIN chapters c ON r.chapter_id = c.id
		JOIN projects p ON c.project_id = p.id
		WHERE r.id = $1 AND p.user_id = $2
	`, revisionID, userID).Scan(
		&revision.ID,
		&revision.ChapterID,
		&revision.Content,
		&revision.Note,
		&revision.CreatedAt,
	)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, errors.New("revision not found")
		}
		return nil, fmt.Errorf("failed to get revision: %w", err)
	}

	return &revision, nil
}

// RestoreRevision restores a chapter to a previous revision
func (s *Service) RestoreRevision(ctx context.Context, revisionID, userID string) (*Chapter, error) {
	// Get revision
	revision, err := s.GetRevision(ctx, revisionID, userID)
	if err != nil {
		return nil, err
	}

	// Update chapter with revision content
	return s.Update(ctx, revision.ChapterID, userID, nil, nil, &revision.Content)
}

func (s *Service) verifyProjectOwnership(ctx context.Context, projectID, userID string) error {
	var exists bool
	err := s.db.QueryRow(ctx, `
		SELECT EXISTS(SELECT 1 FROM projects WHERE id = $1 AND user_id = $2)
	`, projectID, userID).Scan(&exists)

	if err != nil {
		return fmt.Errorf("failed to verify ownership: %w", err)
	}

	if !exists {
		return ErrUnauthorized
	}

	return nil
}

func calculateWordCount(text string) int {
	if text == "" {
		return 0
	}
	words := strings.Fields(text)
	return len(words)
}
