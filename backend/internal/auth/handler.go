package auth

import (
	"net/http"
	"time"

	"github.com/labstack/echo/v4"
)

type Handler struct {
	service *Service
}

func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
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
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request")
	}

	if err := c.Validate(req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	userID, err := h.service.Register(c.Request().Context(), req.Email, req.Password)
	if err != nil {
		if err == ErrUserExists {
			return echo.NewHTTPError(http.StatusConflict, "email already exists")
		}
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to register user")
	}

	// Auto-login after registration
	token, err := h.service.Login(c.Request().Context(), req.Email, req.Password)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to create session")
	}

	// Set cookie
	setSessionCookie(c, token)

	// Get user info
	user, err := h.service.GetUserByID(c.Request().Context(), userID)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to get user")
	}

	return c.JSON(http.StatusCreated, map[string]interface{}{
		"user": user,
	})
}

// Login godoc
func (h *Handler) Login(c echo.Context) error {
	var req LoginRequest
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request")
	}

	if err := c.Validate(req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	token, err := h.service.Login(c.Request().Context(), req.Email, req.Password)
	if err != nil {
		if err == ErrInvalidCredentials {
			return echo.NewHTTPError(http.StatusUnauthorized, "invalid credentials")
		}
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to login")
	}

	// Set cookie
	setSessionCookie(c, token)

	// Get user info
	userID, _ := h.service.ValidateSession(c.Request().Context(), token)
	user, err := h.service.GetUserByID(c.Request().Context(), userID)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to get user")
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
	clearSessionCookie(c)

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

func setSessionCookie(c echo.Context, token string) {
	cookie := &http.Cookie{
		Name:     SessionCookieName,
		Value:    token,
		Path:     "/",
		Expires:  time.Now().Add(SessionDuration),
		HttpOnly: true,
		Secure:   false, // Set to true in production with HTTPS
		SameSite: http.SameSiteLaxMode,
	}
	c.SetCookie(cookie)
}

func clearSessionCookie(c echo.Context) {
	cookie := &http.Cookie{
		Name:     SessionCookieName,
		Value:    "",
		Path:     "/",
		MaxAge:   -1,
		HttpOnly: true,
		Secure:   false,
		SameSite: http.SameSiteLaxMode,
	}
	c.SetCookie(cookie)
}
