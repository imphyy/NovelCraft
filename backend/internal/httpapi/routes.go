package httpapi

import (
	"net/http"

	"github.com/labstack/echo/v4"

	"github.com/imphyy/NovelCraft/backend/internal/auth"
	"github.com/imphyy/NovelCraft/backend/internal/chapters"
	"github.com/imphyy/NovelCraft/backend/internal/projects"
)

func setupRoutes(e *echo.Echo, authHandler *auth.Handler, authService *auth.Service, projectsHandler *projects.Handler, chaptersHandler *chapters.Handler) {
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

	// Projects routes (all protected)
	projectsGroup := api.Group("/projects", auth.RequireAuth(authService))
	projectsGroup.GET("", projectsHandler.List)
	projectsGroup.POST("", projectsHandler.Create)
	projectsGroup.GET("/:id", projectsHandler.Get)
	projectsGroup.PATCH("/:id", projectsHandler.Update)
	projectsGroup.DELETE("/:id", projectsHandler.Delete)

	// Chapters routes nested under projects (all protected)
	projectsGroup.GET("/:projectId/chapters", chaptersHandler.ListByProject)
	projectsGroup.POST("/:projectId/chapters", chaptersHandler.Create)
	projectsGroup.POST("/:projectId/chapters/reorder", chaptersHandler.Reorder)

	// Chapters routes (all protected)
	chaptersGroup := api.Group("/chapters", auth.RequireAuth(authService))
	chaptersGroup.GET("/:id", chaptersHandler.Get)
	chaptersGroup.PATCH("/:id", chaptersHandler.Update)
	chaptersGroup.POST("/:id/revisions", chaptersHandler.CreateRevision)
	chaptersGroup.GET("/:id/revisions", chaptersHandler.ListRevisions)

	// Revisions routes (all protected)
	revisionsGroup := api.Group("/revisions", auth.RequireAuth(authService))
	revisionsGroup.GET("/:id", chaptersHandler.GetRevision)
	revisionsGroup.POST("/:id/restore", chaptersHandler.RestoreRevision)
}

func healthHandler(c echo.Context) error {
	return c.JSON(http.StatusOK, map[string]string{
		"status": "ok",
	})
}
