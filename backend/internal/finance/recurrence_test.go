package finance

import (
	"testing"
	"time"
)

func TestNextExecutionMonthlyClampsDay(t *testing.T) {
	loc := time.UTC
	dom := int16(31)
	s := Schedule{
		Frequency:  "monthly",
		DayOfMonth: &dom,
		Timezone:   "UTC",
		StartDate:  time.Date(2024, 1, 31, 0, 0, 0, 0, loc),
	}
	after := time.Date(2024, 2, 1, 0, 0, 0, 0, loc)
	next, err := NextExecutionAfter(s, after)
	if err != nil {
		t.Fatal(err)
	}
	want := time.Date(2024, 2, 29, 0, 0, 0, 0, loc)
	if !next.Equal(want) {
		t.Fatalf("got %v want %v", next, want)
	}
}

func TestNextExecutionWeekly(t *testing.T) {
	monday := int16(1)
	s := Schedule{
		Frequency: "weekly",
		DayOfWeek: &monday,
		Timezone:  "UTC",
		StartDate: time.Date(2024, 6, 3, 0, 0, 0, 0, time.UTC), // Monday
	}
	after := time.Date(2024, 6, 3, 12, 0, 0, 0, time.UTC)
	next, err := NextExecutionAfter(s, after)
	if err != nil {
		t.Fatal(err)
	}
	want := time.Date(2024, 6, 10, 0, 0, 0, 0, time.UTC)
	if !next.Equal(want) {
		t.Fatalf("got %v want %v", next, want)
	}
}

func TestFirstExecutionAtTimezone(t *testing.T) {
	dom := int16(15)
	s := Schedule{
		Frequency:  "monthly",
		DayOfMonth: &dom,
		Timezone:   "America/New_York",
		StartDate:  time.Date(2024, 3, 15, 0, 0, 0, 0, time.UTC),
	}
	// 2024-03-15 04:00 UTC = 2024-03-15 00:00 EDT
	notBefore := time.Date(2024, 3, 14, 10, 0, 0, 0, time.UTC)
	first, err := FirstExecutionAt(s, notBefore)
	if err != nil {
		t.Fatal(err)
	}
	// Midnight Eastern on the 15th is 04:00 UTC during EDT.
	want := time.Date(2024, 3, 15, 4, 0, 0, 0, time.UTC)
	if !first.Equal(want) {
		t.Fatalf("got %v want %v", first, want)
	}
}

func TestPreviewOccurrencesDaily(t *testing.T) {
	s := Schedule{
		Frequency: "daily",
		Timezone:  "UTC",
		StartDate: time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC),
	}
	from := time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC)
	got, err := PreviewOccurrences(s, from, 3)
	if err != nil {
		t.Fatal(err)
	}
	if len(got) != 3 {
		t.Fatalf("len=%d", len(got))
	}
	if !got[0].Equal(from) {
		t.Fatalf("first=%v", got[0])
	}
}

func TestIdempotencyKeyStable(t *testing.T) {
	when := time.Date(2024, 5, 1, 0, 0, 0, 0, time.UTC)
	k1 := IdempotencyKey("abc", when)
	k2 := IdempotencyKey("abc", when)
	if k1 != k2 {
		t.Fatalf("keys differ: %q %q", k1, k2)
	}
}
