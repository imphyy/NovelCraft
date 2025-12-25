package ai

import (
	"context"
	"fmt"
)

type RewriteTool string

const (
	RewriteToolRewrite      RewriteTool = "rewrite"
	RewriteToolExpand       RewriteTool = "expand"
	RewriteToolTighten      RewriteTool = "tighten"
	RewriteToolDialogue     RewriteTool = "dialogue"
	RewriteToolShowVsTell   RewriteTool = "show_vs_tell"
	RewriteToolSummarize    RewriteTool = "summarize"
)

type RewriteRequest struct {
	Tool        RewriteTool `json:"tool"`
	Text        string      `json:"text"`
	Instruction string      `json:"instruction,omitempty"` // Optional user instruction
}

type RewriteResponse struct {
	OriginalText string `json:"originalText"`
	RewrittenText string `json:"rewrittenText"`
	TokensIn     int    `json:"tokensIn"`
	TokensOut    int    `json:"tokensOut"`
}

type RewriteService struct {
	chatService *ChatService
}

func NewRewriteService(chatService *ChatService) *RewriteService {
	return &RewriteService{
		chatService: chatService,
	}
}

// Rewrite applies an AI writing tool to the given text
func (s *RewriteService) Rewrite(ctx context.Context, req RewriteRequest) (*RewriteResponse, error) {
	if s.chatService == nil {
		return nil, fmt.Errorf("AI services not configured")
	}

	systemPrompt := buildRewriteSystemPrompt(req.Tool)
	userPrompt := buildRewriteUserPrompt(req.Tool, req.Text, req.Instruction)

	messages := []ChatMessage{
		{Role: "system", Content: systemPrompt},
		{Role: "user", Content: userPrompt},
	}

	// Use lower temperature for more consistent rewrites
	temperature := 0.5
	if req.Tool == RewriteToolDialogue {
		temperature = 0.8 // More creativity for dialogue variants
	}

	chatResp, err := s.chatService.CreateChatCompletion(ctx, messages, temperature, 2000)
	if err != nil {
		return nil, fmt.Errorf("failed to call OpenAI: %w", err)
	}

	rewrittenText := ""
	if len(chatResp.Choices) > 0 {
		rewrittenText = chatResp.Choices[0].Message.Content
	}

	return &RewriteResponse{
		OriginalText:  req.Text,
		RewrittenText: rewrittenText,
		TokensIn:      chatResp.Usage.PromptTokens,
		TokensOut:     chatResp.Usage.CompletionTokens,
	}, nil
}

func buildRewriteSystemPrompt(tool RewriteTool) string {
	base := `You are an AI writing assistant for NovelCraft, a novel writing application.

Your task is to help the author improve their prose using the requested tool.

General rules:
- Preserve the author's voice and style
- Maintain consistency with the existing tone
- Make targeted improvements without over-editing
- Return ONLY the rewritten text, no explanations or commentary

`

	switch tool {
	case RewriteToolRewrite:
		return base + `Tool: REWRITE
Task: Adjust the tone, voice, or style of the text according to the user's instruction. Preserve the core meaning and events.`

	case RewriteToolExpand:
		return base + `Tool: EXPAND
Task: Add detail, sensory description, internal monologue, or emotional depth to the text. Make the scene more vivid and immersive.`

	case RewriteToolTighten:
		return base + `Tool: TIGHTEN
Task: Remove redundancy, sharpen prose, and make the text more concise. Cut unnecessary words while preserving meaning and impact.`

	case RewriteToolDialogue:
		return base + `Tool: DIALOGUE VARIANTS
Task: Generate 2-3 alternative ways the character could say the same thing, each with a different tone or subtext. Format each variant on a new line, prefixed with "Option 1:", "Option 2:", etc.`

	case RewriteToolShowVsTell:
		return base + `Tool: SHOW VS TELL
Task: Convert exposition or telling into a scene that shows the same information through action, dialogue, or sensory detail.`

	case RewriteToolSummarize:
		return base + `Tool: SUMMARIZE
Task: Generate a concise summary of the text. Focus on key events, character actions, and plot developments.`

	default:
		return base + `Tool: REWRITE
Task: Improve the text according to the user's instruction.`
	}
}

func buildRewriteUserPrompt(tool RewriteTool, text string, instruction string) string {
	prompt := "Original Text:\n---\n" + text + "\n---\n\n"

	if instruction != "" {
		prompt += fmt.Sprintf("User Instruction: %s\n\n", instruction)
	}

	switch tool {
	case RewriteToolRewrite:
		if instruction == "" {
			prompt += "Please rewrite this text to improve clarity, flow, and impact."
		} else {
			prompt += "Please rewrite this text according to the instruction above."
		}

	case RewriteToolExpand:
		prompt += "Please expand this text with more detail, sensory description, and emotional depth."

	case RewriteToolTighten:
		prompt += "Please tighten this text by removing redundancy and sharpening the prose."

	case RewriteToolDialogue:
		prompt += "Please generate 2-3 alternative ways this dialogue could be written, each with a different tone or subtext."

	case RewriteToolShowVsTell:
		prompt += "Please convert this text from 'telling' to 'showing' through action, dialogue, or sensory detail."

	case RewriteToolSummarize:
		prompt += "Please summarize this text concisely, focusing on key events and developments."
	}

	return prompt
}
