package auth

import (
	"testing"
	"time"

	"github.com/google/uuid"
)

func TestJWTService_IssuePairAndParse(t *testing.T) {
	svc := NewJWTService("test-secret", time.Minute, time.Hour)
	userID := uuid.MustParse("550e8400-e29b-41d4-a716-446655440000")

	pair, err := svc.IssuePair(userID)
	if err != nil {
		t.Fatalf("IssuePair: %v", err)
	}
	if pair.AccessToken == "" || pair.RefreshToken == "" {
		t.Fatal("expected non-empty tokens")
	}
	if pair.ExpiresIn != 60 {
		t.Fatalf("ExpiresIn = %d, want 60", pair.ExpiresIn)
	}

	accessClaims, err := svc.Parse(pair.AccessToken)
	if err != nil {
		t.Fatalf("Parse access: %v", err)
	}
	if accessClaims.TokenType != TokenTypeAccess {
		t.Fatalf("TokenType = %q, want access", accessClaims.TokenType)
	}
	if accessClaims.UserID != userID.String() {
		t.Fatalf("UserID = %q, want %q", accessClaims.UserID, userID)
	}

	refreshClaims, err := svc.Parse(pair.RefreshToken)
	if err != nil {
		t.Fatalf("Parse refresh: %v", err)
	}
	if refreshClaims.TokenType != TokenTypeRefresh {
		t.Fatalf("TokenType = %q, want refresh", refreshClaims.TokenType)
	}
}

func TestJWTService_Refresh(t *testing.T) {
	svc := NewJWTService("test-secret", time.Minute, time.Hour)
	userID := uuid.New()

	pair, err := svc.IssuePair(userID)
	if err != nil {
		t.Fatalf("IssuePair: %v", err)
	}

	refreshed, err := svc.Refresh(pair.RefreshToken)
	if err != nil {
		t.Fatalf("Refresh: %v", err)
	}
	if refreshed.AccessToken == "" || refreshed.RefreshToken == "" {
		t.Fatal("expected refreshed token pair")
	}

	claims, err := svc.Parse(refreshed.AccessToken)
	if err != nil {
		t.Fatalf("Parse refreshed access: %v", err)
	}
	if claims.UserID != userID.String() {
		t.Fatalf("UserID = %q, want %q", claims.UserID, userID)
	}
}

func TestJWTService_RefreshRejectsAccessToken(t *testing.T) {
	svc := NewJWTService("test-secret", time.Minute, time.Hour)
	pair, err := svc.IssuePair(uuid.New())
	if err != nil {
		t.Fatalf("IssuePair: %v", err)
	}

	if _, err := svc.Refresh(pair.AccessToken); err == nil {
		t.Fatal("expected refresh with access token to fail")
	}
}

func TestJWTService_ParseRejectsInvalidToken(t *testing.T) {
	svc := NewJWTService("test-secret", time.Minute, time.Hour)

	if _, err := svc.Parse("not-a-jwt"); err == nil {
		t.Fatal("expected invalid token to fail")
	}
}
