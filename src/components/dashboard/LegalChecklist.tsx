"use client";

import { useState } from "react";
import { WA_CHECKLIST } from "@/lib/wa-checklist";

type ChecklistEntry = {
  itemKey: string;
  status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
};

type Props = {
  initialProgress: ChecklistEntry[];
};

export function LegalChecklist({ initialProgress }: Props) {
  const [progress, setProgress] = useState<Map<string, ChecklistEntry["status"]>>(
    () => new Map(initialProgress.map((p) => [p.itemKey, p.status]))
  );
  const [saving, setSaving] = useState<string | null>(null);

  async function toggleItem(key: string) {
    const current = progress.get(key) ?? "NOT_STARTED";
    const next: ChecklistEntry["status"] =
      current === "COMPLETED" ? "NOT_STARTED" : "COMPLETED";

    // Optimistic update
    setProgress((prev) => new Map(prev).set(key, next));
    setSaving(key);

    try {
      const res = await fetch("/api/dashboard/seller/checklist", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemKey: key, status: next }),
      });
      if (!res.ok) {
        // Revert on failure
        setProgress((prev) => new Map(prev).set(key, current));
      }
    } catch {
      setProgress((prev) => new Map(prev).set(key, current));
    } finally {
      setSaving(null);
    }
  }

  const completedCount = Array.from(progress.values()).filter(
    (s) => s === "COMPLETED"
  ).length;

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 20,
        }}
      >
        <p style={{ color: "#6b7280", fontSize: 14, fontFamily: "var(--font-sans)" }}>
          {completedCount} of {WA_CHECKLIST.length} items completed
        </p>
        {/* Progress bar */}
        <div
          style={{
            width: 160,
            height: 6,
            background: "#e5e2db",
            borderRadius: 3,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${(completedCount / WA_CHECKLIST.length) * 100}%`,
              height: "100%",
              background: "#16a34a",
              borderRadius: 3,
              transition: "width 0.3s ease",
            }}
          />
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {WA_CHECKLIST.map((item) => {
          const status = progress.get(item.key) ?? "NOT_STARTED";
          const completed = status === "COMPLETED";
          const isSaving = saving === item.key;

          return (
            <div
              key={item.key}
              style={{
                background: "#ffffff",
                border: `1px solid ${completed ? "#bbf7d0" : "#e5e2db"}`,
                borderRadius: 12,
                padding: "20px",
                display: "flex",
                gap: 16,
                alignItems: "flex-start",
                opacity: isSaving ? 0.7 : 1,
                transition: "opacity 0.2s, border-color 0.2s",
              }}
            >
              {/* Checkbox */}
              <button
                onClick={() => toggleItem(item.key)}
                disabled={isSaving}
                aria-label={completed ? "Mark incomplete" : "Mark complete"}
                style={{
                  flexShrink: 0,
                  width: 24,
                  height: 24,
                  borderRadius: 6,
                  border: `2px solid ${completed ? "#16a34a" : "#d1d5db"}`,
                  background: completed ? "#16a34a" : "transparent",
                  cursor: isSaving ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#ffffff",
                  fontSize: 13,
                  fontWeight: 700,
                  marginTop: 2,
                }}
              >
                {completed && "✓"}
              </button>

              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <p
                    style={{
                      fontWeight: 600,
                      fontSize: 15,
                      color: "#0f1623",
                      fontFamily: "var(--font-sans)",
                      textDecoration: completed ? "line-through" : "none",
                    }}
                  >
                    {item.title}
                  </p>
                  {item.mandatory && (
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: "#dc2626",
                        background: "#fef2f2",
                        border: "1px solid #fca5a5",
                        borderRadius: 4,
                        padding: "1px 6px",
                        fontFamily: "var(--font-sans)",
                      }}
                    >
                      Required
                    </span>
                  )}
                </div>

                <p
                  style={{
                    fontSize: 14,
                    color: "#334766",
                    lineHeight: 1.5,
                    marginBottom: 8,
                    fontFamily: "var(--font-sans)",
                  }}
                >
                  {item.description}
                </p>

                <p
                  style={{
                    fontSize: 13,
                    color: "#6b7280",
                    lineHeight: 1.5,
                    fontStyle: "italic",
                    fontFamily: "var(--font-sans)",
                  }}
                >
                  {item.helpText}
                </p>

                {item.ctaLabel && !completed && (
                  <button
                    style={{
                      marginTop: 12,
                      background: "transparent",
                      border: "1px solid #f59e0b",
                      color: "#0f1623",
                      borderRadius: 6,
                      padding: "6px 14px",
                      fontSize: 13,
                      fontWeight: 500,
                      cursor: "pointer",
                      fontFamily: "var(--font-sans)",
                    }}
                  >
                    {item.ctaLabel}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
