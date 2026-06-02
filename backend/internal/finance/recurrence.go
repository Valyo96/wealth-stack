package finance

import (
	"errors"
	"fmt"
	"time"
)

var ErrInvalidSchedule = errors.New("invalid recurrence schedule")

// Schedule describes when a recurring transaction should run (wall clock in Timezone).
type Schedule struct {
	Frequency   string
	DayOfWeek   *int16 // 0=Sunday .. 6=Saturday
	DayOfMonth  *int16 // 1-31
	Timezone    string
	StartDate   time.Time
	EndDate     *time.Time
}

func LoadTimezone(name string) (*time.Location, error) {
	if name == "" {
		name = "UTC"
	}
	loc, err := time.LoadLocation(name)
	if err != nil {
		return nil, fmt.Errorf("%w: unknown timezone %q", ErrInvalidSchedule, name)
	}
	return loc, nil
}

func ValidateSchedule(s Schedule) error {
	switch s.Frequency {
	case "daily":
	case "weekly", "biweekly":
		if s.DayOfWeek == nil || *s.DayOfWeek < 0 || *s.DayOfWeek > 6 {
			return fmt.Errorf("%w: day_of_week required for %s", ErrInvalidSchedule, s.Frequency)
		}
	case "monthly":
		if s.DayOfMonth == nil || *s.DayOfMonth < 1 || *s.DayOfMonth > 31 {
			return fmt.Errorf("%w: day_of_month required for monthly", ErrInvalidSchedule)
		}
	default:
		return fmt.Errorf("%w: unsupported frequency %q", ErrInvalidSchedule, s.Frequency)
	}
	if _, err := LoadTimezone(s.Timezone); err != nil {
		return err
	}
	if s.StartDate.IsZero() {
		return fmt.Errorf("%w: start_date required", ErrInvalidSchedule)
	}
	return nil
}

// FirstExecutionAt returns the first run at or after startDate (in schedule TZ), as UTC.
func FirstExecutionAt(s Schedule, notBefore time.Time) (time.Time, error) {
	if err := ValidateSchedule(s); err != nil {
		return time.Time{}, err
	}
	loc, err := LoadTimezone(s.Timezone)
	if err != nil {
		return time.Time{}, err
	}
	start := dateInLoc(s.StartDate, loc)
	anchor := notBefore.In(loc)
	if anchor.Before(start) {
		anchor = start
	}
	return nextOccurrenceAfter(s, anchor, loc), nil
}

// NextExecutionAfter returns the next scheduled instant strictly after `after` (UTC).
func NextExecutionAfter(s Schedule, after time.Time) (time.Time, error) {
	if err := ValidateSchedule(s); err != nil {
		return time.Time{}, err
	}
	loc, err := LoadTimezone(s.Timezone)
	if err != nil {
		return time.Time{}, err
	}
	cursor := after.In(loc)
	return nextOccurrenceAfter(s, cursor, loc), nil
}

// PreviewOccurrences returns up to `limit` upcoming run times at or after `from` (UTC).
func PreviewOccurrences(s Schedule, from time.Time, limit int) ([]time.Time, error) {
	if limit <= 0 {
		return nil, nil
	}
	if err := ValidateSchedule(s); err != nil {
		return nil, err
	}
	loc, err := LoadTimezone(s.Timezone)
	if err != nil {
		return nil, err
	}
	cursor := from.In(loc)
	if cursor.Before(dateInLoc(s.StartDate, loc)) {
		cursor = dateInLoc(s.StartDate, loc)
	}
	out := make([]time.Time, 0, limit)
	for len(out) < limit {
		next := nextOccurrenceAtOrAfter(s, cursor, loc)
		if s.EndDate != nil {
			end := dateInLoc(*s.EndDate, loc).Add(24 * time.Hour)
			if !next.Before(end) {
				break
			}
		}
		out = append(out, next.UTC())
		cursor = next.Add(time.Second)
	}
	return out, nil
}

func IdempotencyKey(recurringID string, scheduledFor time.Time) string {
	return recurringID + ":" + scheduledFor.UTC().Format(time.RFC3339)
}

