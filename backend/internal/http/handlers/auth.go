package handlers

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/wealth-stack/backend/internal/auth"
	"github.com/wealth-stack/backend/internal/apiresp"
)

type AuthHandler struct {
	svc *auth.Service
}

func NewAuthHandler(svc *auth.Service) *AuthHandler {
	return &AuthHandler{svc: svc}
}

func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {
	var body auth.RegisterInput
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		apiresp.Error(w, http.StatusBadRequest, "bad_request", "invalid JSON body")
		return
	}
	tokens, err := h.svc.Register(r.Context(), body)
	if err != nil {
		writeAuthError(w, err)
		return
	}
	apiresp.JSON(w, http.StatusCreated, tokens)
}

func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var body auth.LoginInput
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		apiresp.Error(w, http.StatusBadRequest, "bad_request", "invalid JSON body")
		return
	}
	tokens, err := h.svc.Login(r.Context(), body)
	if err != nil {
		writeAuthError(w, err)
		return
	}
	apiresp.JSON(w, http.StatusOK, tokens)
}

type refreshRequest struct {
	RefreshToken string `json:"refresh_token"`
}

func (h *AuthHandler) Refresh(w http.ResponseWriter, r *http.Request) {
	var body refreshRequest
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		apiresp.Error(w, http.StatusBadRequest, "bad_request", "invalid JSON body")
		return
	}
	tokens, err := h.svc.Refresh(r.Context(), body.RefreshToken)
	if err != nil {
		apiresp.Error(w, http.StatusUnauthorized, "unauthorized", "invalid refresh token")
		return
	}
	apiresp.JSON(w, http.StatusOK, tokens)
}

func writeAuthError(w http.ResponseWriter, err error) {
	switch {
	case errors.Is(err, auth.ErrEmailTaken):
		apiresp.Error(w, http.StatusConflict, "email_taken", err.Error())
	case errors.Is(err, auth.ErrInvalidCredentials):
		apiresp.Error(w, http.StatusBadRequest, "invalid_input", err.Error())
	default:
		apiresp.Error(w, http.StatusInternalServerError, "internal_error", "something went wrong")
	}
}
