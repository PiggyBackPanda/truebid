"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";

interface ContactSellerFormProps {
  listingId: string;
  sellerId: string;
  sellerFirstName: string;
}

const URL_PATTERN = /https?:\/\/|www\./i;
const MAX_LENGTH = 2000;

export function ContactSellerForm({
  listingId,
  sellerId,
  sellerFirstName,
}: ContactSellerFormProps) {
  const { status } = useSession();
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (status !== "authenticated") {
    return (
      <div className="bg-white border border-border rounded-[16px] p-5">
        <p className="text-sm font-semibold text-navy mb-3">
          Ask {sellerFirstName} a question
        </p>
        <a
          href="/login"
          className="block w-full text-center bg-navy/5 text-navy font-semibold text-sm py-3 rounded-[10px] hover:bg-navy/10 transition-colors"
        >
          Log in to message the seller
        </a>
      </div>
    );
  }

  if (success) {
    return (
      <div className="bg-white border border-border rounded-[16px] p-5">
        <p className="text-sm font-semibold text-navy mb-3">
          Ask {sellerFirstName} a question
        </p>
        <div className="bg-green-50 border border-green-200 rounded-[10px] p-4 text-center">
          <svg
            className="mx-auto mb-2"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#15803d"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          <p className="text-sm text-green-800 font-medium">
            Message sent! {sellerFirstName} will be notified.
          </p>
        </div>
        <button
          onClick={() => {
            setSuccess(false);
            setContent("");
            setError(null);
          }}
          className="mt-3 w-full text-center text-sm text-navy/60 hover:text-navy transition-colors"
        >
          Send another message
        </button>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const trimmed = content.trim();
    if (!trimmed) return;

    if (URL_PATTERN.test(trimmed)) {
      setError("Links are not allowed in messages for security reasons.");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientId: sellerId,
          listingId,
          content: trimmed,
        }),
      });

      if (res.status === 401) {
        window.location.href = "/login";
        return;
      }

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setError(data.error ?? "Failed to send message. Please try again.");
        return;
      }

      setSuccess(true);
    } catch {
      setError("Failed to send message. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-white border border-border rounded-[16px] p-5">
      <p className="text-sm font-semibold text-navy mb-3">
        Ask {sellerFirstName} a question
      </p>
      <form onSubmit={handleSubmit}>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Hi, I have a question about this property..."
          rows={4}
          maxLength={MAX_LENGTH}
          className="w-full border border-border rounded-[10px] p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber/50 font-[family-name:var(--font-outfit)]"
        />
        <div className="flex items-center justify-between mt-1 mb-3">
          {error ? (
            <p className="text-xs text-red-600">{error}</p>
          ) : (
            <span />
          )}
          <p className="text-xs text-text-muted">
            {content.length.toLocaleString()} / {MAX_LENGTH.toLocaleString()}
          </p>
        </div>
        <button
          type="submit"
          disabled={!content.trim() || submitting}
          className="w-full bg-amber text-navy font-semibold text-sm py-3 rounded-[10px] hover:bg-amber-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? "Sending..." : "Send Message"}
        </button>
      </form>
    </div>
  );
}