func RecurringToSchedule(frequency string, dayOfWeek, dayOfMonth *int16, timezone string, startDate time.Time, endDate *time.Time) Schedule {
	return Schedule{
		Frequency:  frequency,
		DayOfWeek:  dayOfWeek,
		DayOfMonth: dayOfMonth,
		Timezone:   timezone,
		StartDate:  startDate,
		EndDate:    endDate,
	}
}

// normalizeScheduleFields fills day_of_week / day_of_month from start_date when omitted.
func normalizeScheduleFields(frequency string, start time.Time, dayOfWeek, dayOfMonth *int16) (*int16, *int16) {
	switch frequency {
	case "weekly", "biweekly":
		if dayOfWeek == nil {
			v := int16(start.Weekday())
			dayOfWeek = &v
		}
	case "monthly":
		if dayOfMonth == nil {
			v := int16(start.Day())
			dayOfMonth = &v
		}
	}
	return dayOfWeek, dayOfMonth
}

func nextOccurrenceAfter(s Schedule, after time.Time, loc *time.Location) time.Time {
	return nextOccurrenceAtOrAfter(s, after.Add(time.Second), loc)
}

func nextOccurrenceAtOrAfter(s Schedule, at time.Time, loc *time.Location) time.Time {
	switch s.Frequency {
	case "daily":
		return nextDaily(at, loc)
	case "weekly":
		return nextWeekly(at, loc, int(*s.DayOfWeek), 7)
	case "biweekly":
		return nextBiweekly(s, at, loc)
	case "monthly":
		return nextMonthly(at, loc, int(*s.DayOfMonth))
	default:
		return at.UTC()
	}
}

func nextDaily(at time.Time, loc *time.Location) time.Time {
	y, m, d := at.In(loc).Date()
	candidate := time.Date(y, m, d, 0, 0, 0, 0, loc)
	if candidate.Before(at) {
		candidate = candidate.AddDate(0, 0, 1)
	}
	return candidate.UTC()
}

func nextWeekly(at time.Time, loc *time.Location, targetDOW int, _ int) time.Time {
	y, m, d := at.Date()
	candidate := time.Date(y, m, d, 0, 0, 0, 0, loc)
	for i := 0; i < 8; i++ {
		if int(candidate.Weekday()) == targetDOW && candidate.After(at) {
			return candidate.UTC()
		}
		candidate = candidate.AddDate(0, 0, 1)
	}
	return candidate.UTC()
}

func nextBiweekly(s Schedule, at time.Time, loc *time.Location) time.Time {
	start := alignWeekday(dateInLoc(s.StartDate, loc), int(*s.DayOfWeek))
	y, m, d := at.In(loc).Date()
	cursor := time.Date(y, m, d, 0, 0, 0, 0, loc)
	if !cursor.After(at) {
		cursor = cursor.AddDate(0, 0, 1)
	}
	if cursor.Before(start) || cursor.Equal(start) {
		if start.After(at) {
			return start.UTC()
		}
	}
	days := int(cursor.Sub(start).Hours() / 24)
	if days < 0 {
		return start.UTC()
	}
	periods := days / 14
	cand := start.AddDate(0, 0, periods*14)
	if !cand.After(at) {
		cand = start.AddDate(0, 0, (periods+1)*14)
	}
	return cand.UTC()
}

func alignWeekday(t time.Time, targetDOW int) time.Time {
	for int(t.Weekday()) != targetDOW {
		t = t.AddDate(0, 0, 1)
	}
	return t
}

func nextMonthly(at time.Time, loc *time.Location, dom int) time.Time {
	y, m, _ := at.Date()
	for i := 0; i < 24; i++ {
		day := clampDayOfMonth(y, m, dom)
		candidate := time.Date(y, m, day, 0, 0, 0, 0, loc)
		if candidate.After(at) {
			return candidate.UTC()
		}
		m++
		if m > 12 {
			m = 1
			y++
		}
	}
	return at.UTC()
}

func clampDayOfMonth(year int, month time.Month, dom int) int {
	last := daysInMonth(year, month)
	if dom > last {
		return last
	}
	return dom
}

func daysInMonth(year int, month time.Month) int {
	return time.Date(year, month+1, 0, 0, 0, 0, 0, time.UTC).Day()
}

func dateInLoc(t time.Time, loc *time.Location) time.Time {
	y, m, d := t.In(loc).Date()
	return time.Date(y, m, d, 0, 0, 0, 0, loc)
}
