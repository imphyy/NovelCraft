package ai

import (
	"context"
	"fmt"
	"strconv"
	"strings"

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
	println("DEBUG: [ProcessDocument] Starting - sourceType:", sourceType, "sourceID:", sourceID)

	// Calculate content hash
	contentHash := HashContent(content)
	println("DEBUG: [ProcessDocument] Content hash calculated:", contentHash)

	// Check if document exists and is unchanged
	var existingHash string
	err := s.db.QueryRow(ctx, `
		SELECT content_hash FROM documents
		WHERE source_type = $1 AND source_id = $2
	`, sourceType, sourceID).Scan(&existingHash)

	if err == nil && existingHash == contentHash {
		// Content unchanged, skip processing
		println("DEBUG: [ProcessDocument] Content unchanged, skipping")
		return nil
	}
	println("DEBUG: [ProcessDocument] Content changed or new document")

	// Start transaction
	tx, err := s.db.Begin(ctx)
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback(ctx)
	println("DEBUG: [ProcessDocument] Transaction started")

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
	println("DEBUG: [ProcessDocument] Document upserted, ID:", documentID)

	// Delete old chunks
	_, err = tx.Exec(ctx, `DELETE FROM chunks WHERE document_id = $1`, documentID)
	if err != nil {
		return fmt.Errorf("failed to delete old chunks: %w", err)
	}
	println("DEBUG: [ProcessDocument] Old chunks deleted")

	// Chunk the content
	chunks := ChunkText(content)
	println("DEBUG: [ProcessDocument] Content chunked into", len(chunks), "chunks")
	if len(chunks) == 0 {
		// Empty content, just commit and return
		println("DEBUG: [ProcessDocument] No chunks, committing")
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
		println("DEBUG: [ProcessDocument] Generating embeddings for", len(texts), "chunks")
		embeddings, err = s.embeddingsService.GenerateEmbeddings(ctx, texts)
		if err != nil {
			// Log error but don't fail - we can still store chunks without embeddings
			fmt.Printf("Warning: failed to generate embeddings: %v\n", err)
			embeddings = make([][]float32, len(chunks))
		} else {
			println("DEBUG: [ProcessDocument] Embeddings generated:", len(embeddings))
		}
	} else {
		println("DEBUG: [ProcessDocument] No embeddings service configured")
	}

	// Insert chunks with embeddings
	println("DEBUG: [ProcessDocument] Inserting chunks into database")
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
	println("DEBUG: [ProcessDocument] All chunks inserted")

	err = tx.Commit(ctx)
	if err != nil {
		return fmt.Errorf("failed to commit transaction: %w", err)
	}
	println("DEBUG: [ProcessDocument] Transaction committed successfully")
	return nil
}

// DeleteDocument removes a document and its chunks
func (s *DocumentService) DeleteDocument(ctx context.Context, sourceType, sourceID string) error {
	_, err := s.db.Exec(ctx, `
		DELETE FROM documents WHERE source_type = $1 AND source_id = $2
	`, sourceType, sourceID)
	return err
}

// joinFloats converts []float32 to comma-separated string with full precision
func joinFloats(floats []float32) string {
	if len(floats) == 0 {
		return ""
	}
	// Use strings.Builder for efficient string concatenation
	var builder strings.Builder
	// Use 'g' format with -1 precision to preserve full float32 precision
	builder.WriteString(strconv.FormatFloat(float64(floats[0]), 'g', -1, 32))
	for i := 1; i < len(floats); i++ {
		builder.WriteString(",")
		builder.WriteString(strconv.FormatFloat(float64(floats[i]), 'g', -1, 32))
	}
	return builder.String()
}
