package ai

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"
)

type Citation struct {
	SourceType string `json:"sourceType"` // "chapter" or "wiki_page"
	SourceID   string `json:"sourceId"`
	ChunkID    string `json:"chunkId"`
	Content    string `json:"content"`
	Similarity float64 `json:"similarity"`
}

type AskResponse struct {
	Answer     string     `json:"answer"`
	Citations  []Citation `json:"citations"`
	TokensIn   int        `json:"tokensIn"`
	TokensOut  int        `json:"tokensOut"`
}

type AskService struct {
	db                *pgxpool.Pool
	retrievalService  *RetrievalService
	chatService       *ChatService
}

func NewAskService(db *pgxpool.Pool, retrievalService *RetrievalService, chatService *ChatService) *AskService {
	return &AskService{
		db:                db,
		retrievalService:  retrievalService,
		chatService:       chatService,
	}
}

// Ask answers a question using RAG
func (s *AskService) Ask(ctx context.Context, projectID, question string, canonSafe bool, maxChunks int) (*AskResponse, error) {
	if s.retrievalService == nil || s.chatService == nil {
		return nil, fmt.Errorf("AI services not configured")
	}

	// Default to 10 chunks if not specified
	if maxChunks == 0 {
		maxChunks = 10
	}

	// 1. Retrieve relevant chunks
	chunks, err := s.retrievalService.Search(ctx, projectID, question, maxChunks)
	if err != nil {
		return nil, fmt.Errorf("failed to retrieve chunks: %w", err)
	}

	if len(chunks) == 0 {
		return &AskResponse{
			Answer:    "No relevant content found in your project to answer this question.",
			Citations: []Citation{},
		}, nil
	}

	// 2. Construct prompt
	systemPrompt := buildSystemPrompt(canonSafe)
	userPrompt := buildUserPrompt(question, chunks)

	messages := []ChatMessage{
		{Role: "system", Content: systemPrompt},
		{Role: "user", Content: userPrompt},
	}

	// 3. Call OpenAI API
	chatResp, err := s.chatService.CreateChatCompletion(ctx, messages, 0.7, 1000)
	if err != nil {
		return nil, fmt.Errorf("failed to call OpenAI: %w", err)
	}

	// 4. Extract answer
	answer := ""
	if len(chatResp.Choices) > 0 {
		answer = chatResp.Choices[0].Message.Content
	}

	// 5. Build citations
	citations := make([]Citation, len(chunks))
	for i, chunk := range chunks {
		citations[i] = Citation{
			SourceType: chunk.SourceType,
			SourceID:   chunk.SourceID,
			ChunkID:    chunk.ChunkID,
			Content:    chunk.Content,
			Similarity: chunk.Similarity,
		}
	}

	return &AskResponse{
		Answer:    answer,
		Citations: citations,
		TokensIn:  chatResp.Usage.PromptTokens,
		TokensOut: chatResp.Usage.CompletionTokens,
	}, nil
}

func buildSystemPrompt(canonSafe bool) string {
	prompt := `You are an AI writing assistant for NovelCraft, a novel writing application.

Your role:
- Help the author answer questions about their novel and wiki
- Preserve canon consistency
- Maintain mystery and ambiguity when appropriate
- Provide clear, concise answers with citations

Writing Rules:
- Maintain character voice and tone
- Preserve subtext and ambiguity
- Do not resolve mysteries early
- Avoid exposition dumps

`

	if canonSafe {
		prompt += `CANON-SAFE MODE: You may ONLY use the retrieved context provided below. Do not infer, invent, or extrapolate beyond what is explicitly stated in the context. If the answer is not in the context, say so.`
	} else {
		prompt += `You may suggest creative ideas and extensions, but clearly flag any new lore additions that are not in the existing text.`
	}

	return prompt
}

func buildUserPrompt(question string, chunks []RetrievedChunk) string {
	prompt := "Retrieved Context:\n---\n\n"

	for i, chunk := range chunks {
		sourceLabel := fmt.Sprintf("Chapter")
		if chunk.SourceType == "wiki_page" {
			sourceLabel = "Wiki Page"
		}

		prompt += fmt.Sprintf("[Source %d - %s ID: %s]\n", i+1, sourceLabel, chunk.SourceID)
		prompt += chunk.Content + "\n\n"
	}

	prompt += "---\n\n"
	prompt += fmt.Sprintf("User Question: %s\n\n", question)
	prompt += "Instructions: Answer the question using the retrieved context above. Reference sources by number (e.g., \"According to Source 1...\")."

	return prompt
}
