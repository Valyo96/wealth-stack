package middleware

import (
	"context"
	"net/http"
	"strings"

	"github.com/google/uuid"
	"github.com/wealth-stack/backend/internal/auth"
	"github.com/wealth-stack/backend/internal/apiresp"
)

type contextKey string

const UserIDKey contextKey = "userID"

func Auth(jwt *auth.JWTService) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			header := r.Header.Get("Authorization")
			if header == "" || !strings.HasPrefix(header, "Bearer ") {
				apiresp.Error(w, http.StatusUnauthorized, "unauthorized", "missing or invalid authorization header")
				return
			}
			token := strings.TrimPrefix(header, "Bearer ")
			claims, err := jwt.Parse(token)
			if err != nil || claims.TokenType != auth.TokenTypeAccess {
				apiresp.Error(w, http.StatusUnauthorized, "unauthorized", "invalid access token")
				return
			}
			userID, err := auth.UserIDFromClaims(claims)
			if err != nil {
				apiresp.Error(w, http.StatusUnauthorized, "unauthorized", "invalid token subject")
				return
			}
			ctx := context.WithValue(r.Context(), UserIDKey, userID)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

func UserIDFromContext(ctx context.Context) (uuid.UUID, bool) {
	id, ok := ctx.Value(UserIDKey).(uuid.UUID)
	return id, ok
}
