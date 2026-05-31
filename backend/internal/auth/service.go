package auth

import (
	"context"
	"errors"
	"strings"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/wealth-stack/backend/internal/store"
)

var (
	ErrInvalidCredentials = errors.New("invalid email or password")
	ErrEmailTaken         = errors.New("email already registered")
)

type Service struct {
	queries *store.Queries
	jwt     *JWTService
}

func NewService(queries *store.Queries, jwt *JWTService) *Service {
	return &Service{queries: queries, jwt: jwt}
}

type RegisterInput struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type LoginInput struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

func (s *Service) Register(ctx context.Context, in RegisterInput) (TokenPair, error) {
	email := strings.TrimSpace(strings.ToLower(in.Email))
	if email == "" || len(in.Password) < 8 {
		return TokenPair{}, ErrInvalidCredentials
	}
	hash, err := HashPassword(in.Password)
	if err != nil {
		return TokenPair{}, err
	}
	user, err := s.queries.CreateUser(ctx, store.CreateUserParams{
		Email:        email,
		PasswordHash: hash,
	})
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			return TokenPair{}, ErrEmailTaken
		}
		return TokenPair{}, err
	}
	return s.jwt.IssuePair(user.ID)
}

func (s *Service) Login(ctx context.Context, in LoginInput) (TokenPair, error) {
	email := strings.TrimSpace(strings.ToLower(in.Email))
	user, err := s.queries.GetUserByEmail(ctx, email)
	if err != nil {
		return TokenPair{}, ErrInvalidCredentials
	}
	if !CheckPassword(user.PasswordHash, in.Password) {
		return TokenPair{}, ErrInvalidCredentials
	}
	return s.jwt.IssuePair(user.ID)
}

func (s *Service) Refresh(ctx context.Context, refreshToken string) (TokenPair, error) {
	return s.jwt.Refresh(refreshToken)
}

func UserIDFromClaims(claims *Claims) (uuid.UUID, error) {
	return uuid.Parse(claims.UserID)
}
