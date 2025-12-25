package httpapi

import (
	"net/http"

	"github.com/labstack/echo/v4"

	"github.com/imphyy/NovelCraft/backend/internal/ai"
	"github.com/imphyy/NovelCraft/backend/internal/auth"
	"github.com/imphyy/NovelCraft/backend/internal/chapters"
	"github.com/imphyy/NovelCraft/backend/internal/projects"
	"github.com/imphyy/NovelCraft/backend/internal/search"
	"github.com/imphyy/NovelCraft/backend/internal/wiki"
)

func setupRoutes(e *echo.Echo, authHandler *auth.Handler, authService *auth.Service, projectsHandler *projects.Handler, chaptersHandler *chapters.Handler, wikiHandler *wiki.Handler, searchHandler *search.Handler, aiHandler *ai.Handler) {
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

	// Wiki routes nested under projects (all protected)
	projectsGroup.GET("/:projectId/wiki", wikiHandler.ListByProject)
	projectsGroup.POST("/:projectId/wiki", wikiHandler.Create)
	projectsGroup.GET("/:projectId/wiki/by-slug/:slug", wikiHandler.GetBySlug)
	projectsGroup.POST("/:projectId/wiki/rebuild-links", wikiHandler.RebuildLinks)

	// Wiki routes (all protected)
	wikiGroup := api.Group("/wiki", auth.RequireAuth(authService))
	wikiGroup.GET("/:id", wikiHandler.Get)
	wikiGroup.PATCH("/:id", wikiHandler.Update)
	wikiGroup.DELETE("/:id", wikiHandler.Delete)
	wikiGroup.POST("/:id/tags", wikiHandler.AddTag)
	wikiGroup.DELETE("/:id/tags/:tag", wikiHandler.RemoveTag)
	wikiGroup.GET("/:id/backlinks", wikiHandler.GetBacklinks)
	wikiGroup.GET("/:id/mentions", wikiHandler.GetMentions)

	// Search routes (all protected)
	projectsGroup.GET("/:projectId/search", searchHandler.Search)

	// AI routes (all protected, optional - only if AI services configured)
	if aiHandler != nil {
		projectsGroup.POST("/:projectId/ai/ask", aiHandler.Ask)
		chaptersGroup.POST("/:id/ai/rewrite", aiHandler.Rewrite)
	}
}

func healthHandler(c echo.Context) error {
	return c.JSON(http.StatusOK, map[string]string{
		"status": "ok",
	})
}
