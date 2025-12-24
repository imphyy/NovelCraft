package auth

import (
	"net/http"

	"github.com/labstack/echo/v4"
)

// RequireAuth is middleware that validates the session cookie
func RequireAuth(authService *Service) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			// Get session cookie
			cookie, err := c.Cookie(SessionCookieName)
			if err != nil {
				return echo.NewHTTPError(http.StatusUnauthorized, "authentication required")
			}

			// Validate session
			userID, err := authService.ValidateSession(c.Request().Context(), cookie.Value)
			if err != nil {
				return echo.NewHTTPError(http.StatusUnauthorized, "invalid or expired session")
			}

			// Store user ID in context
			c.Set("user_id", userID)

			return next(c)
		}
	}
}
