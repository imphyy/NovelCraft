package search

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"github.com/jackc/pgx/v5/pgxpool"
)

var (
	ErrUnauthorized = errors.New("unauthorized")
)

type ChapterResult struct {
	ID        string `json:"id"`
	Title     string `json:"title"`
	Snippet   string `json:"snippet"`
	SortOrder int    `json:"sortOrder"`
}

type WikiPageResult struct {
	ID       string `json:"id"`
	Title    string `json:"title"`
	Slug     string `json:"slug"`
	PageType string `json:"pageType"`
	Snippet  string `json:"snippet"`
}

type SearchResults struct {
	Chapters  []ChapterResult  `json:"chapters"`
	WikiPages []WikiPageResult `json:"wikiPages"`
}

type Service struct {
	db *pgxpool.Pool
}

func NewService(db *pgxpool.Pool) *Service {
	return &Service{db: db}
}

// verifyProjectOwnership checks if user owns the project
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

// createSnippet creates a context snippet around the search term
func createSnippet(content, searchTerm string, maxLength int) string {
	content = strings.TrimSpace(content)
	if content == "" {
		return ""
	}

	lowerContent := strings.ToLower(content)
	lowerTerm := strings.ToLower(searchTerm)

	// Find the position of the search term
	pos := strings.Index(lowerContent, lowerTerm)

	if pos == -1 {
		// Term not found, return beginning of content
		if len(content) > maxLength {
			return content[:maxLength] + "..."
		}
		return content
	}

	// Calculate snippet bounds
	start := pos - 50
	if start < 0 {
		start = 0
	}

	end := pos + len(searchTerm) + 150
	if end > len(content) {
		end = len(content)
	}

	snippet := content[start:end]

	// Add ellipsis if truncated
	if start > 0 {
		snippet = "..." + snippet
	}
	if end < len(content) {
		snippet = snippet + "..."
	}

	return strings.TrimSpace(snippet)
}

// Search performs a full-text search across chapters and wiki pages in a project
func (s *Service) Search(ctx context.Context, projectID, userID, query string) (*SearchResults, error) {
	if err := s.verifyProjectOwnership(ctx, projectID, userID); err != nil {
		return nil, err
	}

	if query == "" {
		return &SearchResults{
			Chapters:  []ChapterResult{},
			WikiPages: []WikiPageResult{},
		}, nil
	}

	results := &SearchResults{
		Chapters:  []ChapterResult{},
		WikiPages: []WikiPageResult{},
	}

	// Search chapters
	chapterRows, err := s.db.Query(ctx, `
		SELECT id, title, content, sort_order
		FROM chapters
		WHERE project_id = $1
		AND (
			title ILIKE '%' || $2 || '%'
			OR content ILIKE '%' || $2 || '%'
		)
		ORDER BY sort_order ASC
	`, projectID, query)
	if err != nil {
		return nil, fmt.Errorf("failed to search chapters: %w", err)
	}
	defer chapterRows.Close()

	for chapterRows.Next() {
		var id, title, content string
		var sortOrder int

		if err := chapterRows.Scan(&id, &title, &content, &sortOrder); err != nil {
			return nil, fmt.Errorf("failed to scan chapter: %w", err)
		}

		snippet := createSnippet(content, query, 200)

		results.Chapters = append(results.Chapters, ChapterResult{
			ID:        id,
			Title:     title,
			Snippet:   snippet,
			SortOrder: sortOrder,
		})
	}

	// Search wiki pages
	wikiRows, err := s.db.Query(ctx, `
		SELECT id, title, slug, page_type, content
		FROM wiki_pages
		WHERE project_id = $1
		AND (
			title ILIKE '%' || $2 || '%'
			OR content ILIKE '%' || $2 || '%'
		)
		ORDER BY title ASC
	`, projectID, query)
	if err != nil {
		return nil, fmt.Errorf("failed to search wiki pages: %w", err)
	}
	defer wikiRows.Close()

	for wikiRows.Next() {
		var id, title, slug, pageType, content string

		if err := wikiRows.Scan(&id, &title, &slug, &pageType, &content); err != nil {
			return nil, fmt.Errorf("failed to scan wiki page: %w", err)
		}

		snippet := createSnippet(content, query, 200)

		results.WikiPages = append(results.WikiPages, WikiPageResult{
			ID:       id,
			Title:    title,
			Slug:     slug,
			PageType: pageType,
			Snippet:  snippet,
		})
	}

	return results, nil
}
