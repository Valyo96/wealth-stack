package main

import (
	"context"
	"log"
	"os"
	"time"

	"github.com/wealth-stack/backend/internal/config"
	"github.com/wealth-stack/backend/internal/finance"
	"github.com/wealth-stack/backend/internal/store"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("config: %v", err)
	}

	ctx := context.Background()
	db, err := store.NewDB(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("database: %v", err)
	}
	defer db.Close()

	asOf := time.Now().UTC()
	if v := os.Getenv("SCHEDULER_AS_OF"); v != "" {
		t, err := time.Parse(time.RFC3339, v)
		if err != nil {
			log.Fatalf("SCHEDULER_AS_OF: %v", err)
		}
		asOf = t.UTC()
	}

	sch := finance.NewScheduler(db)
	result, err := sch.ProcessDue(ctx, asOf)
	if err != nil {
		log.Fatalf("process due: %v", err)
	}
	log.Printf("scheduler done at %s: processed=%d skipped=%d errors=%d",
		asOf.Format(time.RFC3339), result.Processed, result.Skipped, result.Errors)
}
