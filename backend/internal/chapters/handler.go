package chapters

import (
	"context"
	"net/http"

	"github.com/labstack/echo/v4"
)

// WikiLinkRebuilder interface for rebuilding wiki links
type WikiLinkRebuilder interface {
	RebuildLinksForChapter(ctx context.Context, projectID, chapterID, content string) error
}

// DocumentProcessor interface for processing content for AI
type DocumentProcessor interface {
	ProcessDocument(ctx context.Context, projectID, sourceType, sourceID, content string) error
}

type Handler struct {
	service           *Service
	wikiLinkRebuilder WikiLinkRebuilder
	documentProcessor DocumentProcessor
}

func NewHandler(service *Service, wikiLinkRebuilder WikiLinkRebuilder, documentProcessor DocumentProcessor) *Handler {
	return &Handler{
		service:           service,
		wikiLinkRebuilder: wikiLinkRebuilder,
		documentProcessor: documentProcessor,
	}
}

// ListByProject godoc
// GET /api/projects/:projectId/chapters
func (h *Handler) ListByProject(c echo.Context) error {
	userID := c.Get("user_id").(string)
	projectID := c.Param("projectId")

	chapters, err := h.service.ListByProject(c.Request().Context(), projectID, userID)
	if err != nil {
		if err == ErrUnauthorized {
			return echo.NewHTTPError(http.StatusForbidden, "access denied")
		}
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to list chapters")
	}

	return c.JSON(http.StatusOK, chapters)
}

// Create godoc
// POST /api/projects/:projectId/chapters
func (h *Handler) Create(c echo.Context) error {
	userID := c.Get("user_id").(string)
	projectID := c.Param("projectId")

	var req struct {
		Title string `json:"title" validate:"required,min=1,max=255"`
	}

	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request")
	}

	if err := c.Validate(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	chapter, err := h.service.Create(c.Request().Context(), projectID, userID, req.Title)
	if err != nil {
		if err == ErrUnauthorized {
			return echo.NewHTTPError(http.StatusForbidden, "access denied")
		}
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to create chapter")
	}

	return c.JSON(http.StatusCreated, chapter)
}

// Get godoc
// GET /api/chapters/:id
func (h *Handler) Get(c echo.Context) error {
	userID := c.Get("user_id").(string)
	chapterID := c.Param("id")

	chapter, err := h.service.Get(c.Request().Context(), chapterID, userID)
	if err != nil {
		if err == ErrNotFound {
			return echo.NewHTTPError(http.StatusNotFound, "chapter not found")
		}
		if err == ErrUnauthorized {
			return echo.NewHTTPError(http.StatusForbidden, "access denied")
		}
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to get chapter")
	}

	return c.JSON(http.StatusOK, chapter)
}

// Update godoc
// PATCH /api/chapters/:id
func (h *Handler) Update(c echo.Context) error {
	userID := c.Get("user_id").(string)
	chapterID := c.Param("id")

	var req struct {
		Title   *string `json:"title" validate:"omitempty,min=1,max=255"`
		Status  *string `json:"status" validate:"omitempty,oneof=draft writing revision complete"`
		Content *string `json:"content"`
	}

	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request")
	}

	if err := c.Validate(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	chapter, err := h.service.Update(c.Request().Context(), chapterID, userID, req.Title, req.Status, req.Content)
	if err != nil {
		if err == ErrNotFound {
			return echo.NewHTTPError(http.StatusNotFound, "chapter not found")
		}
		if err == ErrUnauthorized {
			return echo.NewHTTPError(http.StatusForbidden, "access denied")
		}
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to update chapter")
	}

	// Rebuild wiki links if content was updated
	if req.Content != nil && h.wikiLinkRebuilder != nil {
		if err := h.wikiLinkRebuilder.RebuildLinksForChapter(c.Request().Context(), chapter.ProjectID, chapter.ID, chapter.Content); err != nil {
			// Log error but don't fail the request
			// The chapter update succeeded, link rebuild can be retried later
		}
	}

	// Process document for AI (chunk and embed) in background
	if req.Content != nil && h.documentProcessor != nil {
		go func() {
			if err := h.documentProcessor.ProcessDocument(context.Background(), chapter.ProjectID, "chapter", chapter.ID, chapter.Content); err != nil {
				// Log error but don't fail - this is a background operation
				// TODO: Add proper logging
			}
		}()
	}

	return c.JSON(http.StatusOK, chapter)
}

// Reorder godoc
// POST /api/projects/:projectId/chapters/reorder
func (h *Handler) Reorder(c echo.Context) error {
	userID := c.Get("user_id").(string)
	projectID := c.Param("projectId")

	var req struct {
		ChapterIDs []string `json:"chapterIds" validate:"required,min=1"`
	}

	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request")
	}

	if err := c.Validate(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	if err := h.service.Reorder(c.Request().Context(), projectID, userID, req.ChapterIDs); err != nil {
		if err == ErrUnauthorized {
			return echo.NewHTTPError(http.StatusForbidden, "access denied")
		}
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to reorder chapters")
	}

	return c.NoContent(http.StatusNoContent)
}

// CreateRevision godoc
// POST /api/chapters/:id/revisions
func (h *Handler) CreateRevision(c echo.Context) error {
	userID := c.Get("user_id").(string)
	chapterID := c.Param("id")

	var req struct {
		Note string `json:"note" validate:"max=500"`
	}

	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request")
	}

	if err := c.Validate(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	revision, err := h.service.CreateRevision(c.Request().Context(), chapterID, userID, req.Note)
	if err != nil {
		if err == ErrNotFound {
			return echo.NewHTTPError(http.StatusNotFound, "chapter not found")
		}
		if err == ErrUnauthorized {
			return echo.NewHTTPError(http.StatusForbidden, "access denied")
		}
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to create revision")
	}

	return c.JSON(http.StatusCreated, revision)
}

// ListRevisions godoc
// GET /api/chapters/:id/revisions
func (h *Handler) ListRevisions(c echo.Context) error {
	userID := c.Get("user_id").(string)
	chapterID := c.Param("id")

	revisions, err := h.service.ListRevisions(c.Request().Context(), chapterID, userID)
	if err != nil {
		if err == ErrNotFound {
			return echo.NewHTTPError(http.StatusNotFound, "chapter not found")
		}
		if err == ErrUnauthorized {
			return echo.NewHTTPError(http.StatusForbidden, "access denied")
		}
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to list revisions")
	}

	return c.JSON(http.StatusOK, revisions)
}

// GetRevision godoc
// GET /api/revisions/:id
func (h *Handler) GetRevision(c echo.Context) error {
	userID := c.Get("user_id").(string)
	revisionID := c.Param("id")

	revision, err := h.service.GetRevision(c.Request().Context(), revisionID, userID)
	if err != nil {
		return echo.NewHTTPError(http.StatusNotFound, "revision not found")
	}

	return c.JSON(http.StatusOK, revision)
}

// RestoreRevision godoc
// POST /api/revisions/:id/restore
func (h *Handler) RestoreRevision(c echo.Context) error {
	userID := c.Get("user_id").(string)
	revisionID := c.Param("id")

	chapter, err := h.service.RestoreRevision(c.Request().Context(), revisionID, userID)
	if err != nil {
		return echo.NewHTTPError(http.StatusNotFound, "revision not found")
	}

	return c.JSON(http.StatusOK, chapter)
}
