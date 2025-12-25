package ai

import (
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestChunkText_SmallText(t *testing.T) {
	text := "This is a small text that fits in one chunk."

	chunks := ChunkText(text)

	assert.Len(t, chunks, 1)
	assert.Equal(t, text, chunks[0].Content)
	assert.Equal(t, 0, chunks[0].Index)
	assert.Greater(t, chunks[0].Tokens, 0)
}

func TestChunkText_LargeText(t *testing.T) {
	// Create text larger than ChunkSize
	paragraph := strings.Repeat("This is a test sentence. ", 100)
	text := strings.Repeat(paragraph+"\n\n", 3)

	chunks := ChunkText(text)

	assert.Greater(t, len(chunks), 1, "Large text should be split into multiple chunks")

	// Verify chunks have sequential indices
	for i, chunk := range chunks {
		assert.Equal(t, i, chunk.Index)
		assert.Greater(t, chunk.Tokens, 0)
		assert.NotEmpty(t, chunk.Content)
	}
}

func TestChunkText_EmptyText(t *testing.T) {
	chunks := ChunkText("")
	assert.Len(t, chunks, 0)
}

func TestChunkText_WhitespaceOnly(t *testing.T) {
	chunks := ChunkText("   \n\n\t  ")
	assert.Len(t, chunks, 0)
}

func TestHashContent(t *testing.T) {
	text1 := "This is some content"
	text2 := "This is some content"
	text3 := "This is different content"

	hash1 := HashContent(text1)
	hash2 := HashContent(text2)
	hash3 := HashContent(text3)

	// Same content should produce same hash
	assert.Equal(t, hash1, hash2)

	// Different content should produce different hash
	assert.NotEqual(t, hash1, hash3)

	// Hash should be hex string
	assert.Len(t, hash1, 64) // SHA256 = 32 bytes = 64 hex chars
}
