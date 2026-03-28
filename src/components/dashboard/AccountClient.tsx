"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────

type User = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  verificationStatus: string;
};

type NotifPrefs = {
  newOffers: boolean;
  offerUpdates: boolean;
  messages: boolean;
  listingActivity: boolean;
};

type Props = {
  user: User;
  notificationPrefs: NotifPrefs;
};

// ─── Shared UI helpers ────────────────────────────────────────────────────────

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #e5e2db",
        borderRadius: 12,
        padding: "28px 32px",
        boxShadow: "0 1px 3px rgba(15,22,35,0.06), 0 4px 12px rgba(15,22,35,0.04)",
      }}
    >
      <h2
        style={{
          fontFamily: "Georgia, 'Times New Roman', serif",
          fontSize: 20,
          fontWeight: 400,
          color: "#0f1623",
          letterSpacing: "-0.01em",
          marginBottom: 24,
        }}
      >
        {title}
      </h2>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label
        style={{
          fontSize: 13,
          fontWeight: 500,
          color: "#334766",
          fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  border: "1px solid #e5e2db",
  borderRadius: 10,
  padding: "11px 14px",
  fontSize: 14,
  fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  color: "#1a1a1a",
  background: "#ffffff",
  outline: "none",
  width: "100%",
  boxSizing: "border-box",
};

const inputDisabledStyle: React.CSSProperties = {
  ...inputStyle,
  background: "#f7f5f0",
  color: "#6b7280",
  cursor: "not-allowed",
};

function SaveButton({ loading, onClick }: { loading: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      style={{
        background: loading ? "#e5e2db" : "#0f1623",
        color: "#ffffff",
        border: "none",
        borderRadius: 10,
        padding: "11px 28px",
        fontSize: 14,
        fontWeight: 600,
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        cursor: loading ? "not-allowed" : "pointer",
        transition: "background 0.15s",
      }}
    >
      {loading ? "Saving…" : "Save changes"}
    </button>
  );
}

function FeedbackMessage({ type, text }: { type: "success" | "error"; text: string }) {
  return (
    <p
      style={{
        fontSize: 13,
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        color: type === "success" ? "#15803d" : "#dc2626",
        marginTop: 8,
      }}
    >
      {text}
    </p>
  );
}

// ─── Personal Details Section ─────────────────────────────────────────────────

function PersonalDetails({ user }: { user: User }) {
  const [firstName, setFirstName] = useState(user.firstName);
  const [lastName, setLastName] = useState(user.lastName);
  const [phone, setPhone] = useState(user.phone);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleSave() {
    setLoading(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName, phone }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) {
        setFeedback({ type: "error", text: data.error ?? "Failed to save changes." });
      } else {
        setFeedback({ type: "success", text: "Changes saved successfully." });
      }
    } catch {
      setFeedback({ type: "error", text: "An unexpected error occurred." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <SectionCard title="Personal Details">
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 16,
          marginBottom: 16,
        }}
        className="account-grid"
      >
        <Field label="First name">
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            style={inputStyle}
          />
        </Field>
        <Field label="Last name">
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            style={inputStyle}
          />
        </Field>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 20 }}>
        <Field label="Email address">
          <input type="email" value={user.email} readOnly style={inputDisabledStyle} />
        </Field>
        <Field label="Phone number">
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="0412 345 678"
            style={inputStyle}
          />
        </Field>
      </div>
      <SaveButton loading={loading} onClick={handleSave} />
      {feedback && <FeedbackMessage type={feedback.type} text={feedback.text} />}
    </SectionCard>
  );
}

// ─── Change Password Section ──────────────────────────────────────────────────

function ChangePassword() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleSave() {
    if (next !== confirm) {
      setFeedback({ type: "error", text: "New passwords don't match." });
      return;
    }
    setLoading(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/account/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: current, newPassword: next, confirmPassword: confirm }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) {
        setFeedback({ type: "error", text: data.error ?? "Failed to change password." });
      } else {
        setFeedback({ type: "success", text: "Password changed successfully." });
        setCurrent("");
        setNext("");
        setConfirm("");
      }
    } catch {
      setFeedback({ type: "error", text: "An unexpected error occurred." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <SectionCard title="Change Password">
      <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 20 }}>
        <Field label="Current password">
          <input
            type="password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            placeholder="Enter your current password"
            style={inputStyle}
            autoComplete="current-password"
          />
        </Field>
        <Field label="New password">
          <input
            type="password"
            value={next}
            onChange={(e) => setNext(e.target.value)}
            placeholder="Min. 8 characters, 1 uppercase, 1 number"
            style={inputStyle}
            autoComplete="new-password"
          />
        </Field>
        <Field label="Confirm new password">
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Repeat new password"
            style={inputStyle}
            autoComplete="new-password"
          />
        </Field>
      </div>
      <SaveButton loading={loading} onClick={handleSave} />
      {feedback && <FeedbackMessage type={feedback.type} text={feedback.text} />}
    </SectionCard>
  );
}

