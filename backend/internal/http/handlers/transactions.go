package handlers

import (
	"encoding/json"
	"errors"
	"net/http"
	"time"

	"github.com/google/uuid"
	"github.com/wealth-stack/backend/internal/apiresp"
	"github.com/wealth-stack/backend/internal/finance"
	"github.com/wealth-stack/backend/internal/http/middleware"
)

type TransactionsHandler struct {
	svc *finance.Service
}

func NewTransactionsHandler(svc *finance.Service) *TransactionsHandler {
	return &TransactionsHandler{svc: svc}
}

func (h *TransactionsHandler) List(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.UserIDFromContext(r.Context())
	if !ok {
		apiresp.Error(w, http.StatusUnauthorized, "unauthorized", "missing user")
		return
	}
	var from, to *time.Time
	if v := r.URL.Query().Get("from"); v != "" {
		t, err := time.Parse(time.RFC3339, v)
		if err != nil {
			apiresp.Error(w, http.StatusBadRequest, "invalid_input", "from must be RFC3339")
			return
		}
		from = &t
	}
	if v := r.URL.Query().Get("to"); v != "" {
		t, err := time.Parse(time.RFC3339, v)
		if err != nil {
			apiresp.Error(w, http.StatusBadRequest, "invalid_input", "to must be RFC3339")
			return
		}
		to = &t
	}
	var accountID *uuid.UUID
	if v := r.URL.Query().Get("account_id"); v != "" {
		id, err := uuid.Parse(v)
		if err != nil {
			apiresp.Error(w, http.StatusBadRequest, "invalid_input", "invalid account_id")
			return
		}
		accountID = &id
	}
	txs, err := h.svc.ListTransactions(r.Context(), userID, from, to, accountID)
	if err != nil {
		apiresp.Error(w, http.StatusInternalServerError, "internal_error", "failed to list transactions")
		return
	}
	apiresp.JSON(w, http.StatusOK, txs)
}

func (h *TransactionsHandler) Create(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.UserIDFromContext(r.Context())
	if !ok {
		apiresp.Error(w, http.StatusUnauthorized, "unauthorized", "missing user")
		return
	}
	var body finance.CreateTransactionInput
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		apiresp.Error(w, http.StatusBadRequest, "bad_request", "invalid JSON body")
		return
	}
	if body.OccurredAt.IsZero() {
		body.OccurredAt = time.Now().UTC()
	}
	tx, err := h.svc.CreateTransaction(r.Context(), userID, body)
	if err != nil {
		switch {
		case errors.Is(err, finance.ErrInvalidInput):
			apiresp.Error(w, http.StatusBadRequest, "invalid_input", err.Error())
		case errors.Is(err, finance.ErrNotFound):
			apiresp.Error(w, http.StatusNotFound, "not_found", err.Error())
		default:
			apiresp.Error(w, http.StatusInternalServerError, "internal_error", "failed to create transaction")
		}
		return
	}
	apiresp.JSON(w, http.StatusCreated, tx)
}
