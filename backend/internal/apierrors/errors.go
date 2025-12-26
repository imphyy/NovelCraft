package apierrors

import (
	"net/http"

	"github.com/labstack/echo/v4"
)

// ErrorResponse represents a standardized API error response
type ErrorResponse struct {
	Error ErrorDetail `json:"error"`
}

// ErrorDetail contains the error information
type ErrorDetail struct {
	Code    string                 `json:"code"`
	Message string                 `json:"message"`
	Details map[string]interface{} `json:"details,omitempty"`
}

// Common error codes
const (
	ErrCodeBadRequest          = "bad_request"
	ErrCodeUnauthorized        = "unauthorized"
	ErrCodeForbidden           = "forbidden"
	ErrCodeNotFound            = "not_found"
	ErrCodeConflict            = "conflict"
	ErrCodeValidationFailed    = "validation_failed"
	ErrCodeInternalServerError = "internal_server_error"
)

// NewErrorResponse creates a new standardized error response
func NewErrorResponse(code, message string, details map[string]interface{}) *ErrorResponse {
	return &ErrorResponse{
		Error: ErrorDetail{
			Code:    code,
			Message: message,
			Details: details,
		},
	}
}

// RespondWithError sends a standardized error response
func RespondWithError(c echo.Context, statusCode int, code, message string, details map[string]interface{}) error {
	return c.JSON(statusCode, NewErrorResponse(code, message, details))
}

// Common error responses for convenience
func BadRequest(c echo.Context, message string, details map[string]interface{}) error {
	return RespondWithError(c, http.StatusBadRequest, ErrCodeBadRequest, message, details)
}

func Unauthorized(c echo.Context, message string) error {
	return RespondWithError(c, http.StatusUnauthorized, ErrCodeUnauthorized, message, nil)
}

func Forbidden(c echo.Context, message string) error {
	return RespondWithError(c, http.StatusForbidden, ErrCodeForbidden, message, nil)
}

func NotFound(c echo.Context, message string) error {
	return RespondWithError(c, http.StatusNotFound, ErrCodeNotFound, message, nil)
}

func Conflict(c echo.Context, message string, details map[string]interface{}) error {
	return RespondWithError(c, http.StatusConflict, ErrCodeConflict, message, details)
}

func ValidationFailed(c echo.Context, message string, details map[string]interface{}) error {
	return RespondWithError(c, http.StatusBadRequest, ErrCodeValidationFailed, message, details)
}

func InternalServerError(c echo.Context, message string) error {
	return RespondWithError(c, http.StatusInternalServerError, ErrCodeInternalServerError, message, nil)
}
