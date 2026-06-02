import { useEffect, useMemo, useState } from "react";

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"] as const;

export function parseIsoDate(iso: string): { y: number; m: number; d: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return null;
  const y = Number(match[1]);
  const m = Number(match[2]);
  const d = Number(match[3]);
  const probe = new Date(Date.UTC(y, m - 1, d));
  if (
    probe.getUTCFullYear() !== y ||
    probe.getUTCMonth() !== m - 1 ||
    probe.getUTCDate() !== d
  ) {
    return null;
  }
  return { y, m, d };
}

export function formatIsoDate(y: number, m: number, d: number): string {
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function localToday(): { y: number; m: number; d: number } {
  const now = new Date();
  return { y: now.getFullYear(), m: now.getMonth() + 1, d: now.getDate() };
}

function monthLabel(year: number, month: number): string {
  return new Date(year, month - 1, 1).toLocaleString(undefined, {
    month: "long",
    year: "numeric",
  });
}

export interface MiniCalendarProps {
  value: string;
  onChange: (isoDate: string) => void;
}

export function MiniCalendar({ value, onChange }: MiniCalendarProps) {
  const selected = parseIsoDate(value);
  const today = localToday();

  const initialView = selected ?? today;
  const [viewYear, setViewYear] = useState(initialView.y);
  const [viewMonth, setViewMonth] = useState(initialView.m);

  useEffect(() => {
    const parsed = parseIsoDate(value);
    if (parsed) {
      setViewYear(parsed.y);
      setViewMonth(parsed.m);
    }
  }, [value]);

  const cells = useMemo(() => {
    const firstWeekday = new Date(viewYear, viewMonth - 1, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth, 0).getDate();
    const grid: (number | null)[] = [];
    for (let i = 0; i < firstWeekday; i++) grid.push(null);
    for (let day = 1; day <= daysInMonth; day++) grid.push(day);
    while (grid.length % 7 !== 0) grid.push(null);
    return grid;
  }, [viewYear, viewMonth]);

  function goMonth(delta: number) {
    let m = viewMonth + delta;
    let y = viewYear;
    if (m < 1) {
      m = 12;
      y -= 1;
    } else if (m > 12) {
      m = 1;
      y += 1;
    }
    setViewYear(y);
    setViewMonth(m);
  }

  function selectDay(day: number) {
    onChange(formatIsoDate(viewYear, viewMonth, day));
  }

  function selectToday() {
    const iso = formatIsoDate(today.y, today.m, today.d);
    onChange(iso);
    setViewYear(today.y);
    setViewMonth(today.m);
  }

  const displayValue = selected
    ? new Date(selected.y, selected.m - 1, selected.d).toLocaleDateString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "Pick a date";

  return (
    <div className="mini-calendar">
      <div className="mini-calendar-selected" aria-live="polite">
        {displayValue}
      </div>

      <div className="mini-calendar-header">
        <button
          type="button"
          className="mini-calendar-nav"
          aria-label="Previous month"
          onClick={() => goMonth(-1)}
        >
          ‹
        </button>
        <span className="mini-calendar-month">{monthLabel(viewYear, viewMonth)}</span>
        <button
          type="button"
          className="mini-calendar-nav"
          aria-label="Next month"
          onClick={() => goMonth(1)}
        >
          ›
        </button>
      </div>

      <div className="mini-calendar-weekdays" aria-hidden>
        {WEEKDAYS.map((label) => (
          <span key={label} className="mini-calendar-weekday">
            {label}
          </span>
        ))}
      </div>

      <div className="mini-calendar-grid" role="grid" aria-label="Calendar">
        {cells.map((day, index) => {
          if (day === null) {
            return (
              <span
                key={`empty-${viewYear}-${viewMonth}-${index}`}
                className="mini-calendar-day mini-calendar-day--empty"
                role="presentation"
              />
            );
          }

          const isSelected =
            selected?.y === viewYear && selected?.m === viewMonth && selected?.d === day;
          const isToday =
            today.y === viewYear && today.m === viewMonth && today.d === day;

          return (
            <button
              key={`${viewYear}-${viewMonth}-${day}`}
              type="button"
              role="gridcell"
              className={[
                "mini-calendar-day",
                isSelected ? "mini-calendar-day--selected" : "",
                isToday ? "mini-calendar-day--today" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              aria-selected={isSelected}
              aria-label={formatIsoDate(viewYear, viewMonth, day)}
              onClick={() => selectDay(day)}
            >
              {day}
            </button>
          );
        })}
      </div>

      <button type="button" className="mini-calendar-today" onClick={selectToday}>
        Today
      </button>
    </div>
  );
}
