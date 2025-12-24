package httpapi

import (
	"net/http"

	"github.com/labstack/echo/v4"

	"github.com/imphyy/NovelCraft/backend/internal/auth"
)

func setupRoutes(e *echo.Echo, authHandler *auth.Handler, authService *auth.Service) {
	// API group
	api := e.Group("/api")

	// Health check
	api.GET("/health", healthHandler)

	// Auth routes (public)
	authGroup := api.Group("/auth")
	authGroup.POST("/register", authHandler.Register)
	authGroup.POST("/login", authHandler.Login)
	authGroup.POST("/logout", authHandler.Logout)

	// Auth routes (protected)
	authGroup.GET("/me", authHandler.Me, auth.RequireAuth(authService))
}

func healthHandler(c echo.Context) error {
	return c.JSON(http.StatusOK, map[string]string{
		"status": "ok",
	})
}
