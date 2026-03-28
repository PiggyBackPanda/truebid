"use client";

import { useEffect, useRef, useState } from "react";

interface CountdownTimerProps {
  closingDate: string; // ISO 8601 UTC
  onExpired?: () => void;
}

interface TimeComponents {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalMs: number;
}

function getTimeComponents(target: Date): TimeComponents {
  const diff = target.getTime() - Date.now();
  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, totalMs: diff };
  }
  return {
    days: Math.floor(diff / 86_400_000),
    hours: Math.floor((diff % 86_400_000) / 3_600_000),
    minutes: Math.floor((diff % 3_600_000) / 60_000),
    seconds: Math.floor((diff % 60_000) / 1_000),
    totalMs: diff,
  };
}

const SEVEN_DAYS_MS  = 7 * 24 * 60 * 60 * 1000;
const ONE_HOUR_MS    = 60 * 60 * 1000;
const FIFTEEN_MIN_MS = 15 * 60 * 1000;

export function CountdownTimer({ closingDate, onExpired }: CountdownTimerProps) {
  const [prevClosingDate, setPrevClosingDate] = useState(closingDate);
  const target = new Date(closingDate);
  const [time, setTime] = useState<TimeComponents>(() => getTimeComponents(target));
  const onExpiredRef = useRef(onExpired);
  useEffect(() => {
    onExpiredRef.current = onExpired;
  });

  // Derived state reset: when closingDate prop changes, reset time during render
  if (closingDate !== prevClosingDate) {
    setPrevClosingDate(closingDate);
    setTime(getTimeComponents(new Date(closingDate)));
  }

  useEffect(() => {
    const t = new Date(closingDate);
    const interval = setInterval(() => {
      const next = getTimeComponents(t);
      setTime(next);
      if (next.totalMs <= 0) {
        clearInterval(interval);
        onExpiredRef.current?.();
      }
    }, 1_000);

    return () => clearInterval(interval);
  }, [closingDate]);

  const pad = (n: number) => String(n).padStart(2, "0");

  // Expired
  if (time.totalMs <= 0) {
    return (
      <div className="text-center">
        <span className="text-red font-bold text-sm uppercase tracking-wider">
          CLOSED
        </span>
      </div>
    );
  }

  // More than 7 days: just show a date string
  if (time.totalMs > SEVEN_DAYS_MS) {
    const formatted = new Intl.DateTimeFormat("en-AU", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: "Australia/Perth",
    }).format(target);

    return (
      <p className="text-sm text-white/70">
        Closes <strong className="text-white">{formatted}</strong>
      </p>
    );
  }

  // Full countdown: colour shifts as closing approaches
  const isClosingSoon = time.totalMs <= FIFTEEN_MIN_MS;
  const isLastHour    = time.totalMs <= ONE_HOUR_MS;

  const numberClass = isClosingSoon
    ? "text-red animate-pulse"
    : isLastHour
    ? "text-amber"
    : "text-white";

  const labelText = isClosingSoon ? "CLOSING SOON" : "CLOSING IN";

  return (
    <div aria-live="polite" aria-atomic="true">
      <p className={`text-[10px] font-semibold uppercase tracking-widest mb-2 ${
        isClosingSoon ? "text-red" : "text-text-light"
      }`}>
        {labelText}
      </p>

      <div
        className={`font-mono tabular-nums text-[28px] font-bold leading-none ${numberClass} flex items-center gap-1`}
      >
        <span>{pad(time.days)}</span>
        <span className="opacity-40 text-lg">:</span>
        <span>{pad(time.hours)}</span>
        <span className="opacity-40 text-lg">:</span>
        <span>{pad(time.minutes)}</span>
        <span className="opacity-40 text-lg">:</span>
        <span>{pad(time.seconds)}</span>
      </div>

      <div className="flex gap-1 mt-1.5 text-[9px] uppercase tracking-widest text-text-light font-medium">
        {["DAYS", "HRS", "MIN", "SEC"].map((label) => (
          <span key={label} className="w-[34px] text-center first:ml-0">
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
