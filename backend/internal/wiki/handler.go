package wiki

import (
	"net/http"

	"github.com/labstack/echo/v4"
)

type Handler struct {
	service *Service
}

func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

// ListByProject godoc
// GET /api/projects/:projectId/wiki
func (h *Handler) ListByProject(c echo.Context) error {
	userID := c.Get("user_id").(string)
	projectID := c.Param("projectId")

	pages, err := h.service.ListByProject(c.Request().Context(), projectID, userID)
	if err != nil {
		if err == ErrUnauthorized {
			return echo.NewHTTPError(http.StatusForbidden, "access denied")
		}
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to list wiki pages")
	}

	return c.JSON(http.StatusOK, pages)
}

// Create godoc
// POST /api/projects/:projectId/wiki
func (h *Handler) Create(c echo.Context) error {
	userID := c.Get("user_id").(string)
	projectID := c.Param("projectId")

	var req struct {
		Title    string `json:"title" validate:"required,min=1,max=255"`
		PageType string `json:"pageType" validate:"required,oneof=character location event concept item faction"`
	}

	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request")
	}

	if err := c.Validate(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	page, err := h.service.Create(c.Request().Context(), projectID, userID, req.Title, req.PageType)
	if err != nil {
		if err == ErrUnauthorized {
			return echo.NewHTTPError(http.StatusForbidden, "access denied")
		}
		if err == ErrSlugTaken {
			return echo.NewHTTPError(http.StatusConflict, "a page with this title already exists")
		}
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to create wiki page")
	}

	return c.JSON(http.StatusCreated, page)
}

// Get godoc
// GET /api/wiki/:id
func (h *Handler) Get(c echo.Context) error {
	userID := c.Get("user_id").(string)
	pageID := c.Param("id")

	page, err := h.service.Get(c.Request().Context(), pageID, userID)
	if err != nil {
		if err == ErrNotFound {
			return echo.NewHTTPError(http.StatusNotFound, "wiki page not found")
		}
		if err == ErrUnauthorized {
			return echo.NewHTTPError(http.StatusForbidden, "access denied")
		}
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to get wiki page")
	}

	return c.JSON(http.StatusOK, page)
}

// GetBySlug godoc
// GET /api/projects/:projectId/wiki/by-slug/:slug
func (h *Handler) GetBySlug(c echo.Context) error {
	userID := c.Get("user_id").(string)
	projectID := c.Param("projectId")
	slug := c.Param("slug")

	page, err := h.service.GetBySlug(c.Request().Context(), projectID, slug, userID)
	if err != nil {
		if err == ErrNotFound {
			return echo.NewHTTPError(http.StatusNotFound, "wiki page not found")
		}
		if err == ErrUnauthorized {
			return echo.NewHTTPError(http.StatusForbidden, "access denied")
		}
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to get wiki page")
	}

	return c.JSON(http.StatusOK, page)
}

// Update godoc
// PATCH /api/wiki/:id
func (h *Handler) Update(c echo.Context) error {
	userID := c.Get("user_id").(string)
	pageID := c.Param("id")

	var req struct {
		Title   *string `json:"title" validate:"omitempty,min=1,max=255"`
		Content *string `json:"content"`
	}

	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request")
	}

	if err := c.Validate(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	page, err := h.service.Update(c.Request().Context(), pageID, userID, req.Title, req.Content)
	if err != nil {
		if err == ErrNotFound {
			return echo.NewHTTPError(http.StatusNotFound, "wiki page not found")
		}
		if err == ErrUnauthorized {
			return echo.NewHTTPError(http.StatusForbidden, "access denied")
		}
		if err == ErrSlugTaken {
			return echo.NewHTTPError(http.StatusConflict, "a page with this title already exists")
		}
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to update wiki page")
	}

	return c.JSON(http.StatusOK, page)
}

