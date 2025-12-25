package ai

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"
)

type DocumentService struct {
	db                *pgxpool.Pool
	embeddingsService *EmbeddingsService
}

func NewDocumentService(db *pgxpool.Pool, embeddingsService *EmbeddingsService) *DocumentService {
	return &DocumentService{
		db:                db,
		embeddingsService: embeddingsService,
	}
}

// ProcessDocument chunks and embeds a document
func (s *DocumentService) ProcessDocument(ctx context.Context, projectID, sourceType, sourceID, content string) error {
	// Calculate content hash
	contentHash := HashContent(content)

	// Check if document exists and is unchanged
	var existingHash string
	err := s.db.QueryRow(ctx, `
		SELECT content_hash FROM documents
		WHERE source_type = $1 AND source_id = $2
	`, sourceType, sourceID).Scan(&existingHash)

	if err == nil && existingHash == contentHash {
		// Content unchanged, skip processing
		return nil
	}

	// Start transaction
	tx, err := s.db.Begin(ctx)
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback(ctx)

	// Upsert document
	var documentID string
	err = tx.QueryRow(ctx, `
		INSERT INTO documents (project_id, source_type, source_id, content, content_hash)
		VALUES ($1, $2, $3, $4, $5)
		ON CONFLICT (source_type, source_id)
		DO UPDATE SET content = EXCLUDED.content, content_hash = EXCLUDED.content_hash, updated_at = now()
		RETURNING id
	`, projectID, sourceType, sourceID, content, contentHash).Scan(&documentID)
	if err != nil {
		return fmt.Errorf("failed to upsert document: %w", err)
	}

	// Delete old chunks
	_, err = tx.Exec(ctx, `DELETE FROM chunks WHERE document_id = $1`, documentID)
	if err != nil {
		return fmt.Errorf("failed to delete old chunks: %w", err)
	}

	// Chunk the content
	chunks := ChunkText(content)
	if len(chunks) == 0 {
		// Empty content, just commit and return
		return tx.Commit(ctx)
	}

	// Prepare texts for embedding
	texts := make([]string, len(chunks))
	for i, chunk := range chunks {
		texts[i] = chunk.Content
	}

	// Generate embeddings (if API key is configured)
	var embeddings [][]float32
	if s.embeddingsService != nil {
		embeddings, err = s.embeddingsService.GenerateEmbeddings(ctx, texts)
		if err != nil {
			// Log error but don't fail - we can still store chunks without embeddings
			fmt.Printf("Warning: failed to generate embeddings: %v\n", err)
			embeddings = make([][]float32, len(chunks))
		}
	}

	// Insert chunks with embeddings
	for i, chunk := range chunks {
		var embedding interface{}
		if i < len(embeddings) && embeddings[i] != nil {
			// Convert []float32 to pgvector format
			embedding = fmt.Sprintf("[%v]", joinFloats(embeddings[i]))
		}

		_, err = tx.Exec(ctx, `
			INSERT INTO chunks (document_id, project_id, chunk_index, content, token_count, embedding)
			VALUES ($1, $2, $3, $4, $5, $6)
		`, documentID, projectID, chunk.Index, chunk.Content, chunk.Tokens, embedding)
		if err != nil {
			return fmt.Errorf("failed to insert chunk: %w", err)
		}
	}

	return tx.Commit(ctx)
}

// DeleteDocument removes a document and its chunks
func (s *DocumentService) DeleteDocument(ctx context.Context, sourceType, sourceID string) error {
	_, err := s.db.Exec(ctx, `
		DELETE FROM documents WHERE source_type = $1 AND source_id = $2
	`, sourceType, sourceID)
	return err
}

// joinFloats converts []float32 to comma-separated string
func joinFloats(floats []float32) string {
	if len(floats) == 0 {
		return ""
	}
	result := fmt.Sprintf("%f", floats[0])
	for i := 1; i < len(floats); i++ {
		result += fmt.Sprintf(",%f", floats[i])
	}
	return result
}
