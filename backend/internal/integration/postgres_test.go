//go:build integration

package integration

import (
	"context"
	"fmt"
	"path/filepath"
	"runtime"
	"testing"
	"time"

	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file"
	"github.com/testcontainers/testcontainers-go"
	tcpostgres "github.com/testcontainers/testcontainers-go/modules/postgres"
	"github.com/testcontainers/testcontainers-go/wait"
)

func setupPostgres(t *testing.T) (databaseURL string, cleanup func()) {
	t.Helper()
	ctx := context.Background()

	pg, err := tcpostgres.Run(ctx,
		"postgres:16-alpine",
		tcpostgres.WithDatabase("wealthstack"),
		tcpostgres.WithUsername("wealthstack"),
		tcpostgres.WithPassword("wealthstack"),
		testcontainers.WithWaitStrategy(
			wait.ForLog("database system is ready to accept connections").
				WithOccurrence(2).
				WithStartupTimeout(60*time.Second),
		),
	)
	if err != nil {
		t.Fatalf("start postgres: %v", err)
	}

	connStr, err := pg.ConnectionString(ctx, "sslmode=disable")
	if err != nil {
		_ = pg.Terminate(ctx)
		t.Fatalf("connection string: %v", err)
	}

	if err := runMigrations(connStr); err != nil {
		_ = pg.Terminate(ctx)
		t.Fatalf("migrate: %v", err)
	}

	return connStr, func() {
		if err := pg.Terminate(ctx); err != nil {
			t.Logf("terminate postgres: %v", err)
		}
	}
}

func runMigrations(databaseURL string) error {
	_, filename, _, ok := runtime.Caller(0)
	if !ok {
		return fmt.Errorf("runtime.Caller failed")
	}
	migrationsPath := filepath.Join(filepath.Dir(filename), "..", "..", "migrations")
	migrationsURL := "file://" + filepath.ToSlash(migrationsPath)

	m, err := migrate.New(migrationsURL, databaseURL)
	if err != nil {
		return err
	}
	defer m.Close()

	if err := m.Up(); err != nil && err != migrate.ErrNoChange {
		return err
	}
	return nil
}
