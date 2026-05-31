package auth

import (
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

type TokenType string

const (
	TokenTypeAccess  TokenType = "access"
	TokenTypeRefresh TokenType = "refresh"
)

type Claims struct {
	UserID    string    `json:"user_id"`
	TokenType TokenType `json:"token_type"`
	jwt.RegisteredClaims
}

type TokenPair struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	ExpiresIn    int64  `json:"expires_in"`
}

type JWTService struct {
	secret          []byte
	accessTokenTTL  time.Duration
	refreshTokenTTL time.Duration
}

func NewJWTService(secret string, accessTTL, refreshTTL time.Duration) *JWTService {
	return &JWTService{
		secret:          []byte(secret),
		accessTokenTTL:  accessTTL,
		refreshTokenTTL: refreshTTL,
	}
}

func (s *JWTService) IssuePair(userID uuid.UUID) (TokenPair, error) {
	access, err := s.sign(userID, TokenTypeAccess, s.accessTokenTTL)
	if err != nil {
		return TokenPair{}, err
	}
	refresh, err := s.sign(userID, TokenTypeRefresh, s.refreshTokenTTL)
	if err != nil {
		return TokenPair{}, err
	}
	return TokenPair{
		AccessToken:  access,
		RefreshToken: refresh,
		ExpiresIn:    int64(s.accessTokenTTL.Seconds()),
	}, nil
}

func (s *JWTService) Refresh(refreshToken string) (TokenPair, error) {
	claims, err := s.Parse(refreshToken)
	if err != nil {
		return TokenPair{}, err
	}
	if claims.TokenType != TokenTypeRefresh {
		return TokenPair{}, fmt.Errorf("invalid token type")
	}
	userID, err := uuid.Parse(claims.UserID)
	if err != nil {
		return TokenPair{}, err
	}
	return s.IssuePair(userID)
}

func (s *JWTService) Parse(token string) (*Claims, error) {
	parsed, err := jwt.ParseWithClaims(token, &Claims{}, func(t *jwt.Token) (interface{}, error) {
		if t.Method.Alg() != jwt.SigningMethodHS256.Alg() {
			return nil, fmt.Errorf("unexpected signing method")
		}
		return s.secret, nil
	})
	if err != nil {
		return nil, err
	}
	claims, ok := parsed.Claims.(*Claims)
	if !ok || !parsed.Valid {
		return nil, fmt.Errorf("invalid token")
	}
	return claims, nil
}

func (s *JWTService) sign(userID uuid.UUID, tokenType TokenType, ttl time.Duration) (string, error) {
	now := time.Now()
	claims := Claims{
		UserID:    userID.String(),
		TokenType: tokenType,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(now.Add(ttl)),
			IssuedAt:  jwt.NewNumericDate(now),
			Subject:   userID.String(),
		},
	}
	t := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return t.SignedString(s.secret)
}
