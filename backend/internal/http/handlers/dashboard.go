package handlers

import (
	"net/http"
	"time"

	"github.com/wealth-stack/backend/internal/apiresp"
	"github.com/wealth-stack/backend/internal/finance"
	"github.com/wealth-stack/backend/internal/http/middleware"
)

type DashboardHandler struct {
	svc *finance.Service
}

func NewDashboardHandler(svc *finance.Service) *DashboardHandler {
	return &DashboardHandler{svc: svc}
}

func (h *DashboardHandler) Summary(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.UserIDFromContext(r.Context())
	if !ok {
		apiresp.Error(w, http.StatusUnauthorized, "unauthorized", "missing user")
		return
	}
	now := time.Now().UTC()
	from, to, label := finance.CurrentMonthRange(now)
	if v := r.URL.Query().Get("from"); v != "" {
		if t, err := time.Parse(time.RFC3339, v); err == nil {
			from = t
		}
	}
	if v := r.URL.Query().Get("to"); v != "" {
		if t, err := time.Parse(time.RFC3339, v); err == nil {
			to = t
		}
	}
	if v := r.URL.Query().Get("period_label"); v != "" {
		label = v
	}
	summary, err := h.svc.DashboardSummary(r.Context(), userID, from, to, label)
	if err != nil {
		apiresp.Error(w, http.StatusInternalServerError, "internal_error", "failed to load summary")
		return
	}
	apiresp.JSON(w, http.StatusOK, summary)
}
