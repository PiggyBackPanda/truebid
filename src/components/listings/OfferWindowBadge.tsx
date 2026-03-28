"use client";

import { useEffect, useState } from "react";

interface OfferWindowBadgeProps {
  status: string;
  closingDate: Date | string | null;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function formatCloseTime(date: Date): string {
  const day = WEEKDAYS[date.getDay()];
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  const mm = minutes.toString().padStart(2, "0");
  return `${day} ${hours}:${mm} ${ampm} AWST`;
}

function computeCountdown(closingDate: Date): { hoursLeft: number; minsLeft: number; msLeft: number } {
  const msLeft = closingDate.getTime() - Date.now();
  const totalMins = Math.floor(msLeft / 60_000);
  const hoursLeft = Math.floor(totalMins / 60);
  const minsLeft = totalMins % 60;
  return { hoursLeft, minsLeft, msLeft };
}

export function OfferWindowBadge({ status, closingDate }: OfferWindowBadgeProps) {
  const [, setTick] = useState(0);

  useEffect(() => {
    if (status !== "ACTIVE" || !closingDate) return;
    const interval = setInterval(() => setTick((n) => n + 1), 30_000);
    return () => clearInterval(interval);
  }, [status, closingDate]);

  if (status === "UNDER_OFFER") {
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
        Under offer
      </span>
    );
  }

  if (status === "SOLD") {
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
        Sold
      </span>
    );
  }

  if (status === "COMING_SOON") {
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate/10 text-slate">
        Coming soon
      </span>
    );
  }

  if (status === "ACTIVE" && closingDate) {
    const date = closingDate instanceof Date ? closingDate : new Date(closingDate);
    const { hoursLeft, minsLeft, msLeft } = computeCountdown(date);

    if (msLeft <= 0) return null;

    const moreThan24h = msLeft > 24 * 60 * 60 * 1_000;

    if (moreThan24h) {
      return (
        <span className="text-xs text-text-muted">
          Offers open · Closes {formatCloseTime(date)}
        </span>
      );
    }

    // Within 24 hours
    const countdownText =
      hoursLeft >= 1
        ? `${hoursLeft} hr${hoursLeft !== 1 ? "s" : ""} ${minsLeft} min${minsLeft !== 1 ? "s" : ""}`
        : `${minsLeft} min${minsLeft !== 1 ? "s" : ""}`;

    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber/10 text-amber-900">
        Closing soon · {countdownText}
      </span>
    );
  }

  return null;
}