// ─── Verification Status Section ──────────────────────────────────────────────

function VerificationStatus({ status }: { status: string }) {
  const config: Record<string, { label: string; bg: string; color: string; desc: string }> = {
    VERIFIED: {
      label: "Verified",
      bg: "#e8f5e9",
      color: "#2e7d32",
      desc: "Your identity has been verified. You can place offers and publish listings.",
    },
    PENDING: {
      label: "Pending review",
      bg: "#fff3e0",
      color: "#e65100",
      desc: "Your verification is being reviewed. This usually takes 1–2 business days.",
    },
    FAILED: {
      label: "Verification failed",
      bg: "#fee2e2",
      color: "#dc2626",
      desc: "Your verification attempt failed. Please try again.",
    },
    UNVERIFIED: {
      label: "Not verified",
      bg: "#f3f4f6",
      color: "#374151",
      desc: "Identity verification is required to place offers or publish listings.",
    },
  };

  const c = config[status] ?? config.UNVERIFIED;
  const needsAction = status !== "VERIFIED" && status !== "PENDING";

  return (
    <SectionCard title="Verification Status">
      <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
        <span
          style={{
            background: c.bg,
            color: c.color,
            borderRadius: 8,
            padding: "6px 14px",
            fontSize: 13,
            fontWeight: 600,
            fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
            flexShrink: 0,
          }}
        >
          {c.label}
        </span>
        <p
          style={{
            color: "#6b7280",
            fontSize: 14,
            fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
            lineHeight: 1.5,
            flex: 1,
          }}
        >
          {c.desc}
        </p>
        {needsAction && (
          <Link
            href="/verify-identity"
            style={{
              background: "#f59e0b",
              color: "#1a0f00",
              borderRadius: 10,
              padding: "10px 20px",
              fontSize: 14,
              fontWeight: 600,
              fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
              textDecoration: "none",
              flexShrink: 0,
            }}
          >
            {status === "FAILED" ? "Try again" : "Verify now"} →
          </Link>
        )}
      </div>
    </SectionCard>
  );
}

// ─── Notification Preferences Section ────────────────────────────────────────

