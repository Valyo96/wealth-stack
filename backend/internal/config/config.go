package config

import (
	"fmt"
	"os"
	"time"
)

type Config struct {
	DatabaseURL     string
	JWTSecret       string
	HTTPPort        string
	AccessTokenTTL  time.Duration
	RefreshTokenTTL time.Duration
	CORSOrigins     string
}

func Load() (Config, error) {
	cfg := Config{
		DatabaseURL:     envOr("DATABASE_URL", "postgres://wealthstack:wealthstack@localhost:5432/wealthstack?sslmode=disable"),
		JWTSecret:       envOr("JWT_SECRET", "dev-secret-change-in-production"),
		HTTPPort:        envOr("HTTP_PORT", "8080"),
		CORSOrigins:     envOr("CORS_ORIGINS", "*"),
		AccessTokenTTL:  15 * time.Minute,
		RefreshTokenTTL: 168 * time.Hour,
	}

	if v := os.Getenv("ACCESS_TOKEN_TTL"); v != "" {
		d, err := time.ParseDuration(v)
		if err != nil {
			return cfg, fmt.Errorf("ACCESS_TOKEN_TTL: %w", err)
		}
		cfg.AccessTokenTTL = d
	}
	if v := os.Getenv("REFRESH_TOKEN_TTL"); v != "" {
		d, err := time.ParseDuration(v)
		if err != nil {
			return cfg, fmt.Errorf("REFRESH_TOKEN_TTL: %w", err)
		}
		cfg.RefreshTokenTTL = d
	}

	if cfg.JWTSecret == "" {
		return cfg, fmt.Errorf("JWT_SECRET is required")
	}
	return cfg, nil
}

func envOr(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
