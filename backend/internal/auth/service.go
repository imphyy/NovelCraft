package auth

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"errors"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/crypto/bcrypt"
)

const (
	SessionCookieName = "novelcraft_session"
	SessionDuration   = 7 * 24 * time.Hour // 7 days
)

var (
	ErrInvalidCredentials = errors.New("invalid credentials")
	ErrUserExists         = errors.New("user already exists")
	ErrSessionExpired     = errors.New("session expired")
)

type Service struct {
	db *pgxpool.Pool
}

func NewService(db *pgxpool.Pool) *Service {
	return &Service{db: db}
}

// Register creates a new user
func (s *Service) Register(ctx context.Context, email, password string) (string, error) {
	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return "", fmt.Errorf("failed to hash password: %w", err)
	}

	// Insert user
	var userID string
	err = s.db.QueryRow(ctx, `
		INSERT INTO users (email, password_hash)
		VALUES ($1, $2)
		RETURNING id
	`, email, string(hashedPassword)).Scan(&userID)

	if err != nil {
		if err.Error() == "ERROR: duplicate key value violates unique constraint \"users_email_key\" (SQLSTATE 23505)" {
			return "", ErrUserExists
		}
		return "", fmt.Errorf("failed to create user: %w", err)
	}

	return userID, nil
}

// Login authenticates a user and returns a session token
func (s *Service) Login(ctx context.Context, email, password string) (string, error) {
	// Get user
	var userID, passwordHash string
	err := s.db.QueryRow(ctx, `
		SELECT id, password_hash FROM users WHERE email = $1
	`, email).Scan(&userID, &passwordHash)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return "", ErrInvalidCredentials
		}
		return "", fmt.Errorf("failed to get user: %w", err)
	}

	// Verify password
	if err := bcrypt.CompareHashAndPassword([]byte(passwordHash), []byte(password)); err != nil {
		return "", ErrInvalidCredentials
	}

	// Create session
	token, err := generateToken()
	if err != nil {
		return "", fmt.Errorf("failed to generate token: %w", err)
	}

	expiresAt := time.Now().Add(SessionDuration)

	_, err = s.db.Exec(ctx, `
		INSERT INTO sessions (user_id, token, expires_at)
		VALUES ($1, $2, $3)
	`, userID, token, expiresAt)

	if err != nil {
		return "", fmt.Errorf("failed to create session: %w", err)
	}

	return token, nil
}

// Logout invalidates a session
func (s *Service) Logout(ctx context.Context, token string) error {
	_, err := s.db.Exec(ctx, `
		DELETE FROM sessions WHERE token = $1
	`, token)

	return err
}

// ValidateSession checks if a session is valid and returns the user ID
func (s *Service) ValidateSession(ctx context.Context, token string) (string, error) {
	var userID string
	var expiresAt time.Time

	err := s.db.QueryRow(ctx, `
		SELECT user_id, expires_at FROM sessions WHERE token = $1
	`, token).Scan(&userID, &expiresAt)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return "", ErrSessionExpired
		}
		return "", fmt.Errorf("failed to get session: %w", err)
	}

	// Check if expired
	if time.Now().After(expiresAt) {
		// Clean up expired session
		_, _ = s.db.Exec(ctx, `DELETE FROM sessions WHERE token = $1`, token)
		return "", ErrSessionExpired
	}

	return userID, nil
}

// GetUserByID returns user information
func (s *Service) GetUserByID(ctx context.Context, userID string) (User, error) {
	var user User
	err := s.db.QueryRow(ctx, `
		SELECT id, email, created_at FROM users WHERE id = $1
	`, userID).Scan(&user.ID, &user.Email, &user.CreatedAt)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return User{}, errors.New("user not found")
		}
		return User{}, fmt.Errorf("failed to get user: %w", err)
	}

	return user, nil
}

// generateToken creates a random session token
func generateToken() (string, error) {
	bytes := make([]byte, 32)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return hex.EncodeToString(bytes), nil
}

type User struct {
	ID        string    `json:"id"`
	Email     string    `json:"email"`
	CreatedAt time.Time `json:"createdAt"`
}
