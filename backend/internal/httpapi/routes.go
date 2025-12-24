package httpapi

import (
	"net/http"

	"github.com/labstack/echo/v4"
)

func setupRoutes(e *echo.Echo) {
	// API group
	api := e.Group("/api")

	// Health check
	api.GET("/health", healthHandler)
}

func healthHandler(c echo.Context) error {
	return c.JSON(http.StatusOK, map[string]string{
		"status": "ok",
	})
}
