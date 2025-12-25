package ai

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"
)

type RetrievedChunk struct {
	ChunkID     string
	DocumentID  string
	SourceType  string
	SourceID    string
	Content     string
	TokenCount  int
	Similarity  float64
}

type RetrievalService struct {
	db                *pgxpool.Pool
	embeddingsService *EmbeddingsService
}

func NewRetrievalService(db *pgxpool.Pool, embeddingsService *EmbeddingsService) *RetrievalService {
	return &RetrievalService{
		db:                db,
		embeddingsService: embeddingsService,
	}
}

// Search finds the most relevant chunks for a query
func (s *RetrievalService) Search(ctx context.Context, projectID, query string, limit int) ([]RetrievedChunk, error) {
	if s.embeddingsService == nil {
		return nil, fmt.Errorf("embeddings service not configured")
	}

	// Generate embedding for the query
	queryEmbedding, err := s.embeddingsService.GenerateEmbedding(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("failed to generate query embedding: %w", err)
	}

	// Convert embedding to pgvector format
	embeddingStr := fmt.Sprintf("[%v]", joinFloats(queryEmbedding))

	// Search for similar chunks using cosine distance
	rows, err := s.db.Query(ctx, `
		SELECT
			c.id,
			c.document_id,
			d.source_type,
			d.source_id,
			c.content,
			c.token_count,
			1 - (c.embedding <=> $1::vector) as similarity
		FROM chunks c
		JOIN documents d ON c.document_id = d.id
		WHERE c.project_id = $2 AND c.embedding IS NOT NULL
		ORDER BY c.embedding <=> $1::vector
		LIMIT $3
	`, embeddingStr, projectID, limit)
	if err != nil {
		return nil, fmt.Errorf("failed to search chunks: %w", err)
	}
	defer rows.Close()

	var results []RetrievedChunk
	for rows.Next() {
		var chunk RetrievedChunk
		err := rows.Scan(
			&chunk.ChunkID,
			&chunk.DocumentID,
			&chunk.SourceType,
			&chunk.SourceID,
			&chunk.Content,
			&chunk.TokenCount,
			&chunk.Similarity,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan chunk: %w", err)
		}
		results = append(results, chunk)
	}

	return results, nil
}

// GetChunksByDocument retrieves all chunks for a specific document
func (s *RetrievalService) GetChunksByDocument(ctx context.Context, sourceType, sourceID string) ([]RetrievedChunk, error) {
	rows, err := s.db.Query(ctx, `
		SELECT
			c.id,
			c.document_id,
			d.source_type,
			d.source_id,
			c.content,
			c.token_count,
			0.0 as similarity
		FROM chunks c
		JOIN documents d ON c.document_id = d.id
		WHERE d.source_type = $1 AND d.source_id = $2
		ORDER BY c.chunk_index
	`, sourceType, sourceID)
	if err != nil {
		return nil, fmt.Errorf("failed to get chunks: %w", err)
	}
	defer rows.Close()

	var results []RetrievedChunk
	for rows.Next() {
		var chunk RetrievedChunk
		err := rows.Scan(
			&chunk.ChunkID,
			&chunk.DocumentID,
			&chunk.SourceType,
			&chunk.SourceID,
			&chunk.Content,
			&chunk.TokenCount,
			&chunk.Similarity,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan chunk: %w", err)
		}
		results = append(results, chunk)
	}

	return results, nil
}
