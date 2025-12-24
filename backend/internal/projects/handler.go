package projects

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

type CreateRequest struct {
	Name        string `json:"name" validate:"required"`
	Description string `json:"description"`
}

type UpdateRequest struct {
	Name        string `json:"name" validate:"required"`
	Description string `json:"description"`
}

// List returns all projects for the authenticated user
func (h *Handler) List(c echo.Context) error {
	userID := c.Get("user_id").(string)

	projects, err := h.service.List(c.Request().Context(), userID)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to list projects")
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"projects": projects,
	})
}

// Create creates a new project
func (h *Handler) Create(c echo.Context) error {
	userID := c.Get("user_id").(string)

	var req CreateRequest
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request")
	}

	if err := c.Validate(req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	project, err := h.service.Create(c.Request().Context(), userID, req.Name, req.Description)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to create project")
	}

	return c.JSON(http.StatusCreated, map[string]interface{}{
		"project": project,
	})
}

// Get returns a single project
func (h *Handler) Get(c echo.Context) error {
	userID := c.Get("user_id").(string)
	projectID := c.Param("id")

	project, err := h.service.Get(c.Request().Context(), projectID, userID)
	if err != nil {
		if err == ErrNotFound {
			return echo.NewHTTPError(http.StatusNotFound, "project not found")
		}
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to get project")
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"project": project,
	})
}

// Update updates a project
func (h *Handler) Update(c echo.Context) error {
	userID := c.Get("user_id").(string)
	projectID := c.Param("id")

	var req UpdateRequest
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request")
	}

	if err := c.Validate(req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	project, err := h.service.Update(c.Request().Context(), projectID, userID, req.Name, req.Description)
	if err != nil {
		if err == ErrNotFound {
			return echo.NewHTTPError(http.StatusNotFound, "project not found")
		}
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to update project")
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"project": project,
	})
}

// Delete deletes a project
func (h *Handler) Delete(c echo.Context) error {
	userID := c.Get("user_id").(string)
	projectID := c.Param("id")

	err := h.service.Delete(c.Request().Context(), projectID, userID)
	if err != nil {
		if err == ErrNotFound {
			return echo.NewHTTPError(http.StatusNotFound, "project not found")
		}
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to delete project")
	}

	return c.NoContent(http.StatusNoContent)
}
