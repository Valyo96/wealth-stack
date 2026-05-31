package http

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	chimw "github.com/go-chi/chi/v5/middleware"
	"github.com/wealth-stack/backend/internal/auth"
	"github.com/wealth-stack/backend/internal/config"
	"github.com/wealth-stack/backend/internal/finance"
	"github.com/wealth-stack/backend/internal/http/handlers"
	"github.com/wealth-stack/backend/internal/http/middleware"
	"github.com/wealth-stack/backend/internal/store"
)

type Server struct {
	router http.Handler
}

func NewServer(cfg config.Config, db *store.DB) *Server {
	jwt := auth.NewJWTService(cfg.JWTSecret, cfg.AccessTokenTTL, cfg.RefreshTokenTTL)
	authSvc := auth.NewService(db.Queries, jwt)
	financeSvc := finance.NewService(db.Queries)

	health := handlers.NewHealthHandler(db)
	authH := handlers.NewAuthHandler(authSvc)
	accountsH := handlers.NewAccountsHandler(financeSvc)
	txH := handlers.NewTransactionsHandler(financeSvc)
	dashH := handlers.NewDashboardHandler(financeSvc)

	r := chi.NewRouter()
	r.Use(chimw.RequestID)
	r.Use(chimw.RealIP)
	r.Use(chimw.Logger)
	r.Use(chimw.Recoverer)
	r.Use(middleware.CORS(cfg.CORSOrigins))

	r.Get("/health", health.Health)
	r.Get("/ready", health.Ready)

	r.Route("/v1", func(r chi.Router) {
		r.Route("/auth", func(r chi.Router) {
			r.Post("/register", authH.Register)
			r.Post("/login", authH.Login)
			r.Post("/refresh", authH.Refresh)
		})

		r.Group(func(r chi.Router) {
			r.Use(middleware.Auth(jwt))
			r.Get("/accounts", accountsH.List)
			r.Post("/accounts", accountsH.Create)
			r.Get("/transactions", txH.List)
			r.Post("/transactions", txH.Create)
			r.Get("/dashboard/summary", dashH.Summary)
		})
	})

	return &Server{router: r}
}

func (s *Server) Handler() http.Handler {
	return s.router
}
