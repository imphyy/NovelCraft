package projects

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

var (
	ErrNotFound      = errors.New("project not found")
	ErrUnauthorized  = errors.New("unauthorized access to project")
)

type Service struct {
	db *pgxpool.Pool
}

func NewService(db *pgxpool.Pool) *Service {
	return &Service{db: db}
}

type Project struct {
	ID          string    `json:"id"`
	UserID      string    `json:"userId"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}

// List returns all projects for a user
func (s *Service) List(ctx context.Context, userID string) ([]Project, error) {
	rows, err := s.db.Query(ctx, `
		SELECT id, user_id, name, description, created_at, updated_at
		FROM projects
		WHERE user_id = $1
		ORDER BY updated_at DESC
	`, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to list projects: %w", err)
	}
	defer rows.Close()

	var projects []Project
	for rows.Next() {
		var p Project
		if err := rows.Scan(&p.ID, &p.UserID, &p.Name, &p.Description, &p.CreatedAt, &p.UpdatedAt); err != nil {
			return nil, fmt.Errorf("failed to scan project: %w", err)
		}
		projects = append(projects, p)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("rows error: %w", err)
	}

	return projects, nil
}

// Create creates a new project
func (s *Service) Create(ctx context.Context, userID, name, description string) (*Project, error) {
	var project Project
	err := s.db.QueryRow(ctx, `
		INSERT INTO projects (user_id, name, description)
		VALUES ($1, $2, $3)
		RETURNING id, user_id, name, description, created_at, updated_at
	`, userID, name, description).Scan(
		&project.ID,
		&project.UserID,
		&project.Name,
		&project.Description,
		&project.CreatedAt,
		&project.UpdatedAt,
	)

	if err != nil {
		return nil, fmt.Errorf("failed to create project: %w", err)
	}

	return &project, nil
}

// Get returns a single project by ID
func (s *Service) Get(ctx context.Context, projectID, userID string) (*Project, error) {
	var project Project
	err := s.db.QueryRow(ctx, `
		SELECT id, user_id, name, description, created_at, updated_at
		FROM projects
		WHERE id = $1 AND user_id = $2
	`, projectID, userID).Scan(
		&project.ID,
		&project.UserID,
		&project.Name,
		&project.Description,
		&project.CreatedAt,
		&project.UpdatedAt,
	)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("failed to get project: %w", err)
	}

	return &project, nil
}

// Update updates a project
func (s *Service) Update(ctx context.Context, projectID, userID, name, description string) (*Project, error) {
	var project Project
	err := s.db.QueryRow(ctx, `
		UPDATE projects
		SET name = $1, description = $2, updated_at = now()
		WHERE id = $3 AND user_id = $4
		RETURNING id, user_id, name, description, created_at, updated_at
	`, name, description, projectID, userID).Scan(
		&project.ID,
		&project.UserID,
		&project.Name,
		&project.Description,
		&project.CreatedAt,
		&project.UpdatedAt,
	)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("failed to update project: %w", err)
	}

	return &project, nil
}

// Delete deletes a project
func (s *Service) Delete(ctx context.Context, projectID, userID string) error {
	result, err := s.db.Exec(ctx, `
		DELETE FROM projects
		WHERE id = $1 AND user_id = $2
	`, projectID, userID)

	if err != nil {
		return fmt.Errorf("failed to delete project: %w", err)
	}

	if result.RowsAffected() == 0 {
		return ErrNotFound
	}

	return nil
}
