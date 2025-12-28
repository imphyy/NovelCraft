package main

import (
	"context"
	"log"

	"github.com/imphyy/NovelCraft/backend/internal/config"
	"github.com/imphyy/NovelCraft/backend/internal/db"
	"github.com/imphyy/NovelCraft/backend/internal/httpapi"
)

func main() {
	ctx := context.Background()

	// Load config
	cfg := config.Load()

	// Log AI services status
	if cfg.OpenAIAPIKey != "" {
		log.Printf("✓ OpenAI API key configured (AI features enabled)")
	} else {
		log.Printf("✗ OpenAI API key not configured (AI features disabled)")
	}

	// Connect to database
	dbPool, err := db.Connect(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer dbPool.Close()

	// Create server
	server := httpapi.NewServer(dbPool, cfg)

	log.Printf("Starting server on port %s", cfg.Port)
	if err := server.Start(":" + cfg.Port); err != nil {
		log.Fatal(err)
	}
}
