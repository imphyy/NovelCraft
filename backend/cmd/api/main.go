package main

import (
	"log"
	"os"

	"github.com/imphyy/NovelCraft/backend/internal/httpapi"
)

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	server := httpapi.NewServer()

	log.Printf("Starting server on port %s", port)
	if err := server.Start(":" + port); err != nil {
		log.Fatal(err)
	}
}
