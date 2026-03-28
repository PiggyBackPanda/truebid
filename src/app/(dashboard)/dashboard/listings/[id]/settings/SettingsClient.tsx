"use client";

import { useState } from "react";

type AddressVisibility = "PUBLIC" | "LOGGED_IN" | "BOOKED_ONLY";

interface Props {
  listingId: string;
  listingAddress: string;
  initialRequireInspection: boolean;
  initialAddressVisibility: AddressVisibility;
  hasOffers: boolean;
}

export function SettingsClient({
  listingId,
  listingAddress,
  initialRequireInspection,
  initialAddressVisibility,
  hasOffers,
}: Props) {
  const [requireInspection, setRequireInspection] = useState(initialRequireInspection);
  const [addressVisibility, setAddressVisibility] = useState<AddressVisibility>(initialAddressVisibility);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const res = await fetch(`/api/listings/${listingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requireInspection, addressVisibility }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Failed to save settings.");
        return;
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: "40px 24px 80px", fontFamily: "Outfit, sans-serif" }}>
      <a
        href={`/dashboard/seller/${listingId}`}
        style={{ fontSize: 13, color: "#6b7280", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4, marginBottom: 20 }}
      >
        ← Back to dashboard
      </a>

      <h1 style={{ fontFamily: "DM Serif Display, Georgia, serif", fontSize: 24, color: "#0f1a2e", marginBottom: 4 }}>
        Listing Settings
      </h1>
      <p style={{ fontSize: 14, color: "#6b7280", marginBottom: 32 }}>{listingAddress}</p>

      {/* Offer Settings */}
      <div style={{ background: "#ffffff", border: "1px solid #e5e2db", borderRadius: 12, padding: 24, marginBottom: 20 }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, color: "#0f1a2e", marginBottom: 16 }}>Offer Settings</h2>

        <label style={{ display: "flex", alignItems: "flex-start", gap: 12, cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={requireInspection}
            onChange={(e) => setRequireInspection(e.target.checked)}
            style={{ width: 16, height: 16, marginTop: 2, accentColor: "#e8a838" }}
          />
          <div>
            <span style={{ fontSize: 14, fontWeight: 600, color: "#0f1a2e", display: "block" }}>
              Require buyers to attend an inspection before placing an offer
            </span>
            <p style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>
              Ensures all offers come from buyers who have seen the property in person.
            </p>
            {hasOffers && requireInspection !== initialRequireInspection && (
              <p style={{ fontSize: 12, color: "#d97706", marginTop: 6, background: "#fef3c7", padding: "6px 10px", borderRadius: 6 }}>
                This listing already has offers. Changing this setting will not affect existing offers.
              </p>
            )}
          </div>
        </label>
      </div>

      {/* Address Privacy */}
      <div style={{ background: "#ffffff", border: "1px solid #e5e2db", borderRadius: 12, padding: 24, marginBottom: 24 }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, color: "#0f1a2e", marginBottom: 4 }}>Address Privacy</h2>
        <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 16 }}>Who can see your full street address?</p>

        {(
          [
            { value: "PUBLIC" as const,      label: "Anyone (public)",         desc: "Visible to all internet visitors, including search engines." },
            { value: "LOGGED_IN" as const,   label: "Logged-in users only",    desc: "Hidden from anonymous browsing and search engines. Recommended.", badge: "Recommended" },
            { value: "BOOKED_ONLY" as const, label: "Inspection bookings only", desc: "Only revealed after a buyer books or attends an inspection." },
          ]
        ).map(({ value, label, desc, badge }) => (
          <label key={value} style={{ display: "flex", alignItems: "flex-start", gap: 12, cursor: "pointer", marginBottom: 14 }}>
            <input
              type="radio"
              name="addressVisibility"
              value={value}
              checked={addressVisibility === value}
              onChange={() => setAddressVisibility(value)}
              style={{ width: 16, height: 16, marginTop: 2, accentColor: "#e8a838" }}
            />
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: "#0f1a2e" }}>{label}</span>
                {badge && (
                  <span style={{ fontSize: 10, fontWeight: 700, background: "#e8a838", color: "#0f1a2e", padding: "2px 6px", borderRadius: 20 }}>
                    {badge}
                  </span>
                )}
              </div>
              <p style={{ fontSize: 13, color: "#6b7280", marginTop: 2 }}>{desc}</p>
            </div>
          </label>
        ))}
      </div>

      {error && (
        <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "#dc2626" }}>
          {error}
        </div>
      )}

      {saved && (
        <div style={{ background: "#dcfce7", border: "1px solid #86efac", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "#15803d" }}>
          Settings saved successfully.
        </div>
      )}

      <button
        onClick={handleSave}
        disabled={saving}
        style={{
          padding: "10px 24px", borderRadius: 8, fontSize: 14, fontWeight: 600,
          background: saving ? "#d1d5db" : "#e8a838", color: "#0f1a2e",
          border: "none", cursor: saving ? "not-allowed" : "pointer",
          fontFamily: "Outfit, sans-serif",
        }}
      >
        {saving ? "Saving…" : "Save settings"}
      </button>
    </div>
  );
}
