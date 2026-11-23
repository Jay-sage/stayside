"use client";

import { useMemo, useState } from "react";
import { ChevronLeftIcon } from "@/components/Icons";

const DAYS_HEADER = ["S", "M", "T", "W", "T", "F", "S"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function toIsoDate(year: number, monthIndex: number, day: number): string {
  return `${year}-${pad2(monthIndex + 1)}-${pad2(day)}`;
}

function parseIso(iso: string): { year: number; month: number; day: number } {
  const [y, m, d] = iso.split("-").map(Number);
  return { year: y, month: m - 1, day: d };
}

export function formatShortHumanDate(iso: string | null): string {
  if (!iso) return "Select date";
  const { year, month, day } = parseIso(iso);
  return `${day} ${MONTHS[month].slice(0, 3)} ${year}`;
}

interface HotelCalendarProps {
  mode: "day" | "night";
  minDate: string;
  checkInDate: string;
  checkOutDate: string | null;
  onChange: (nextCheckIn: string, nextCheckOut: string | null) => void;
}

export function HotelCalendar({
  mode,
  minDate,
  checkInDate,
  checkOutDate,
  onChange,
}: HotelCalendarProps) {
  const initial = parseIso(checkInDate || minDate);
  const [viewYear, setViewYear] = useState(initial.year);
  const [viewMonth, setViewMonth] = useState(initial.month);
  const [pickingCheckout, setPickingCheckout] = useState(false);

  const cells = useMemo(() => {
    const firstDayOfWeek = new Date(Date.UTC(viewYear, viewMonth, 1)).getUTCDay();
    const daysInMonth = new Date(Date.UTC(viewYear, viewMonth + 1, 0)).getUTCDate();
    const prevMonthDays = new Date(Date.UTC(viewYear, viewMonth, 0)).getUTCDate();

    const list: { iso: string; day: number; inMonth: boolean }[] = [];

    // Leading days from previous month
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const d = prevMonthDays - i;
      const prevM = viewMonth === 0 ? 11 : viewMonth - 1;
      const prevY = viewMonth === 0 ? viewYear - 1 : viewYear;
      list.push({ iso: toIsoDate(prevY, prevM, d), day: d, inMonth: false });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      list.push({ iso: toIsoDate(viewYear, viewMonth, d), day: d, inMonth: true });
    }

    // Trailing days to complete 5 or 6 rows
    const remainder = list.length % 7;
    if (remainder !== 0) {
      const needed = 7 - remainder;
      const nextM = viewMonth === 11 ? 0 : viewMonth + 1;
      const nextY = viewMonth === 11 ? viewYear + 1 : viewYear;
      for (let d = 1; d <= needed; d++) {
        list.push({ iso: toIsoDate(nextY, nextM, d), day: d, inMonth: false });
      }
    }

    return list;
  }, [viewYear, viewMonth]);

  function goPrevMonth() {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth((m) => m - 1);
    }
  }

  function goNextMonth() {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth((m) => m + 1);
    }
  }

  function handleDayClick(iso: string) {
    if (iso < minDate) return;

    if (mode === "day") {
      onChange(iso, null);
      setPickingCheckout(false);
      return;
    }

    // Night stay range picking
    if (!pickingCheckout || iso <= checkInDate) {
      // Set check-in and auto-default check-out to +1 day while allowing second click for check-out
      const parsed = parseIso(iso);
      const nextDay = new Date(Date.UTC(parsed.year, parsed.month, parsed.day + 1));
      const nextIso = nextDay.toISOString().slice(0, 10);
      onChange(iso, nextIso);
      setPickingCheckout(true);
    } else {
      onChange(checkInDate, iso);
      setPickingCheckout(false);
    }
  }

  return (
    <div className="rounded-[12px] bg-brand-bg/80 p-4">
      {/* Month Header — matches HotelIQ Schedule calendar */}
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[14px] font-semibold text-brand-ink">
          {MONTHS[viewMonth]} {viewYear}
        </span>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={goPrevMonth}
            aria-label="Previous month"
            className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg text-brand-ink transition hover:bg-white"
          >
            <ChevronLeftIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={goNextMonth}
            aria-label="Next month"
            className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg text-brand-ink transition hover:bg-white"
          >
            <ChevronLeftIcon className="h-4 w-4 rotate-180" />
          </button>
        </div>
      </div>

      {/* Day-of-week header */}
      <div className="mb-2 grid grid-cols-7 border-b border-brand-border/80 pb-2 text-center">
        {DAYS_HEADER.map((d, idx) => (
          <span
            key={idx}
            className="text-[12px] font-medium text-brand-ink"
          >
            {d}
          </span>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-y-1 text-center">
        {cells.map((cell) => {
          const isPast = cell.iso < minDate;
          const isCheckIn = cell.iso === checkInDate;
          const isCheckOut = mode === "night" && cell.iso === checkOutDate;
          const isSelected = isCheckIn || isCheckOut;
          const isInRange =
            mode === "night" &&
            checkOutDate !== null &&
            cell.iso > checkInDate &&
            cell.iso < checkOutDate;

          return (
            <div
              key={cell.iso}
              className={`flex items-center justify-center ${
                isInRange ? "bg-brand-primary/10" : ""
              } ${
                isCheckIn && mode === "night" && checkOutDate
                  ? "rounded-l-full bg-brand-primary/10"
                  : ""
              } ${
                isCheckOut && mode === "night"
                  ? "rounded-r-full bg-brand-primary/10"
                  : ""
              }`}
            >
              <button
                type="button"
                disabled={isPast}
                onClick={() => handleDayClick(cell.iso)}
                className={`flex h-[32px] w-[32px] items-center justify-center rounded-full text-[12px] transition ${
                  isSelected
                    ? "cursor-pointer bg-brand-primary font-semibold text-white shadow-xs"
                    : isPast
                    ? "cursor-not-allowed text-brand-muted/40"
                    : !cell.inMonth
                    ? "cursor-pointer text-brand-muted/70 hover:bg-white"
                    : "cursor-pointer font-medium text-brand-ink hover:bg-white"
                }`}
              >
                {cell.day}
              </button>
            </div>
          );
        })}
      </div>

      {/* Selected date readout */}
      <div className="mt-3 flex items-center justify-between border-t border-brand-border/70 pt-2.5 text-[11px] text-brand-muted">
        {mode === "day" ? (
          <span>
            Selected day:{" "}
            <strong className="font-semibold text-brand-ink">
              {formatShortHumanDate(checkInDate)}
            </strong>
          </span>
        ) : (
          <>
            <span>
              In:{" "}
              <strong className="font-semibold text-brand-ink">
                {formatShortHumanDate(checkInDate)}
              </strong>
            </span>
            <span>
              Out:{" "}
              <strong className="font-semibold text-brand-ink">
                {formatShortHumanDate(checkOutDate)}
              </strong>
            </span>
          </>
        )}
      </div>
    </div>
  );
}
