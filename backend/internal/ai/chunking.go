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
	println("DEBUG: [ChunkText] Starting - text length:", len(text), "bytes")

	if text == "" {
		println("DEBUG: [ChunkText] Empty text, returning empty chunks")
		return []Chunk{}
	}

	// Normalize whitespace
	println("DEBUG: [ChunkText] Normalizing whitespace...")
	text = strings.TrimSpace(text)
	text = strings.ReplaceAll(text, "\r\n", "\n")

	var chunks []Chunk
	textLen := utf8.RuneCountInString(text)
	println("DEBUG: [ChunkText] Text rune count:", textLen)

	if textLen <= ChunkSize {
		// Text is small enough to be one chunk
		println("DEBUG: [ChunkText] Text fits in one chunk")
		return []Chunk{
			{
				Index:   0,
				Content: text,
				Tokens:  estimateTokens(text),
			},
		}
	}

	println("DEBUG: [ChunkText] Splitting into multiple chunks...")
	start := 0
	index := 0

	for start < textLen {
		println("DEBUG: [ChunkText] Processing chunk", index, "- start position:", start)
		end := start + ChunkSize
		if end > textLen {
			end = textLen
		}

		// Try to break at sentence or paragraph boundary
		println("DEBUG: [ChunkText] Getting substring from", start, "to", end)
		chunkText := getSubstring(text, start, end)

		// If not at the end, try to break at a good point
		if end < textLen {
			println("DEBUG: [ChunkText] Breaking at boundary...")
			chunkText = breakAtBoundary(chunkText)
		}

		// Skip if chunk is too small (unless it's the last one)
		chunkLen := utf8.RuneCountInString(chunkText)
		if chunkLen >= MinChunkSize || end >= textLen {
			println("DEBUG: [ChunkText] Adding chunk", index, "with", chunkLen, "runes")
			chunks = append(chunks, Chunk{
				Index:   index,
				Content: strings.TrimSpace(chunkText),
				Tokens:  estimateTokens(chunkText),
			})
			index++
		} else {
			println("DEBUG: [ChunkText] Skipping chunk (too small):", chunkLen, "runes")
		}

		// Move start forward, accounting for overlap
		actualChunkLen := utf8.RuneCountInString(chunkText)
		advance := actualChunkLen - ChunkOverlap
		if advance < 1 {
			advance = 1 // Ensure we always move forward
		}
		start += advance
		println("DEBUG: [ChunkText] Moving start forward to:", start)
	}

	println("DEBUG: [ChunkText] Completed - total chunks:", len(chunks))
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
