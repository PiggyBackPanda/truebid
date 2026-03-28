"use client";

import { useState } from "react";

interface Props {
  suburb?: string;
  propertyType?: string;
  saleMethod?: string;
  minPrice?: string;
  maxPrice?: string;
  minBeds?: string;
  minBaths?: string;
  isLoggedIn: boolean;
}

export function SaveSearchButton({
  suburb,
  propertyType,
  saleMethod,
  minPrice,
  maxPrice,
  minBeds,
  minBaths,
  isLoggedIn,
}: Props) {
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  const hasFilters = !!(suburb || propertyType || saleMethod || minPrice || maxPrice || minBeds || minBaths);
  if (!hasFilters) return null;

  if (!isLoggedIn) {
    return (
      <a
        href="/login"
        className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-text transition-colors"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
        </svg>
        Save search
      </a>
    );
  }

  async function handleSave() {
    if (status === "saving" || status === "saved") return;
    setStatus("saving");

    // Build a readable name from the filters
    const parts: string[] = [];
    if (suburb) parts.push(suburb);
    if (propertyType) parts.push(propertyType.charAt(0) + propertyType.slice(1).toLowerCase());
    if (minBeds) parts.push(`${minBeds}+ bed`);
    if (minPrice || maxPrice) {
      const fmt = (cents: string) => `$${(parseInt(cents, 10) / 100 / 1000).toFixed(0)}k`;
      if (minPrice && maxPrice) parts.push(`${fmt(minPrice)}-${fmt(maxPrice)}`);
      else if (minPrice) parts.push(`${fmt(minPrice)}+`);
      else if (maxPrice) parts.push(`under ${fmt(maxPrice!)}`);
    }
    const name = parts.length > 0 ? parts.join(", ") : "Search";

    try {
      const res = await fetch("/api/saved-searches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          suburb: suburb || undefined,
          propertyType: propertyType || undefined,
          saleMethod: saleMethod || undefined,
          minPriceCents: minPrice ? parseInt(minPrice, 10) : undefined,
          maxPriceCents: maxPrice ? parseInt(maxPrice, 10) : undefined,
          minBeds: minBeds ? parseInt(minBeds, 10) : undefined,
          minBaths: minBaths ? parseInt(minBaths, 10) : undefined,
        }),
      });

      if (res.ok) {
        setStatus("saved");
      } else {
        const data = await res.json() as { code?: string };
        if (data.code === "LIMIT_REACHED") {
          alert("You have reached the maximum of 20 saved searches. Remove an existing one to save this search.");
        }
        setStatus("idle");
      }
    } catch {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 3000);
    }
  }

  if (status === "saved") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-green font-medium">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points="20,6 9,17 4,12" />
        </svg>
        Search saved
      </span>
    );
  }

  return (
    <button
      onClick={handleSave}
      disabled={status === "saving"}
      className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-text transition-colors disabled:opacity-50"
    >
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
      </svg>
      {status === "saving" ? "Saving..." : "Save this search"}
    </button>
  );
}
