package ai

import (
	"net/http"

	"github.com/labstack/echo/v4"
)

type Handler struct {
	askService     *AskService
	rewriteService *RewriteService
}

func NewHandler(askService *AskService, rewriteService *RewriteService) *Handler {
	return &Handler{
		askService:     askService,
		rewriteService: rewriteService,
	}
}

// Ask godoc
// POST /api/projects/:projectId/ai/ask
func (h *Handler) Ask(c echo.Context) error {
	if h.askService == nil {
		return echo.NewHTTPError(http.StatusServiceUnavailable, "AI services not configured")
	}

	projectID := c.Param("projectId")
	userID := c.Get("user_id").(string)

	var req struct {
		Question   string `json:"question" validate:"required,min=1,max=1000"`
		CanonSafe  bool   `json:"canonSafe"`
		MaxChunks  int    `json:"maxChunks"`
	}

	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request")
	}

	if err := c.Validate(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	// TODO: Verify user owns this project (check projects service)
	_ = userID

	println("DEBUG: Processing AI question for project:", projectID)
	println("DEBUG: Question:", req.Question)
	resp, err := h.askService.Ask(c.Request().Context(), projectID, req.Question, req.CanonSafe, req.MaxChunks)
	if err != nil {
		println("ERROR: Ask service failed:", err.Error())
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to process question: "+err.Error())
	}
	println("DEBUG: Successfully processed question")

	// TODO: Log AI request to database for usage tracking

	return c.JSON(http.StatusOK, resp)
}

// Rewrite godoc
// POST /api/chapters/:id/ai/rewrite
func (h *Handler) Rewrite(c echo.Context) error {
	if h.rewriteService == nil {
		return echo.NewHTTPError(http.StatusServiceUnavailable, "AI services not configured")
	}

	chapterID := c.Param("id")
	userID := c.Get("user_id").(string)

	var req struct {
		Tool        string `json:"tool" validate:"required,oneof=rewrite expand tighten dialogue show_vs_tell summarize"`
		Text        string `json:"text" validate:"required,min=1,max=10000"`
		Instruction string `json:"instruction" validate:"max=500"`
	}

	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request")
	}

	if err := c.Validate(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	// TODO: Verify user owns this chapter
	_ = chapterID
	_ = userID

	rewriteReq := RewriteRequest{
		Tool:        RewriteTool(req.Tool),
		Text:        req.Text,
		Instruction: req.Instruction,
	}

	resp, err := h.rewriteService.Rewrite(c.Request().Context(), rewriteReq)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to process rewrite")
	}

	// TODO: Log AI request to database for usage tracking

	return c.JSON(http.StatusOK, resp)
}