// Delete godoc
// DELETE /api/wiki/:id
func (h *Handler) Delete(c echo.Context) error {
	userID := c.Get("user_id").(string)
	pageID := c.Param("id")

	if err := h.service.Delete(c.Request().Context(), pageID, userID); err != nil {
		if err == ErrNotFound {
			return echo.NewHTTPError(http.StatusNotFound, "wiki page not found")
		}
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to delete wiki page")
	}

	return c.NoContent(http.StatusNoContent)
}

// AddTag godoc
// POST /api/wiki/:id/tags
func (h *Handler) AddTag(c echo.Context) error {
	userID := c.Get("user_id").(string)
	pageID := c.Param("id")

	var req struct {
		Tag string `json:"tag" validate:"required,min=1,max=50"`
	}

	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request")
	}

	if err := c.Validate(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	if err := h.service.AddTag(c.Request().Context(), pageID, req.Tag, userID); err != nil {
		if err == ErrNotFound {
			return echo.NewHTTPError(http.StatusNotFound, "wiki page not found")
		}
		if err == ErrUnauthorized {
			return echo.NewHTTPError(http.StatusForbidden, "access denied")
		}
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to add tag")
	}

	return c.NoContent(http.StatusNoContent)
}

// RemoveTag godoc
// DELETE /api/wiki/:id/tags/:tag
func (h *Handler) RemoveTag(c echo.Context) error {
	userID := c.Get("user_id").(string)
	pageID := c.Param("id")
	tag := c.Param("tag")

	if err := h.service.RemoveTag(c.Request().Context(), pageID, tag, userID); err != nil {
		if err == ErrNotFound {
			return echo.NewHTTPError(http.StatusNotFound, "wiki page not found")
		}
		if err == ErrUnauthorized {
			return echo.NewHTTPError(http.StatusForbidden, "access denied")
		}
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to remove tag")
	}

	return c.NoContent(http.StatusNoContent)
}

// RebuildLinks godoc
// POST /api/projects/:projectId/wiki/rebuild-links
func (h *Handler) RebuildLinks(c echo.Context) error {
	userID := c.Get("user_id").(string)
	projectID := c.Param("projectId")

	// Get all wiki pages for this project
	pages, err := h.service.ListByProject(c.Request().Context(), projectID, userID)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to list wiki pages")
	}

	// Rebuild links for each page
	for _, page := range pages {
		if err := h.service.RebuildLinksForPage(c.Request().Context(), projectID, page.ID, page.Content); err != nil {
			return echo.NewHTTPError(http.StatusInternalServerError, "failed to rebuild links")
		}
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"message":     "links rebuilt successfully",
		"pagesProcessed": len(pages),
	})
}

// GetBacklinks godoc
// GET /api/wiki/:id/backlinks
func (h *Handler) GetBacklinks(c echo.Context) error {
	userID := c.Get("user_id").(string)
	pageID := c.Param("id")

	backlinks, err := h.service.GetBacklinks(c.Request().Context(), pageID, userID)
	if err != nil {
		if err == ErrNotFound {
			return echo.NewHTTPError(http.StatusNotFound, "wiki page not found")
		}
		if err == ErrUnauthorized {
			return echo.NewHTTPError(http.StatusForbidden, "access denied")
		}
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to get backlinks")
	}

	return c.JSON(http.StatusOK, backlinks)
}

// GetMentions godoc
// GET /api/wiki/:id/mentions
func (h *Handler) GetMentions(c echo.Context) error {
	userID := c.Get("user_id").(string)
	pageID := c.Param("id")

	mentions, err := h.service.GetMentions(c.Request().Context(), pageID, userID)
	if err != nil {
		if err == ErrNotFound {
			return echo.NewHTTPError(http.StatusNotFound, "wiki page not found")
		}
		if err == ErrUnauthorized {
			return echo.NewHTTPError(http.StatusForbidden, "access denied")
		}
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to get mentions")
	}

	return c.JSON(http.StatusOK, mentions)
}
