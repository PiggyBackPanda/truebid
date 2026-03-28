"use client";

import { useState } from "react";

interface AskOwnerModalProps {
  listingId: string;
  sellerFirstName: string;
}

const URL_PATTERN = /https?:\/\/|www\./i;

export function AskOwnerModal({ listingId, sellerFirstName }: AskOwnerModalProps) {
  const [open, setOpen] = useState(false);
  const [senderName, setSenderName] = useState("");
  const [senderEmail, setSenderEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function openModal() {
    setOpen(true);
  }

  function closeModal() {
    setOpen(false);
    if (success) {
      setSenderName("");
      setSenderEmail("");
      setMessage("");
      setSuccess(false);
      setError(null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const trimmedMessage = message.trim();
    if (!senderName.trim() || !senderEmail.trim() || !trimmedMessage) return;

    if (URL_PATTERN.test(trimmedMessage)) {
      setError("Links are not allowed in messages for security reasons.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/listings/${listingId}/enquiry`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderName: senderName.trim(),
          senderEmail: senderEmail.trim(),
          message: trimmedMessage,
        }),
      });

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
    <>
      {/* Trigger button */}
      <button
        type="button"
        onClick={openModal}
        className="inline-flex items-center gap-2 border border-border bg-white text-navy font-semibold text-sm px-5 py-3 rounded-[12px] hover:border-slate hover:bg-bg transition-colors"
      >
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
        </svg>
        Ask the Owner
      </button>

      {/* Modal overlay */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(15,26,46,0.5)" }}
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div
            className="bg-white rounded-[16px] w-full shadow-xl"
            style={{ maxWidth: 480 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-border">
              <h2 className="font-serif text-lg text-navy">Send a Message to the Owner</h2>
              <button
                type="button"
                onClick={closeModal}
                className="text-text-muted hover:text-text transition-colors"
                aria-label="Close"
              >
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="px-6 py-5">
              {success ? (
                <div className="text-center py-4">
                  <svg className="mx-auto mb-3" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                  <p className="text-base font-semibold text-navy mb-1">Message sent!</p>
                  <p className="text-sm text-text-muted">
                    {sellerFirstName} will receive your message by email.
                  </p>
                  <button
                    type="button"
                    onClick={closeModal}
                    className="mt-5 bg-amber text-navy font-semibold text-sm px-6 py-3 rounded-[10px] hover:bg-amber-light transition-colors"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  <p className="text-sm text-text-muted">
                    Your message will be emailed to {sellerFirstName}, the owner of this property.
                  </p>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-text">Your Name</label>
                    <input
                      type="text"
                      required
                      value={senderName}
                      onChange={(e) => setSenderName(e.target.value)}
                      placeholder="e.g. Jane Smith"
                      maxLength={100}
                      className="w-full bg-white border border-border rounded-[10px] px-4 py-2.5 text-sm text-text placeholder:text-text-light focus:outline-none focus:ring-2 focus:ring-sky/20 focus:border-sky transition-colors"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-text">Your Email</label>
                    <input
                      type="email"
                      required
                      value={senderEmail}
                      onChange={(e) => setSenderEmail(e.target.value)}
                      placeholder="e.g. jane@example.com"
                      maxLength={200}
                      className="w-full bg-white border border-border rounded-[10px] px-4 py-2.5 text-sm text-text placeholder:text-text-light focus:outline-none focus:ring-2 focus:ring-sky/20 focus:border-sky transition-colors"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-text">Message</label>
                    <textarea
                      required
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Hi, I'd like to ask about..."
                      rows={4}
                      maxLength={1000}
                      className="w-full bg-white border border-border rounded-[10px] px-4 py-2.5 text-sm text-text placeholder:text-text-light focus:outline-none focus:ring-2 focus:ring-sky/20 focus:border-sky transition-colors resize-none"
                    />
                  </div>

                  {error && (
                    <p className="text-xs text-red">{error}</p>
                  )}

                  <button
                    type="submit"
                    disabled={
                      submitting ||
                      !senderName.trim() ||
                      !senderEmail.trim() ||
                      !message.trim()
                    }
                    className="w-full bg-amber text-navy font-semibold text-sm py-3 rounded-[10px] hover:bg-amber-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? "Sending..." : "Send Message"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
