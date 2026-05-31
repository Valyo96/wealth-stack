package handlers

import (
	"context"
	"net/http"
	"time"

	"github.com/wealth-stack/backend/internal/apiresp"
	"github.com/wealth-stack/backend/internal/store"
)

type HealthHandler struct {
	db *store.DB
}

func NewHealthHandler(db *store.DB) *HealthHandler {
	return &HealthHandler{db: db}
}

func (h *HealthHandler) Health(w http.ResponseWriter, r *http.Request) {
	apiresp.JSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func (h *HealthHandler) Ready(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 2*time.Second)
	defer cancel()
	if err := h.db.Pool.Ping(ctx); err != nil {
		apiresp.Error(w, http.StatusServiceUnavailable, "not_ready", "database unavailable")
		return
	}
	apiresp.JSON(w, http.StatusOK, map[string]string{"status": "ready"})
}
