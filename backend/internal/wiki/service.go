package wiki

import (
	"context"
	"errors"
	"fmt"
	"regexp"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

var (
	ErrNotFound     = errors.New("wiki page not found")
	ErrUnauthorized = errors.New("unauthorized")
	ErrSlugTaken    = errors.New("slug already taken")
)

var wikiLinkPattern = regexp.MustCompile(`\[\[([^\]]+)\]\]`)

type WikiPage struct {
	ID        string    `json:"id"`
	ProjectID string    `json:"projectId"`
	Title     string    `json:"title"`
	Slug      string    `json:"slug"`
	Content   string    `json:"content"`
	PageType  string    `json:"pageType"`
	Tags      []string  `json:"tags"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

type WikiLink struct {
	ID           string    `json:"id"`
	ProjectID    string    `json:"projectId"`
	SourceType   string    `json:"sourceType"`
	SourceID     string    `json:"sourceId"`
	TargetPageID string    `json:"targetPageId"`
	CreatedAt    time.Time `json:"createdAt"`
}

type Backlink struct {
	SourceType  string    `json:"sourceType"`
	SourceID    string    `json:"sourceId"`
	SourceTitle string    `json:"sourceTitle"`
	CreatedAt   time.Time `json:"createdAt"`
}

type Mention struct {
	ChapterID    string    `json:"chapterId"`
	ChapterTitle string    `json:"chapterTitle"`
	CreatedAt    time.Time `json:"createdAt"`
}

type Service struct {
	db *pgxpool.Pool
}

func NewService(db *pgxpool.Pool) *Service {
	return &Service{db: db}
}

// generateSlug creates a URL-friendly slug from a title
func generateSlug(title string) string {
	slug := strings.ToLower(title)
	slug = regexp.MustCompile(`[^a-z0-9\s-]`).ReplaceAllString(slug, "")
	slug = regexp.MustCompile(`\s+`).ReplaceAllString(slug, "-")
	slug = strings.Trim(slug, "-")
	return slug
}

// extractWikiLinks parses content for [[WikiLink]] patterns and returns slugs
func extractWikiLinks(content string) []string {
	matches := wikiLinkPattern.FindAllStringSubmatch(content, -1)
	slugs := make([]string, 0, len(matches))
	seen := make(map[string]bool)

	for _, match := range matches {
		if len(match) > 1 {
			slug := generateSlug(match[1])
			if !seen[slug] {
				slugs = append(slugs, slug)
				seen[slug] = true
			}
		}
	}

	return slugs
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

// ListByProject returns all wiki pages for a project
func (s *Service) ListByProject(ctx context.Context, projectID, userID string) ([]WikiPage, error) {
	if err := s.verifyProjectOwnership(ctx, projectID, userID); err != nil {
		return nil, err
	}

	rows, err := s.db.Query(ctx, `
		SELECT id, project_id, title, slug, content, page_type, created_at, updated_at
		FROM wiki_pages
		WHERE project_id = $1
		ORDER BY title ASC
	`, projectID)
	if err != nil {
		return nil, fmt.Errorf("failed to list wiki pages: %w", err)
	}
	defer rows.Close()

	var pages []WikiPage
	for rows.Next() {
		var page WikiPage
		if err := rows.Scan(&page.ID, &page.ProjectID, &page.Title, &page.Slug, &page.Content, &page.PageType, &page.CreatedAt, &page.UpdatedAt); err != nil {
			return nil, fmt.Errorf("failed to scan wiki page: %w", err)
		}

		// Load tags
		tags, err := s.getPageTags(ctx, page.ID)
		if err != nil {
			return nil, err
		}
		page.Tags = tags

		pages = append(pages, page)
	}

	if pages == nil {
		pages = []WikiPage{}
	}

	return pages, nil
}

// Create creates a new wiki page
func (s *Service) Create(ctx context.Context, projectID, userID, title, pageType string) (*WikiPage, error) {
	if err := s.verifyProjectOwnership(ctx, projectID, userID); err != nil {
		return nil, err
	}

	slug := generateSlug(title)

	var page WikiPage
	err := s.db.QueryRow(ctx, `
		INSERT INTO wiki_pages (project_id, title, slug, page_type)
		VALUES ($1, $2, $3, $4)
		RETURNING id, project_id, title, slug, content, page_type, created_at, updated_at
	`, projectID, title, slug, pageType).Scan(&page.ID, &page.ProjectID, &page.Title, &page.Slug, &page.Content, &page.PageType, &page.CreatedAt, &page.UpdatedAt)

	if err != nil {
		if strings.Contains(err.Error(), "duplicate key") {
			return nil, ErrSlugTaken
		}
		return nil, fmt.Errorf("failed to create wiki page: %w", err)
	}

	page.Tags = []string{}
	return &page, nil
}

// Get returns a single wiki page by ID
func (s *Service) Get(ctx context.Context, pageID, userID string) (*WikiPage, error) {
	var page WikiPage
	err := s.db.QueryRow(ctx, `
		SELECT wp.id, wp.project_id, wp.title, wp.slug, wp.content, wp.page_type, wp.created_at, wp.updated_at
		FROM wiki_pages wp
		JOIN projects p ON wp.project_id = p.id
		WHERE wp.id = $1 AND p.user_id = $2
	`, pageID, userID).Scan(&page.ID, &page.ProjectID, &page.Title, &page.Slug, &page.Content, &page.PageType, &page.CreatedAt, &page.UpdatedAt)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("failed to get wiki page: %w", err)
	}

	// Load tags
	tags, err := s.getPageTags(ctx, page.ID)
	if err != nil {
		return nil, err
	}
	page.Tags = tags

	return &page, nil
}

// GetBySlug returns a single wiki page by slug
func (s *Service) GetBySlug(ctx context.Context, projectID, slug, userID string) (*WikiPage, error) {
	if err := s.verifyProjectOwnership(ctx, projectID, userID); err != nil {
		return nil, err
	}

	var page WikiPage
	err := s.db.QueryRow(ctx, `
		SELECT id, project_id, title, slug, content, page_type, created_at, updated_at
		FROM wiki_pages
		WHERE project_id = $1 AND slug = $2
	`, projectID, slug).Scan(&page.ID, &page.ProjectID, &page.Title, &page.Slug, &page.Content, &page.PageType, &page.CreatedAt, &page.UpdatedAt)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("failed to get wiki page: %w", err)
	}

	// Load tags
	tags, err := s.getPageTags(ctx, page.ID)
	if err != nil {
		return nil, err
	}
	page.Tags = tags

	return &page, nil
}

// Update updates a wiki page
func (s *Service) Update(ctx context.Context, pageID, userID string, title, content *string) (*WikiPage, error) {
	// Verify ownership
	existing, err := s.Get(ctx, pageID, userID)
	if err != nil {
		return nil, err
	}

	updates := []string{}
	args := []interface{}{pageID}
	argPos := 2

	if title != nil {
		updates = append(updates, fmt.Sprintf("title = $%d", argPos))
		args = append(args, *title)
		argPos++

		// Update slug if title changes
		slug := generateSlug(*title)
		updates = append(updates, fmt.Sprintf("slug = $%d", argPos))
		args = append(args, slug)
		argPos++
	}

	if content != nil {
		updates = append(updates, fmt.Sprintf("content = $%d", argPos))
		args = append(args, *content)
		argPos++
	}

	if len(updates) == 0 {
		return existing, nil
	}

	updates = append(updates, "updated_at = now()")

	query := fmt.Sprintf(`
		UPDATE wiki_pages
		SET %s
		WHERE id = $1
		RETURNING id, project_id, title, slug, content, page_type, created_at, updated_at
	`, strings.Join(updates, ", "))

	var page WikiPage
	err = s.db.QueryRow(ctx, query, args...).Scan(&page.ID, &page.ProjectID, &page.Title, &page.Slug, &page.Content, &page.PageType, &page.CreatedAt, &page.UpdatedAt)
	if err != nil {
		if strings.Contains(err.Error(), "duplicate key") {
			return nil, ErrSlugTaken
		}
		return nil, fmt.Errorf("failed to update wiki page: %w", err)
	}

	// Load tags
	tags, err := s.getPageTags(ctx, page.ID)
	if err != nil {
		return nil, err
	}
	page.Tags = tags

	// If content was updated, rebuild links
	if content != nil {
		if err := s.RebuildLinksForPage(ctx, page.ProjectID, pageID, *content); err != nil {
			return nil, err
		}
	}

	return &page, nil
}

// Delete deletes a wiki page
func (s *Service) Delete(ctx context.Context, pageID, userID string) error {
	result, err := s.db.Exec(ctx, `
		DELETE FROM wiki_pages
		WHERE id = $1 AND project_id IN (SELECT id FROM projects WHERE user_id = $2)
	`, pageID, userID)

	if err != nil {
		return fmt.Errorf("failed to delete wiki page: %w", err)
	}

	if result.RowsAffected() == 0 {
		return ErrNotFound
	}

	return nil
}

// getPageTags retrieves tags for a wiki page
func (s *Service) getPageTags(ctx context.Context, pageID string) ([]string, error) {
	rows, err := s.db.Query(ctx, `
		SELECT wt.name
		FROM wiki_tags wt
		JOIN wiki_page_tags wpt ON wpt.wiki_tag_id = wt.id
		WHERE wpt.wiki_page_id = $1
		ORDER BY wt.name ASC
	`, pageID)
	if err != nil {
		return nil, fmt.Errorf("failed to get page tags: %w", err)
	}
	defer rows.Close()

	tags := []string{}
	for rows.Next() {
		var tag string
		if err := rows.Scan(&tag); err != nil {
			return nil, fmt.Errorf("failed to scan tag: %w", err)
		}
		tags = append(tags, tag)
	}

	return tags, nil
}

// AddTag adds a tag to a wiki page
func (s *Service) AddTag(ctx context.Context, pageID, tagName, userID string) error {
	// Verify ownership
	page, err := s.Get(ctx, pageID, userID)
	if err != nil {
		return err
	}

	// Get or create tag
	var tagID string
	err = s.db.QueryRow(ctx, `
		INSERT INTO wiki_tags (project_id, name)
		VALUES ($1, $2)
		ON CONFLICT (project_id, name) DO UPDATE SET name = EXCLUDED.name
		RETURNING id
	`, page.ProjectID, tagName).Scan(&tagID)
	if err != nil {
		return fmt.Errorf("failed to get or create tag: %w", err)
	}

	// Add tag to page
	_, err = s.db.Exec(ctx, `
		INSERT INTO wiki_page_tags (wiki_page_id, wiki_tag_id)
		VALUES ($1, $2)
		ON CONFLICT DO NOTHING
	`, pageID, tagID)
	if err != nil {
		return fmt.Errorf("failed to add tag to page: %w", err)
	}

	return nil
}

// RemoveTag removes a tag from a wiki page
func (s *Service) RemoveTag(ctx context.Context, pageID, tagName, userID string) error {
	// Verify ownership
	page, err := s.Get(ctx, pageID, userID)
	if err != nil {
		return err
	}

	_, err = s.db.Exec(ctx, `
		DELETE FROM wiki_page_tags
		WHERE wiki_page_id = $1
		AND wiki_tag_id IN (
			SELECT id FROM wiki_tags WHERE project_id = $2 AND name = $3
		)
	`, pageID, page.ProjectID, tagName)
	if err != nil {
		return fmt.Errorf("failed to remove tag: %w", err)
	}

	return nil
}

// RebuildLinksForPage rebuilds wiki links for a specific page
func (s *Service) RebuildLinksForPage(ctx context.Context, projectID, sourceID, content string) error {
	// Delete existing links from this source
	_, err := s.db.Exec(ctx, `
		DELETE FROM wiki_links
		WHERE source_type = 'wiki_page' AND source_id = $1
	`, sourceID)
	if err != nil {
		return fmt.Errorf("failed to delete old links: %w", err)
	}

	// Extract wiki links from content
	slugs := extractWikiLinks(content)
	if len(slugs) == 0 {
		return nil
	}

	// Resolve slugs to page IDs
	for _, slug := range slugs {
		var targetID string
		err := s.db.QueryRow(ctx, `
			SELECT id FROM wiki_pages WHERE project_id = $1 AND slug = $2
		`, projectID, slug).Scan(&targetID)

		if err != nil {
			// Skip if target page doesn't exist
			if errors.Is(err, pgx.ErrNoRows) {
				continue
			}
			return fmt.Errorf("failed to resolve slug: %w", err)
		}

		// Create link
		_, err = s.db.Exec(ctx, `
			INSERT INTO wiki_links (project_id, source_type, source_id, target_page_id)
			VALUES ($1, 'wiki_page', $2, $3)
			ON CONFLICT DO NOTHING
		`, projectID, sourceID, targetID)
		if err != nil {
			return fmt.Errorf("failed to create link: %w", err)
		}
	}

	return nil
}

// RebuildLinksForChapter rebuilds wiki links for a specific chapter
func (s *Service) RebuildLinksForChapter(ctx context.Context, projectID, chapterID, content string) error {
	// Delete existing links from this source
	_, err := s.db.Exec(ctx, `
		DELETE FROM wiki_links
		WHERE source_type = 'chapter' AND source_id = $1
	`, chapterID)
	if err != nil {
		return fmt.Errorf("failed to delete old links: %w", err)
	}

	// Extract wiki links from content
	slugs := extractWikiLinks(content)
	if len(slugs) == 0 {
		return nil
	}

	// Resolve slugs to page IDs
	for _, slug := range slugs {
		var targetID string
		err := s.db.QueryRow(ctx, `
			SELECT id FROM wiki_pages WHERE project_id = $1 AND slug = $2
		`, projectID, slug).Scan(&targetID)

		if err != nil {
			// Skip if target page doesn't exist
			if errors.Is(err, pgx.ErrNoRows) {
				continue
			}
			return fmt.Errorf("failed to resolve slug: %w", err)
		}

		// Create link
		_, err = s.db.Exec(ctx, `
			INSERT INTO wiki_links (project_id, source_type, source_id, target_page_id)
			VALUES ($1, 'chapter', $2, $3)
			ON CONFLICT DO NOTHING
		`, projectID, chapterID, targetID)
		if err != nil {
			return fmt.Errorf("failed to create link: %w", err)
		}
	}

	return nil
}

// GetBacklinks returns all pages/chapters that link to this page
func (s *Service) GetBacklinks(ctx context.Context, pageID, userID string) ([]Backlink, error) {
	// Verify ownership
	_, err := s.Get(ctx, pageID, userID)
	if err != nil {
		return nil, err
	}

	rows, err := s.db.Query(ctx, `
		SELECT wl.source_type, wl.source_id,
		       CASE
		           WHEN wl.source_type = 'wiki_page' THEN wp.title
		           WHEN wl.source_type = 'chapter' THEN c.title
		       END as source_title,
		       wl.created_at
		FROM wiki_links wl
		LEFT JOIN wiki_pages wp ON wl.source_type = 'wiki_page' AND wl.source_id = wp.id
		LEFT JOIN chapters c ON wl.source_type = 'chapter' AND wl.source_id = c.id
		WHERE wl.target_page_id = $1
		ORDER BY wl.created_at DESC
	`, pageID)
	if err != nil {
		return nil, fmt.Errorf("failed to get backlinks: %w", err)
	}
	defer rows.Close()

	backlinks := []Backlink{}
	for rows.Next() {
		var link Backlink
		if err := rows.Scan(&link.SourceType, &link.SourceID, &link.SourceTitle, &link.CreatedAt); err != nil {
			return nil, fmt.Errorf("failed to scan backlink: %w", err)
		}
		backlinks = append(backlinks, link)
	}

	return backlinks, nil
}

// GetMentions returns all chapters that mention this wiki page
func (s *Service) GetMentions(ctx context.Context, pageID, userID string) ([]Mention, error) {
	// Verify ownership
	_, err := s.Get(ctx, pageID, userID)
	if err != nil {
		return nil, err
	}

	rows, err := s.db.Query(ctx, `
		SELECT c.id, c.title, wl.created_at
		FROM wiki_links wl
		JOIN chapters c ON wl.source_id = c.id
		WHERE wl.source_type = 'chapter' AND wl.target_page_id = $1
		ORDER BY wl.created_at DESC
	`, pageID)
	if err != nil {
		return nil, fmt.Errorf("failed to get mentions: %w", err)
	}
	defer rows.Close()

	mentions := []Mention{}
	for rows.Next() {
		var mention Mention
		if err := rows.Scan(&mention.ChapterID, &mention.ChapterTitle, &mention.CreatedAt); err != nil {
			return nil, fmt.Errorf("failed to scan mention: %w", err)
		}
		mentions = append(mentions, mention)
	}

	return mentions, nil
}
