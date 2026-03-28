"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? ""
);

interface Props {
  status: string;
}

export function VerifyClient({ status }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canStart = status === "UNVERIFIED" || status === "FAILED";

  async function handleVerify() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/verification/start", { method: "POST" });
      const data = (await res.json()) as { clientSecret?: string; error?: string };

      if (!res.ok || !data.clientSecret) {
        setError(data.error ?? "Could not start verification. Please try again.");
        return;
      }

      const stripe = await stripePromise;
      if (!stripe) {
        setError("Stripe failed to load. Please refresh and try again.");
        return;
      }

      const { error: stripeError } = await stripe.verifyIdentity(data.clientSecret);

      if (stripeError) {
        if (stripeError.code !== "session_cancelled") {
          setError(stripeError.message ?? "Verification could not be completed.");
        }
      } else {
        // Reload to show updated status from server
        router.refresh();
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (!canStart) return null;

  return (
    <div>
      <button
        onClick={handleVerify}
        disabled={loading}
        style={{
          background: loading ? "#d1a040" : "#f59e0b",
          color: "#1a0f00",
          fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          fontSize: 14,
          fontWeight: 600,
          padding: "12px 28px",
          borderRadius: 10,
          border: "none",
          cursor: loading ? "wait" : "pointer",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        {loading ? (
          <>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              style={{ animation: "spin 0.8s linear infinite" }}
            >
              <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
              <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </svg>
            Starting verification…
          </>
        ) : (
          "Verify your identity"
        )}
      </button>

      {error && (
        <p
          style={{
            marginTop: 12,
            fontSize: 13,
            color: "#dc2626",
            fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          }}
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
}
