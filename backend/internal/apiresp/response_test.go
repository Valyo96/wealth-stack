package apiresp

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestJSON(t *testing.T) {
	rec := httptest.NewRecorder()
	JSON(rec, http.StatusOK, map[string]string{"status": "ok"})

	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200", rec.Code)
	}
	if ct := rec.Header().Get("Content-Type"); ct != "application/json" {
		t.Fatalf("Content-Type = %q, want application/json", ct)
	}

	var body struct {
		Data map[string]string `json:"data"`
	}
	if err := json.Unmarshal(rec.Body.Bytes(), &body); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}
	if body.Data["status"] != "ok" {
		t.Fatalf("data = %v, want status ok", body.Data)
	}
}

func TestError(t *testing.T) {
	rec := httptest.NewRecorder()
	Error(rec, http.StatusBadRequest, "INVALID", "bad input")

	if rec.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, want 400", rec.Code)
	}

	var body struct {
		Error struct {
			Code    string `json:"code"`
			Message string `json:"message"`
		} `json:"error"`
	}
	if err := json.Unmarshal(rec.Body.Bytes(), &body); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}
	if body.Error.Code != "INVALID" || body.Error.Message != "bad input" {
		t.Fatalf("error = %+v, want INVALID / bad input", body.Error)
	}
}
