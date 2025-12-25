package config

import "os"

type Config struct {
	DatabaseURL string
	Port        string
	OpenAIAPIKey string
}

func Load() *Config {
	return &Config{
		DatabaseURL: getEnv("DATABASE_URL", "postgres://novelcraft:novelcraft@localhost:5432/novelcraft?sslmode=disable"),
		Port:        getEnv("PORT", "8080"),
		OpenAIAPIKey: getEnv("OPENAI_API_KEY", ""),
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
