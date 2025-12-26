package config

import (
	"os"
	"strconv"
)

type Config struct {
	DatabaseURL    string
	Port           string
	OpenAIAPIKey   string
	OpenAIChatModel string
	OpenAIEmbedModel string
	CORSOrigin     string
	CookieSecure   bool
	CookieSameSite string
	CookieDomain   string
}

func Load() *Config {
	return &Config{
		DatabaseURL:      getEnv("DATABASE_URL", "postgres://novelcraft:novelcraft@localhost:5432/novelcraft?sslmode=disable"),
		Port:             getEnv("PORT", "8080"),
		OpenAIAPIKey:     getEnv("OPENAI_API_KEY", ""),
		OpenAIChatModel:  getEnv("OPENAI_CHAT_MODEL", "gpt-4o"),
		OpenAIEmbedModel: getEnv("OPENAI_EMBED_MODEL", "text-embedding-3-small"),
		CORSOrigin:       getEnv("CORS_ORIGIN", "http://localhost:5173"),
		CookieSecure:     getEnvBool("COOKIE_SECURE", false),
		CookieSameSite:   getEnv("COOKIE_SAMESITE", "Lax"),
		CookieDomain:     getEnv("COOKIE_DOMAIN", ""),
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getEnvBool(key string, defaultValue bool) bool {
	if value := os.Getenv(key); value != "" {
		parsed, err := strconv.ParseBool(value)
		if err == nil {
			return parsed
		}
	}
	return defaultValue
}
