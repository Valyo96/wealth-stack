//go:build integration

package integration

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/wealth-stack/backend/internal/config"
	httpx "github.com/wealth-stack/backend/internal/http"
	"github.com/wealth-stack/backend/internal/store"
)

func TestHealthReadyIntegration(t *testing.T) {
	databaseURL, cleanup := setupPostgres(t)
	defer cleanup()

	ctx := context.Background()
	db, err := store.NewDB(ctx, databaseURL)
	if err != nil {
		t.Fatalf("NewDB: %v", err)
	}
	defer db.Close()

	cfg := config.Config{
		JWTSecret:       "test-secret-for-integration",
		HTTPPort:        "8080",
		CORSOrigins:     "*",
		AccessTokenTTL:  15 * time.Minute,
		RefreshTokenTTL: 168 * time.Hour,
	}
	srv := httpx.NewServer(cfg, db)

	t.Run("health", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/health", nil)
		rec := httptest.NewRecorder()
		srv.Handler().ServeHTTP(rec, req)
		if rec.Code != http.StatusOK {
			t.Fatalf("GET /health status = %d, want %d", rec.Code, http.StatusOK)
		}
	})

	t.Run("ready", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/ready", nil)
		rec := httptest.NewRecorder()
		srv.Handler().ServeHTTP(rec, req)
		if rec.Code != http.StatusOK {
			t.Fatalf("GET /ready status = %d, want %d", rec.Code, http.StatusOK)
		}
	})
}
