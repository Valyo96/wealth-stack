package middleware

import (
	"net/http"
	"strings"
)

func CORS(origins string) func(http.Handler) http.Handler {
	allowed := strings.Split(origins, ",")
	for i := range allowed {
		allowed[i] = strings.TrimSpace(allowed[i])
	}
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			origin := r.Header.Get("Origin")
			if origin != "" && (origins == "*" || contains(allowed, origin)) {
				w.Header().Set("Access-Control-Allow-Origin", origin)
			} else if origins == "*" {
				w.Header().Set("Access-Control-Allow-Origin", "*")
			}
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Accept, Authorization, Content-Type")
			w.Header().Set("Access-Control-Max-Age", "86400")
			if r.Method == http.MethodOptions {
				w.WriteHeader(http.StatusNoContent)
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}

func contains(slice []string, s string) bool {
	for _, v := range slice {
		if v == s {
			return true
		}
	}
	return false
}
