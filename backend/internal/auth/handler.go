package auth

import (
	"net/http"
	"time"

	"github.com/imphyy/NovelCraft/backend/internal/apierrors"
	"github.com/imphyy/NovelCraft/backend/internal/config"
	"github.com/labstack/echo/v4"
)

type Handler struct {
	service *Service
	config  *config.Config
}

func NewHandler(service *Service, cfg *config.Config) *Handler {
	return &Handler{
		service: service,
		config:  cfg,
	}
}

type RegisterRequest struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required,min=8"`
}

type LoginRequest struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required"`
}

// Register godoc
func (h *Handler) Register(c echo.Context) error {
	var req RegisterRequest
	if err := c.Bind(&req); err != nil {
		return apierrors.BadRequest(c, "Invalid request body", nil)
	}

	if err := c.Validate(req); err != nil {
		return apierrors.ValidationFailed(c, "Validation failed", map[string]interface{}{
			"validation_errors": err.Error(),
		})
	}

	userID, err := h.service.Register(c.Request().Context(), req.Email, req.Password)
	if err != nil {
		if err == ErrUserExists {
			return apierrors.Conflict(c, "Email already exists", map[string]interface{}{
				"field": "email",
			})
		}
		return apierrors.InternalServerError(c, "Failed to register user")
	}

	// Auto-login after registration
	token, err := h.service.Login(c.Request().Context(), req.Email, req.Password)
	if err != nil {
		return apierrors.InternalServerError(c, "Failed to create session")
	}

	// Set cookie
	h.setSessionCookie(c, token)

	// Get user info
	user, err := h.service.GetUserByID(c.Request().Context(), userID)
	if err != nil {
		return apierrors.InternalServerError(c, "Failed to get user")
	}

	return c.JSON(http.StatusCreated, map[string]interface{}{
		"user": user,
	})
}

// Login godoc
func (h *Handler) Login(c echo.Context) error {
	var req LoginRequest
	if err := c.Bind(&req); err != nil {
		return apierrors.BadRequest(c, "Invalid request body", nil)
	}

	if err := c.Validate(req); err != nil {
		return apierrors.ValidationFailed(c, "Validation failed", map[string]interface{}{
			"validation_errors": err.Error(),
		})
	}

	token, err := h.service.Login(c.Request().Context(), req.Email, req.Password)
	if err != nil {
		if err == ErrInvalidCredentials {
			return apierrors.Unauthorized(c, "Invalid email or password")
		}
		return apierrors.InternalServerError(c, "Failed to login")
	}

	// Set cookie
	h.setSessionCookie(c, token)

	// Get user info
	userID, _ := h.service.ValidateSession(c.Request().Context(), token)
	user, err := h.service.GetUserByID(c.Request().Context(), userID)
	if err != nil {
		return apierrors.InternalServerError(c, "Failed to get user")
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"user": user,
	})
}

// Logout godoc
func (h *Handler) Logout(c echo.Context) error {
	token, err := c.Cookie(SessionCookieName)
	if err != nil {
		return c.JSON(http.StatusOK, map[string]bool{"ok": true})
	}

	if err := h.service.Logout(c.Request().Context(), token.Value); err != nil {
		// Log error but still clear cookie
		c.Logger().Error(err)
	}

	// Clear cookie
	h.clearSessionCookie(c)

	return c.JSON(http.StatusOK, map[string]bool{"ok": true})
}

// Me godoc
func (h *Handler) Me(c echo.Context) error {
	userID := c.Get("user_id").(string)

	user, err := h.service.GetUserByID(c.Request().Context(), userID)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to get user")
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"user": user,
	})
}

func (h *Handler) setSessionCookie(c echo.Context, token string) {
	sameSite := http.SameSiteLaxMode
	switch h.config.CookieSameSite {
	case "Strict":
		sameSite = http.SameSiteStrictMode
	case "None":
		sameSite = http.SameSiteNoneMode
	default:
		sameSite = http.SameSiteLaxMode
	}

	cookie := &http.Cookie{
		Name:     SessionCookieName,
		Value:    token,
		Path:     "/",
		Expires:  time.Now().Add(SessionDuration),
		HttpOnly: true,
		Secure:   h.config.CookieSecure,
		SameSite: sameSite,
	}
	if h.config.CookieDomain != "" {
		cookie.Domain = h.config.CookieDomain
	}
	c.SetCookie(cookie)
}

func (h *Handler) clearSessionCookie(c echo.Context) {
	sameSite := http.SameSiteLaxMode
	switch h.config.CookieSameSite {
	case "Strict":
		sameSite = http.SameSiteStrictMode
	case "None":
		sameSite = http.SameSiteNoneMode
	default:
		sameSite = http.SameSiteLaxMode
	}

	cookie := &http.Cookie{
		Name:     SessionCookieName,
		Value:    "",
		Path:     "/",
		MaxAge:   -1,
		HttpOnly: true,
		Secure:   h.config.CookieSecure,
		SameSite: sameSite,
	}
	if h.config.CookieDomain != "" {
		cookie.Domain = h.config.CookieDomain
	}
	c.SetCookie(cookie)
}
