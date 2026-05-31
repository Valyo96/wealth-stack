package handlers

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/wealth-stack/backend/internal/apiresp"
	"github.com/wealth-stack/backend/internal/finance"
	"github.com/wealth-stack/backend/internal/http/middleware"
)

type AccountsHandler struct {
	svc *finance.Service
}

func NewAccountsHandler(svc *finance.Service) *AccountsHandler {
	return &AccountsHandler{svc: svc}
}

func (h *AccountsHandler) List(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.UserIDFromContext(r.Context())
	if !ok {
		apiresp.Error(w, http.StatusUnauthorized, "unauthorized", "missing user")
		return
	}
	accounts, err := h.svc.ListAccounts(r.Context(), userID)
	if err != nil {
		apiresp.Error(w, http.StatusInternalServerError, "internal_error", "failed to list accounts")
		return
	}
	apiresp.JSON(w, http.StatusOK, accounts)
}

func (h *AccountsHandler) Create(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.UserIDFromContext(r.Context())
	if !ok {
		apiresp.Error(w, http.StatusUnauthorized, "unauthorized", "missing user")
		return
	}
	var body finance.CreateAccountInput
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		apiresp.Error(w, http.StatusBadRequest, "bad_request", "invalid JSON body")
		return
	}
	account, err := h.svc.CreateAccount(r.Context(), userID, body)
	if err != nil {
		if errors.Is(err, finance.ErrInvalidInput) {
			apiresp.Error(w, http.StatusBadRequest, "invalid_input", err.Error())
			return
		}
		apiresp.Error(w, http.StatusInternalServerError, "internal_error", "failed to create account")
		return
	}
	apiresp.JSON(w, http.StatusCreated, account)
}
