package handlers

import (
	"encoding/json"
	"errors"
	"net/http"
	"strconv"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/wealth-stack/backend/internal/apiresp"
	"github.com/wealth-stack/backend/internal/finance"
	"github.com/wealth-stack/backend/internal/http/middleware"
)

type RecurringTransactionsHandler struct {
	svc *finance.Service
}

func NewRecurringTransactionsHandler(svc *finance.Service) *RecurringTransactionsHandler {
	return &RecurringTransactionsHandler{svc: svc}
}

func (h *RecurringTransactionsHandler) List(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.UserIDFromContext(r.Context())
	if !ok {
		apiresp.Error(w, http.StatusUnauthorized, "unauthorized", "missing user")
		return
	}
	includeDeleted := r.URL.Query().Get("include_deleted") == "true"
	items, err := h.svc.ListRecurring(r.Context(), userID, includeDeleted)
	if err != nil {
		apiresp.Error(w, http.StatusInternalServerError, "internal_error", "failed to list recurring transactions")
		return
	}
	apiresp.JSON(w, http.StatusOK, items)
}

func (h *RecurringTransactionsHandler) Create(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.UserIDFromContext(r.Context())
	if !ok {
		apiresp.Error(w, http.StatusUnauthorized, "unauthorized", "missing user")
		return
	}
	var body finance.CreateRecurringInput
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		apiresp.Error(w, http.StatusBadRequest, "bad_request", "invalid JSON body")
		return
	}
	item, err := h.svc.CreateRecurring(r.Context(), userID, body, time.Now().UTC())
	if err != nil {
		writeRecurringErr(w, err)
		return
	}
	apiresp.JSON(w, http.StatusCreated, item)
}

func (h *RecurringTransactionsHandler) Get(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.UserIDFromContext(r.Context())
	if !ok {
		apiresp.Error(w, http.StatusUnauthorized, "unauthorized", "missing user")
		return
	}
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		apiresp.Error(w, http.StatusBadRequest, "invalid_input", "invalid id")
		return
	}
	item, err := h.svc.GetRecurring(r.Context(), userID, id)
	if err != nil {
		writeRecurringErr(w, err)
		return
	}
	apiresp.JSON(w, http.StatusOK, item)
}

func (h *RecurringTransactionsHandler) Patch(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.UserIDFromContext(r.Context())
	if !ok {
		apiresp.Error(w, http.StatusUnauthorized, "unauthorized", "missing user")
		return
	}
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		apiresp.Error(w, http.StatusBadRequest, "invalid_input", "invalid id")
		return
	}
	var body finance.PatchRecurringInput
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		apiresp.Error(w, http.StatusBadRequest, "bad_request", "invalid JSON body")
		return
	}
	item, err := h.svc.PatchRecurring(r.Context(), userID, id, body, time.Now().UTC())
	if err != nil {
		writeRecurringErr(w, err)
		return
	}
	apiresp.JSON(w, http.StatusOK, item)
}

func (h *RecurringTransactionsHandler) Delete(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.UserIDFromContext(r.Context())
	if !ok {
		apiresp.Error(w, http.StatusUnauthorized, "unauthorized", "missing user")
		return
	}
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		apiresp.Error(w, http.StatusBadRequest, "invalid_input", "invalid id")
		return
	}
	item, err := h.svc.SoftDeleteRecurring(r.Context(), userID, id)
	if err != nil {
		writeRecurringErr(w, err)
		return
	}
	apiresp.JSON(w, http.StatusOK, item)
}

func (h *RecurringTransactionsHandler) Pause(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.UserIDFromContext(r.Context())
	if !ok {
		apiresp.Error(w, http.StatusUnauthorized, "unauthorized", "missing user")
		return
	}
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		apiresp.Error(w, http.StatusBadRequest, "invalid_input", "invalid id")
		return
	}
	item, err := h.svc.PauseRecurring(r.Context(), userID, id)
	if err != nil {
		writeRecurringErr(w, err)
		return
	}
	apiresp.JSON(w, http.StatusOK, item)
}

func (h *RecurringTransactionsHandler) Resume(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.UserIDFromContext(r.Context())
	if !ok {
		apiresp.Error(w, http.StatusUnauthorized, "unauthorized", "missing user")
		return
	}
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		apiresp.Error(w, http.StatusBadRequest, "invalid_input", "invalid id")
		return
	}
	item, err := h.svc.ResumeRecurring(r.Context(), userID, id, time.Now().UTC())
	if err != nil {
		writeRecurringErr(w, err)
		return
	}
	apiresp.JSON(w, http.StatusOK, item)
}

func (h *RecurringTransactionsHandler) Upcoming(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.UserIDFromContext(r.Context())
	if !ok {
		apiresp.Error(w, http.StatusUnauthorized, "unauthorized", "missing user")
		return
	}
	limit := 10
	if v := r.URL.Query().Get("limit"); v != "" {
		n, err := strconv.Atoi(v)
		if err != nil || n < 1 || n > 100 {
			apiresp.Error(w, http.StatusBadRequest, "invalid_input", "limit must be 1-100")
			return
		}
		limit = n
	}
	from := time.Now().UTC()
	if v := r.URL.Query().Get("from"); v != "" {
		t, err := time.Parse(time.RFC3339, v)
		if err != nil {
			apiresp.Error(w, http.StatusBadRequest, "invalid_input", "from must be RFC3339")
			return
		}
		from = t
	}
	items, err := h.svc.UpcomingRecurring(r.Context(), userID, from, limit)
	if err != nil {
		apiresp.Error(w, http.StatusInternalServerError, "internal_error", "failed to load upcoming")
		return
	}
	apiresp.JSON(w, http.StatusOK, items)
}

func writeRecurringErr(w http.ResponseWriter, err error) {
	switch {
	case errors.Is(err, finance.ErrInvalidInput):
		apiresp.Error(w, http.StatusBadRequest, "invalid_input", err.Error())
	case errors.Is(err, finance.ErrNotFound):
		apiresp.Error(w, http.StatusNotFound, "not_found", err.Error())
	default:
		apiresp.Error(w, http.StatusInternalServerError, "internal_error", "recurring transaction operation failed")
	}
}
