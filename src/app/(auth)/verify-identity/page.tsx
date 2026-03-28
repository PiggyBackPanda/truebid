"use client";

import { Suspense, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

// ── Types ─────────────────────────────────────────────────────────────────────

type Step = "explain" | "upload" | "submitted";

type FileState = {
  file: File | null;
  preview: string | null;
};

// ── Helper: file input with drag-and-drop preview ────────────────────────────

function DocumentUpload({
  label,
  hint,
  value,
  onChange,
  disabled,
}: {
  label: string;
  hint: string;
  value: FileState;
  onChange: (state: FileState) => void;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      onChange({ file, preview: e.target?.result as string });
    };
    reader.readAsDataURL(file);
  }

  return (
    <div>
      <p style={{ fontSize: 13, fontWeight: 600, color: "#0f1623", marginBottom: 6, fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
        {label}
      </p>
      <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 10 }}>{hint}</p>

      {value.preview ? (
        <div style={{ position: "relative" }}>
          {/* eslint-disable-next-line @next/next/no-img-element -- blob preview URL, not suitable for next/image */}
          <img
            src={value.preview}
            alt={label}
            style={{
              width: "100%",
              height: 160,
              objectFit: "cover",
              borderRadius: 10,
              border: "2px solid #16a34a",
            }}
          />
          {!disabled && (
            <button
              type="button"
              onClick={() => onChange({ file: null, preview: null })}
              style={{
                position: "absolute",
                top: 8,
                right: 8,
                background: "rgba(0,0,0,0.6)",
                color: "#fff",
                border: "none",
                borderRadius: "50%",
                width: 28,
                height: 28,
                cursor: "pointer",
                fontSize: 14,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              ×
            </button>
          )}
          <div
            style={{
              position: "absolute",
              bottom: 8,
              left: 8,
              background: "#16a34a",
              color: "#fff",
              fontSize: 11,
              fontWeight: 600,
              padding: "3px 8px",
              borderRadius: 6,
            }}
          >
            ✓ Selected
          </div>
        </div>
      ) : (
        <button
          type="button"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
          style={{
            width: "100%",
            height: 120,
            border: "2px dashed #d1d5db",
            borderRadius: 10,
            background: "#f9f8f6",
            cursor: disabled ? "not-allowed" : "pointer",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            transition: "border-color 0.15s",
          }}
        >
          <span style={{ fontSize: 28 }}>📷</span>
          <span style={{ fontSize: 13, color: "#6b7280", fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
            Tap to choose a photo
          </span>
          <span style={{ fontSize: 11, color: "#9ca3af" }}>JPEG, PNG, WebP or HEIC</span>
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp,image/heic,image/heif"
        style={{ display: "none" }}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
        }}
      />
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

function VerifyIdentityContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo") ?? "/dashboard";

  const user = session?.user as Record<string, unknown> | undefined;
  const verificationStatus = user?.verificationStatus as string | undefined;

  const [step, setStep] = useState<Step>("explain");
  const [licence, setLicence] = useState<FileState>({ file: null, preview: null });
  const [selfie, setSelfie] = useState<FileState>({ file: null, preview: null });
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [devBypassing, setDevBypassing] = useState(false);

  const isDev = process.env.NODE_ENV === "development";

  async function handleDevBypass() {
    setDevBypassing(true);
    try {
      const res = await fetch("/api/verify-identity/dev-bypass", { method: "POST" });
      if (res.ok) {
        // Reload so the session re-fetches the updated verificationStatus
        window.location.href = returnTo;
      } else {
        const data = await res.json() as { error?: string };
        setError(data.error ?? "Dev bypass failed.");
      }
    } catch {
      setError("Dev bypass failed.");
    } finally {
      setDevBypassing(false);
    }
  }

  // Redirect unauthenticated users
  if (status === "unauthenticated") {
    router.replace(`/login?callbackUrl=/verify-identity`);
    return null;
  }

  if (status === "loading") {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
        <div style={{ width: 32, height: 32, border: "3px solid #f59e0b", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      </div>
    );
  }

  // Already verified
  if (verificationStatus === "VERIFIED") {
    return (
      <div
        style={{
          width: "100%",
          maxWidth: 480,
          background: "#ffffff",
          border: "1px solid #e5e2db",
          borderRadius: 16,
          padding: "40px",
          boxShadow: "0 1px 3px rgba(15,22,35,0.06)",
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: "50%",
            background: "#dcfce7",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 28,
            margin: "0 auto 20px",
          }}
        >
          ✓
        </div>
        <h1
          style={{
            fontFamily: "Georgia, 'Times New Roman', serif",
            fontSize: 26,
            color: "#0f1623",
            marginBottom: 10,
            letterSpacing: "-0.02em",
          }}
        >
          You&apos;re already verified
        </h1>
        <p style={{ color: "#6b7280", fontSize: 14, marginBottom: 28, lineHeight: 1.6 }}>
          Your identity has been verified. You can list properties and place offers on TrueBid.
        </p>
        <Link
          href={returnTo}
          style={{
            display: "inline-block",
            background: "#f59e0b",
            color: "#1a0f00",
            fontWeight: 600,
            fontSize: 14,
            padding: "12px 28px",
            borderRadius: 10,
            textDecoration: "none",
          }}
        >
          Continue →
        </Link>
      </div>
    );
  }

  // Already pending
  if (verificationStatus === "PENDING" && step !== "submitted") {
    return (
      <div
        style={{
          width: "100%",
          maxWidth: 480,
          background: "#ffffff",
          border: "1px solid #e5e2db",
          borderRadius: 16,
          padding: "40px",
          boxShadow: "0 1px 3px rgba(15,22,35,0.06)",
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: "50%",
            background: "#fef9c3",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 28,
            margin: "0 auto 20px",
          }}
        >
          ⏳
        </div>
        <h1
          style={{
            fontFamily: "Georgia, 'Times New Roman', serif",
            fontSize: 26,
            color: "#0f1623",
            marginBottom: 10,
            letterSpacing: "-0.02em",
          }}
        >
          Under review
        </h1>
        <p style={{ color: "#6b7280", fontSize: 14, marginBottom: 8, lineHeight: 1.6 }}>
          Your documents are being reviewed by our team. This usually takes less than 24 hours.
        </p>
        <p style={{ color: "#6b7280", fontSize: 13, marginBottom: 28 }}>
          We&apos;ll email you at <strong style={{ color: "#0f1623" }}>{user?.email as string}</strong> once approved.
        </p>
        <Link
          href="/dashboard"
          style={{
            display: "inline-block",
            background: "#0f1623",
            color: "#ffffff",
            fontWeight: 500,
            fontSize: 14,
            padding: "12px 28px",
            borderRadius: 10,
            textDecoration: "none",
          }}
        >
          Go to dashboard
        </Link>
      </div>
    );
  }

  // Submitted (just now)
  if (step === "submitted") {
    return (
      <div
        style={{
          width: "100%",
          maxWidth: 480,
          background: "#ffffff",
          border: "1px solid #e5e2db",
          borderRadius: 16,
          padding: "40px",
          boxShadow: "0 1px 3px rgba(15,22,35,0.06)",
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: "50%",
            background: "#dcfce7",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 28,
            margin: "0 auto 20px",
          }}
        >
          ✓
        </div>
        <h1
          style={{
            fontFamily: "Georgia, 'Times New Roman', serif",
            fontSize: 26,
            color: "#0f1623",
            marginBottom: 10,
            letterSpacing: "-0.02em",
          }}
        >
          Documents submitted
        </h1>
        <p style={{ color: "#6b7280", fontSize: 14, marginBottom: 8, lineHeight: 1.6 }}>
          Thanks! Our team will review your identity documents, usually within 24 hours.
        </p>
        <p style={{ color: "#6b7280", fontSize: 13, marginBottom: 28 }}>
          We&apos;ll email you at <strong style={{ color: "#0f1623" }}>{user?.email as string}</strong> once approved.
        </p>
        <Link
          href={returnTo}
          style={{
            display: "inline-block",
            background: "#f59e0b",
            color: "#1a0f00",
            fontWeight: 600,
            fontSize: 14,
            padding: "12px 28px",
            borderRadius: 10,
            textDecoration: "none",
          }}
        >
          Continue →
        </Link>
      </div>
    );
  }

  // ── Step 1: Explanation ──────────────────────────────────────────────────────

  if (step === "explain") {
    return (
      <div
        style={{
          width: "100%",
          maxWidth: 520,
          background: "#ffffff",
          border: "1px solid #e5e2db",
          borderRadius: 16,
          padding: "40px",
          boxShadow: "0 1px 3px rgba(15,22,35,0.06), 0 4px 12px rgba(15,22,35,0.04)",
        }}
      >
        {/* Logo */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 28 }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: "#f59e0b",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "Georgia, 'Times New Roman', serif",
                fontSize: 16,
                fontWeight: 700,
                color: "#0f1623",
              }}
            >
              T
            </div>
            <span
              style={{
                fontFamily: "Georgia, 'Times New Roman', serif",
                fontSize: 20,
                color: "#0f1623",
                letterSpacing: "-0.02em",
              }}
            >
              TrueBid
            </span>
          </Link>
        </div>

        {/* Shield icon */}
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: "#eff6ff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 24,
            margin: "0 auto 20px",
          }}
        >
          🛡️
        </div>

        <h1
          style={{
            fontFamily: "Georgia, 'Times New Roman', serif",
            fontSize: 28,
            fontWeight: 400,
            color: "#0f1623",
            textAlign: "center",
            marginBottom: 8,
            letterSpacing: "-0.02em",
          }}
        >
          Verify your identity
        </h1>
        <p style={{ textAlign: "center", color: "#6b7280", fontSize: 14, marginBottom: 28, lineHeight: 1.6 }}>
          TrueBid requires identity verification before you can list a property or place an offer. This keeps our platform trustworthy for everyone.
        </p>

        {/* What you'll need */}
        <div
          style={{
            background: "#f9f8f6",
            border: "1px solid #e5e2db",
            borderRadius: 12,
            padding: "20px 24px",
            marginBottom: 20,
          }}
        >
          <p
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: "#6b7280",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              marginBottom: 14,
            }}
          >
            What you&apos;ll need
          </p>
          {[
            { icon: "🪪", title: "Driver's licence", desc: "Current Australian driver's licence (front side)" },
            { icon: "🤳", title: "Selfie photo", desc: "A clear, recent photo of your face in good lighting" },
          ].map(({ icon, title, desc }) => (
            <div key={title} style={{ display: "flex", gap: 14, marginBottom: 14, alignItems: "flex-start" }}>
              <span style={{ fontSize: 22, flexShrink: 0 }}>{icon}</span>
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: "#0f1623", marginBottom: 2, fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>{title}</p>
                <p style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.5 }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* How it works */}
        <div
          style={{
            background: "#f0fdf4",
            border: "1px solid #bbf7d0",
            borderRadius: 12,
            padding: "16px 20px",
            marginBottom: 28,
          }}
        >
          <p style={{ fontSize: 13, color: "#15803d", lineHeight: 1.6 }}>
            <strong>Manual review:</strong> Our team checks your documents privately. Usually approved within 24 hours. Your documents are stored securely and never shared publicly.
          </p>
        </div>

        {error && (
          <div
            role="alert"
            style={{
              background: "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: 8,
              padding: "10px 14px",
              marginBottom: 16,
              color: "#dc2626",
              fontSize: 13,
            }}
          >
            {error}
          </div>
        )}

        <Button
          size="lg"
          onClick={() => setStep("upload")}
          className="w-full"
        >
          Continue to upload →
        </Button>

        <p style={{ textAlign: "center", fontSize: 12, color: "#9ca3af", marginTop: 16 }}>
          Already verified?{" "}
          <Link href="/dashboard" style={{ color: "#4a90d9", textDecoration: "none" }}>
            Go to dashboard
          </Link>
        </p>

        {isDev && (
          <div
            style={{
              marginTop: 24,
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
                fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
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
                fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
              }}
            >
              {devBypassing ? "Setting verified…" : "Dev: Mark as Verified"}
            </button>
          </div>
        )}
      </div>
    );
  }

  // ── Step 2: Upload ───────────────────────────────────────────────────────────

  const canSubmit = licence.file !== null && selfie.file !== null;

  async function handleSubmit() {
    if (!licence.file || !selfie.file) return;
    setError("");
    setUploading(true);

    try {
      // Step 1: get presigned upload URLs
      const urlRes = await fetch("/api/verify-identity/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          licenceContentType: licence.file.type || "image/jpeg",
          selfieContentType: selfie.file.type || "image/jpeg",
        }),
      });

      if (!urlRes.ok) {
        const data = await urlRes.json() as { error?: string };
        setError(data.error ?? "Failed to prepare upload. Please try again.");
        return;
      }

      const { licence: licenceUpload, selfie: selfieUpload } = await urlRes.json() as {
        licence: { uploadUrl: string; key: string };
        selfie: { uploadUrl: string; key: string };
      };

      // Step 2: upload files directly to S3
      const [licenceUploadRes, selfieUploadRes] = await Promise.all([
        fetch(licenceUpload.uploadUrl, {
          method: "PUT",
          body: licence.file,
          headers: { "Content-Type": licence.file.type || "image/jpeg" },
        }),
        fetch(selfieUpload.uploadUrl, {
          method: "PUT",
          body: selfie.file,
          headers: { "Content-Type": selfie.file.type || "image/jpeg" },
        }),
      ]);

      if (!licenceUploadRes.ok || !selfieUploadRes.ok) {
        setError("Upload failed. Please check your connection and try again.");
        return;
      }

      // Step 3: submit keys to mark verification as PENDING
      const submitRes = await fetch("/api/verify-identity/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          licenceKey: licenceUpload.key,
          selfieKey: selfieUpload.key,
        }),
      });

      if (!submitRes.ok) {
        const data = await submitRes.json() as { error?: string };
        setError(data.error ?? "Submission failed. Please try again.");
        return;
      }

      setStep("submitted");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div
      style={{
        width: "100%",
        maxWidth: 520,
        background: "#ffffff",
        border: "1px solid #e5e2db",
        borderRadius: 16,
        padding: "40px",
        boxShadow: "0 1px 3px rgba(15,22,35,0.06), 0 4px 12px rgba(15,22,35,0.04)",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
        <button
          type="button"
          onClick={() => setStep("explain")}
          disabled={uploading}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#6b7280",
            fontSize: 18,
            padding: 0,
            lineHeight: 1,
          }}
        >
          ←
        </button>
        <div>
          <h1
            style={{
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontSize: 22,
              color: "#0f1623",
              marginBottom: 2,
              letterSpacing: "-0.02em",
            }}
          >
            Upload your documents
          </h1>
          <p style={{ color: "#6b7280", fontSize: 13 }}>
            Both photos are required for verification
          </p>
        </div>
      </div>

      {/* Upload fields */}
      <div style={{ display: "flex", flexDirection: "column", gap: 24, marginBottom: 24 }}>
        <DocumentUpload
          label="Driver's licence (front)"
          hint="Lay your licence flat, ensure all text is clearly readable, no glare."
          value={licence}
          onChange={setLicence}
          disabled={uploading}
        />
        <DocumentUpload
          label="Selfie photo"
          hint="Face the camera directly in good lighting. No filters or sunglasses."
          value={selfie}
          onChange={setSelfie}
          disabled={uploading}
        />
      </div>

      {/* Privacy notice */}
      <div
        style={{
          background: "#f9f8f6",
          borderRadius: 10,
          padding: "12px 16px",
          marginBottom: 20,
        }}
      >
        <p style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.5 }}>
          🔒 Your documents are stored securely on encrypted servers and are only accessed by our verification team. They will never be shared publicly.
        </p>
      </div>

      {error && (
        <div
          role="alert"
          style={{
            background: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: 8,
            padding: "10px 14px",
            marginBottom: 16,
            color: "#dc2626",
            fontSize: 13,
          }}
        >
          {error}
        </div>
      )}

      <Button
        size="lg"
        onClick={handleSubmit}
        disabled={!canSubmit}
        loading={uploading}
        className="w-full"
      >
        {uploading ? "Uploading…" : "Submit for review"}
      </Button>

      <p style={{ textAlign: "center", fontSize: 12, color: "#9ca3af", marginTop: 12 }}>
        By submitting, you confirm these documents belong to you.
      </p>
    </div>
  );
}

export default function VerifyIdentityPage() {
  return (
    <Suspense>
      <VerifyIdentityContent />
    </Suspense>
  );
}
