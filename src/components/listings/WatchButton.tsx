"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface WatchButtonProps {
  listingId: string;
  isLoggedIn: boolean;
  initialWatched: boolean;
}

export function WatchButton({ listingId, isLoggedIn, initialWatched }: WatchButtonProps) {
  const [watched, setWatched] = useState(initialWatched);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  async function handleClick() {
    if (!isLoggedIn) {
      setShowModal(true);
      return;
    }
    setLoading(true);
    const prev = watched;
    setWatched(!watched);
    try {
      const res = await fetch("/api/favourites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId }),
      });
      if (!res.ok) setWatched(prev);
    } catch {
      setWatched(prev);
    } finally {
      setLoading(false);
    }
  }

  const registerUrl = `/register?watch=${listingId}`;
  const loginUrl = `/login?callbackUrl=${encodeURIComponent(`/listings/${listingId}`)}`;

  return (
    <>
      <button
        onClick={handleClick}
        disabled={loading}
        aria-pressed={isLoggedIn ? watched : undefined}
        aria-label={watched ? "Stop watching this property" : "Watch this property"}
        className={[
          "flex items-center justify-center gap-2 px-5 py-4 rounded-[12px] border text-sm font-semibold whitespace-nowrap transition-colors",
          watched
            ? "bg-navy/5 border-navy/30 text-navy"
            : "bg-white border-border text-text hover:border-navy/30 hover:bg-navy/5",
          loading ? "opacity-60 cursor-not-allowed" : "",
        ].join(" ")}
      >
        <BellIcon filled={watched} />
        {watched ? "Watching" : "Watch"}
      </button>

      {showModal && (
        <WatchModal
          registerUrl={registerUrl}
          loginUrl={loginUrl}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}

// ── Bell SVG ─────────────────────────────────────────────────────────────────

function BellIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      width={16}
      height={16}
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

// ── Modal ─────────────────────────────────────────────────────────────────────

interface WatchModalProps {
  registerUrl: string;
  loginUrl: string;
  onClose: () => void;
}

function WatchModal({ registerUrl, loginUrl, onClose }: WatchModalProps) {
  const handleKey = useCallback(
    (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); },
    [onClose],
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [handleKey]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="watch-modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-navy/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Card */}
      <div className="relative bg-white rounded-[20px] shadow-2xl p-8 max-w-sm w-full">
        {/* Close */}
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 text-text-muted hover:text-text transition-colors p-1"
        >
          <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        {/* Icon */}
        <div className="flex justify-center mb-5">
          <div className="w-14 h-14 rounded-full bg-amber/10 flex items-center justify-center">
            <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="#e8a838" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          </div>
        </div>

        <h2
          id="watch-modal-title"
          className="font-serif text-xl text-navy text-center mb-2"
        >
          Watch this property
        </h2>
        <p className="text-sm text-text-muted text-center mb-6 leading-relaxed">
          Create a free account to get notified of new offers and price changes on this property.
        </p>

        <div className="flex flex-col gap-3">
          <Link
            href={registerUrl}
            className="block text-center bg-amber text-navy font-semibold text-sm py-3 rounded-[10px] hover:bg-amber/90 transition-colors"
          >
            Create account — free
          </Link>
          <Link
            href={loginUrl}
            className="block text-center border border-border text-text font-medium text-sm py-3 rounded-[10px] hover:bg-bg transition-colors"
          >
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
