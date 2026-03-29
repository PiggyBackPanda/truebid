"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { loadStripe } from "@stripe/stripe-js";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? ""
);

interface Props {
  status: string;
  biometricConsentGiven?: boolean;
}

export function VerifyClient({ status, biometricConsentGiven = false }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [devBypassing, setDevBypassing] = useState(false);
  const [consentGiven, setConsentGiven] = useState(biometricConsentGiven);
  const [recordingConsent, setRecordingConsent] = useState(false);

  const canStart = status === "UNVERIFIED" || status === "FAILED";
  const isDev = process.env.NODE_ENV === "development";

  async function handleGiveConsent() {
    setRecordingConsent(true);
    try {
      await fetch("/api/verification/consent", { method: "POST" });
      setConsentGiven(true);
    } catch {
      setConsentGiven(true);
    } finally {
      setRecordingConsent(false);
    }
  }

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

  async function handleDevBypass() {
    setDevBypassing(true);
    setError(null);
    try {
      const res = await fetch("/api/verify-identity/dev-bypass", { method: "POST" });
      if (res.ok) {
        router.refresh();
      } else {
        const data = (await res.json()) as { error?: string };
        setError(data.error ?? "Dev bypass failed.");
      }
    } catch {
      setError("Dev bypass failed.");
    } finally {
      setDevBypassing(false);
    }
  }

  if (!canStart) return null;

  // Show consent screen if consent has not yet been given
  if (!consentGiven) {
    return (
      <div
        style={{
          background: "#f9f8f6",
          border: "1px solid #e5e2db",
          borderRadius: 12,
          padding: "20px 24px",
          marginBottom: 16,
        }}
      >
        <h3
          style={{
            fontFamily: "Georgia, 'Times New Roman', serif",
            fontSize: 17,
            fontWeight: 400,
            color: "#0f1623",
            marginBottom: 12,
          }}
        >
          Identity Verification — Your Privacy Rights
        </h3>
        <div style={{ fontSize: 13, color: "#334766", lineHeight: 1.7 }}>
          <p style={{ margin: "0 0 10px" }}>
            To place offers on TrueBid, we are required to verify your identity.
            This process is handled by Stripe Identity, a third-party identity verification service.
          </p>
          <p style={{ margin: "0 0 6px", fontWeight: 600, color: "#0f1623" }}>During verification, Stripe will collect:</p>
          <ul style={{ margin: "0 0 10px", paddingLeft: 18 }}>
            <li>A copy of your government-issued photo ID (passport or driver&apos;s licence)</li>
            <li>A selfie or liveness check (biometric facial data)</li>
            <li>The personal information contained in your ID document</li>
          </ul>
          <p style={{ margin: "0 0 10px" }}>
            This data is processed and stored by Stripe, Inc. (United States).
            TrueBid receives a verification result only and does not store copies of your ID or biometric data.
          </p>
          <p style={{ margin: "0 0 10px" }}>
            To request deletion of your identity verification data, contact{" "}
            <a href="mailto:hello@truebid.com.au" style={{ color: "#b45309" }}>
              hello@truebid.com.au
            </a>
          </p>
          <p style={{ margin: 0, fontStyle: "italic", color: "#0f1623" }}>
            By proceeding, you consent to the collection and processing of your biometric and
            identity document data by Stripe for the purpose of verifying your identity on TrueBid.
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
          <button
            type="button"
            onClick={handleGiveConsent}
            disabled={recordingConsent}
            style={{
              flex: 1,
              padding: "11px 16px",
              background: recordingConsent ? "#d1a040" : "#f59e0b",
              color: "#1a0f00",
              border: "none",
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 600,
              cursor: recordingConsent ? "wait" : "pointer",
              fontFamily: "var(--font-sans)",
            }}
          >
            {recordingConsent ? "Recording consent…" : "I Consent — Continue to Verification"}
          </button>
          <Link
            href="/dashboard"
            style={{
              flex: 1,
              padding: "11px 16px",
              background: "#0f1623",
              color: "#ffffff",
              border: "none",
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
              fontFamily: "var(--font-sans)",
              textDecoration: "none",
              textAlign: "center",
            }}
          >
            No Thanks — Go Back
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={handleVerify}
        disabled={loading}
        style={{
          background: loading ? "#d1a040" : "#f59e0b",
          color: "#1a0f00",
          fontFamily: "var(--font-sans)",
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
            fontFamily: "var(--font-sans)",
          }}
          role="alert"
        >
          {error}
        </p>
      )}

      {isDev && (
        <div
          style={{
            marginTop: 20,
            padding: "16px",
            background: "#1a1a2e",
            borderRadius: 10,
            border: "1px dashed #6366f1",
          }}
        >
          <p
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "#a5b4fc",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginBottom: 10,
              fontFamily: "var(--font-sans)",
            }}
          >
            Development only
          </p>
          <button
            type="button"
            onClick={handleDevBypass}
            disabled={devBypassing}
            style={{
              width: "100%",
              padding: "10px",
              background: devBypassing ? "#374151" : "#4f46e5",
              color: "#ffffff",
              border: "none",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              cursor: devBypassing ? "not-allowed" : "pointer",
              fontFamily: "var(--font-sans)",
            }}
          >
            {devBypassing ? "Setting verified…" : "Dev: Mark as Verified"}
          </button>
        </div>
      )}
    </div>
  );
}
