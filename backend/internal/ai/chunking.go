package ai

import (
	"crypto/sha256"
	"encoding/hex"
	"strings"
	"unicode/utf8"
)

const (
	// Target chunk size in characters (roughly 150-300 tokens)
	ChunkSize       = 1000
	ChunkOverlap    = 200
	MinChunkSize    = 100
)

type Chunk struct {
	Index   int
	Content string
	Tokens  int
}

// ChunkText splits text into overlapping chunks
func ChunkText(text string) []Chunk {
	if text == "" {
		return []Chunk{}
	}

	// Normalize whitespace
	text = strings.TrimSpace(text)
	text = strings.ReplaceAll(text, "\r\n", "\n")

	var chunks []Chunk
	textLen := utf8.RuneCountInString(text)

	if textLen <= ChunkSize {
		// Text is small enough to be one chunk
		return []Chunk{
			{
				Index:   0,
				Content: text,
				Tokens:  estimateTokens(text),
			},
		}
	}

	start := 0
	index := 0

	for start < textLen {
		end := start + ChunkSize
		if end > textLen {
			end = textLen
		}

		// Try to break at sentence or paragraph boundary
		chunkText := getSubstring(text, start, end)

		// If not at the end, try to break at a good point
		if end < textLen {
			chunkText = breakAtBoundary(chunkText)
		}

		// Skip if chunk is too small (unless it's the last one)
		if utf8.RuneCountInString(chunkText) >= MinChunkSize || end >= textLen {
			chunks = append(chunks, Chunk{
				Index:   index,
				Content: strings.TrimSpace(chunkText),
				Tokens:  estimateTokens(chunkText),
			})
			index++
		}

		// Move start forward, accounting for overlap
		actualChunkLen := utf8.RuneCountInString(chunkText)
		start += actualChunkLen - ChunkOverlap
	}

	return chunks
}

// getSubstring safely gets a substring by rune count
func getSubstring(text string, start, end int) string {
	runes := []rune(text)
	if start >= len(runes) {
		return ""
	}
	if end > len(runes) {
		end = len(runes)
	}
	return string(runes[start:end])
}

// breakAtBoundary attempts to break the chunk at a sentence or paragraph
func breakAtBoundary(text string) string {
	// Try to break at paragraph
	if idx := strings.LastIndex(text, "\n\n"); idx > len(text)/2 {
		return text[:idx]
	}

	// Try to break at sentence
	for _, delim := range []string{". ", "! ", "? ", ".\n", "!\n", "?\n"} {
		if idx := strings.LastIndex(text, delim); idx > len(text)/2 {
			return text[:idx+1]
		}
	}

	// Try to break at newline
	if idx := strings.LastIndex(text, "\n"); idx > len(text)/2 {
		return text[:idx]
	}

	// No good break point, return as is
	return text
}

// estimateTokens roughly estimates token count (1 token ≈ 4 characters)
func estimateTokens(text string) int {
	return len(text) / 4
}

// HashContent creates a SHA256 hash of content for change detection
func HashContent(content string) string {
	hash := sha256.Sum256([]byte(content))
	return hex.EncodeToString(hash[:])
}
