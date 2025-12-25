package httpapi

import (
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"

	"github.com/imphyy/NovelCraft/backend/internal/auth"
	"github.com/imphyy/NovelCraft/backend/internal/chapters"
	"github.com/imphyy/NovelCraft/backend/internal/projects"
	"github.com/imphyy/NovelCraft/backend/internal/search"
	"github.com/imphyy/NovelCraft/backend/internal/wiki"
)

func NewServer(db *pgxpool.Pool) *echo.Echo {
	e := echo.New()

	// Validator
	e.Validator = NewValidator()

	// Middleware
	e.Use(middleware.Recover())
	e.Use(middleware.RequestID())
	e.Use(middleware.Gzip())
	e.Use(middleware.Secure())
	e.Use(middleware.BodyLimit("2M"))

	// CORS for development
	e.Use(middleware.CORSWithConfig(middleware.CORSConfig{
		AllowOrigins:     []string{"http://localhost:5173"},
		AllowCredentials: true,
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Content-Type", "Authorization"},
	}))

	// Services
	authService := auth.NewService(db)
	authHandler := auth.NewHandler(authService)

	projectsService := projects.NewService(db)
	projectsHandler := projects.NewHandler(projectsService)

	wikiService := wiki.NewService(db)
	wikiHandler := wiki.NewHandler(wikiService)

	chaptersService := chapters.NewService(db)
	chaptersHandler := chapters.NewHandler(chaptersService, wikiService)

	searchService := search.NewService(db)
	searchHandler := search.NewHandler(searchService)

	// Routes
	setupRoutes(e, authHandler, authService, projectsHandler, chaptersHandler, wikiHandler, searchHandler)

	return e
}