function NotificationPreferences({ initial }: { initial: NotifPrefs }) {
  const [prefs, setPrefs] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const toggles: { key: keyof NotifPrefs; label: string; desc: string }[] = [
    {
      key: "newOffers",
      label: "New offers on my listings",
      desc: "Get notified when a buyer places an offer on one of your listings.",
    },
    {
      key: "offerUpdates",
      label: "Offer status updates",
      desc: "Updates when your offers are accepted, rejected, or ranked.",
    },
    {
      key: "messages",
      label: "New messages",
      desc: "Email alerts when you receive a new message from a buyer or seller.",
    },
    {
      key: "listingActivity",
      label: "Listing activity",
      desc: "Summaries of views, saves, and activity on your listings.",
    },
  ];

  function toggle(key: keyof NotifPrefs) {
    setPrefs((p) => ({ ...p, [key]: !p[key] }));
  }

  async function handleSave() {
    setLoading(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/account/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prefs),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) {
        setFeedback({ type: "error", text: data.error ?? "Failed to save preferences." });
      } else {
        setFeedback({ type: "success", text: "Notification preferences saved." });
      }
    } catch {
      setFeedback({ type: "error", text: "An unexpected error occurred." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <SectionCard title="Notification Preferences">
      <div style={{ display: "flex", flexDirection: "column", gap: 0, marginBottom: 24 }}>
        {toggles.map((t, i) => (
          <div
            key={t.key}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 16,
              padding: "16px 0",
              borderBottom: i < toggles.length - 1 ? "1px solid #e5e2db" : "none",
            }}
          >
            <div>
              <p
                style={{
                  fontWeight: 500,
                  fontSize: 14,
                  color: "#0f1623",
                  fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                  marginBottom: 2,
                }}
              >
                {t.label}
              </p>
              <p style={{ fontSize: 13, color: "#6b7280", fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
                {t.desc}
              </p>
            </div>
            <button
              onClick={() => toggle(t.key)}
              role="switch"
              aria-checked={prefs[t.key]}
              style={{
                width: 44,
                height: 24,
                borderRadius: 12,
                background: prefs[t.key] ? "#0f1623" : "#e5e2db",
                border: "none",
                cursor: "pointer",
                position: "relative",
                flexShrink: 0,
                transition: "background 0.2s",
              }}
            >
              <span
                style={{
                  position: "absolute",
                  top: 3,
                  left: prefs[t.key] ? 23 : 3,
                  width: 18,
                  height: 18,
                  borderRadius: "50%",
                  background: "#ffffff",
                  transition: "left 0.2s",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
                }}
              />
            </button>
          </div>
        ))}
      </div>
      <SaveButton loading={loading} onClick={handleSave} />
      {feedback && <FeedbackMessage type={feedback.type} text={feedback.text} />}
    </SectionCard>
  );
}

// ─── Delete Account Section ───────────────────────────────────────────────────

function DeleteAccount() {
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    if (confirmation !== "DELETE") {
      setError("Please type DELETE to confirm.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmation }),
      });
      if (!res.ok) {
        const data = await res.json() as { error?: string };
        setError(data.error ?? "Failed to delete account.");
        return;
      }
      await signOut({ callbackUrl: "/" });
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div
        style={{
          background: "#fff5f5",
          border: "1px solid #fecaca",
          borderRadius: 12,
          padding: "28px 32px",
        }}
      >
        <h2
          style={{
            fontFamily: "Georgia, 'Times New Roman', serif",
            fontSize: 20,
            fontWeight: 400,
            color: "#dc2626",
            letterSpacing: "-0.01em",
            marginBottom: 8,
          }}
        >
          Delete Account
        </h2>
        <p
          style={{
            color: "#6b7280",
            fontSize: 14,
            fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
            lineHeight: 1.6,
            marginBottom: 20,
            maxWidth: 560,
          }}
        >
          Permanently delete your TrueBid account. This will withdraw all your active listings and
          offers. This action cannot be undone.
        </p>
        <button
          onClick={() => setModalOpen(true)}
          style={{
            background: "#dc2626",
            color: "#ffffff",
            border: "none",
            borderRadius: 10,
            padding: "11px 24px",
            fontSize: 14,
            fontWeight: 600,
            fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
            cursor: "pointer",
          }}
        >
          Delete my account
        </button>
      </div>

      {/* Confirmation modal */}
      {modalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15,22,35,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 500,
            padding: 24,
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setModalOpen(false); }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: 16,
              padding: "32px",
              width: "100%",
              maxWidth: 440,
              boxShadow: "0 4px 6px rgba(15,22,35,0.04), 0 12px 32px rgba(15,22,35,0.12)",
            }}
          >
            <h3
              style={{
                fontFamily: "Georgia, 'Times New Roman', serif",
                fontSize: 22,
                color: "#0f1623",
                marginBottom: 12,
              }}
            >
              Delete your account?
            </h3>
            <p
              style={{
                color: "#6b7280",
                fontSize: 14,
                fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                lineHeight: 1.6,
                marginBottom: 20,
              }}
            >
              This will withdraw all your active listings and offers, and permanently delete your
              account. <strong style={{ color: "#dc2626" }}>This cannot be undone.</strong>
            </p>
            <Field label="Type DELETE to confirm">
              <input
                type="text"
                value={confirmation}
                onChange={(e) => { setConfirmation(e.target.value); setError(""); }}
                placeholder="DELETE"
                style={{ ...inputStyle, marginBottom: 0 }}
                autoFocus
              />
            </Field>
            {error && (
              <p
                style={{
                  color: "#dc2626",
                  fontSize: 13,
                  fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                  marginTop: 8,
                }}
              >
                {error}
              </p>
            )}
            <div
              style={{
                display: "flex",
                gap: 12,
                marginTop: 24,
                justifyContent: "flex-end",
              }}
            >
              <button
                onClick={() => { setModalOpen(false); setConfirmation(""); setError(""); }}
                style={{
                  background: "transparent",
                  border: "1px solid #e5e2db",
                  borderRadius: 10,
                  padding: "10px 20px",
                  fontSize: 14,
                  fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                  cursor: "pointer",
                  color: "#6b7280",
                  fontWeight: 500,
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={loading || confirmation !== "DELETE"}
                style={{
                  background: confirmation === "DELETE" && !loading ? "#dc2626" : "#e5e2db",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: 10,
                  padding: "10px 20px",
                  fontSize: 14,
                  fontWeight: 600,
                  fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                  cursor: confirmation === "DELETE" && !loading ? "pointer" : "not-allowed",
                  transition: "background 0.15s",
                }}
              >
                {loading ? "Deleting…" : "Yes, delete my account"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function AccountClient({ user, notificationPrefs }: Props) {
  return (
    <div>
      {/* Page header */}
      <div style={{ marginBottom: 32 }}>
        <h1
          style={{
            fontFamily: "Georgia, 'Times New Roman', serif",
            fontSize: 32,
            fontWeight: 400,
            color: "#0f1623",
            letterSpacing: "-0.02em",
            marginBottom: 6,
          }}
        >
          Account Settings
        </h1>
        <p style={{ color: "#6b7280", fontSize: 14, fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
          Manage your personal details, password, and preferences.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <PersonalDetails user={user} />
        <ChangePassword />
        <VerificationStatus status={user.verificationStatus} />
        <NotificationPreferences initial={notificationPrefs} />
        <DeleteAccount />
      </div>

      {/* Responsive grid fix */}
      <style>{`
        @media (max-width: 600px) {
          .account-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
