package search

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

// Search godoc
// GET /api/projects/:projectId/search?q=query
func (h *Handler) Search(c echo.Context) error {
	userID := c.Get("user_id").(string)
	projectID := c.Param("projectId")
	query := c.QueryParam("q")

	results, err := h.service.Search(c.Request().Context(), projectID, userID, query)
	if err != nil {
		if err == ErrUnauthorized {
			return echo.NewHTTPError(http.StatusForbidden, "access denied")
		}
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to search")
	}

	return c.JSON(http.StatusOK, results)
}
