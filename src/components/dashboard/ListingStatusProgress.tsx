"use client";

type ListingStatus =
  | "DRAFT"
  | "COMING_SOON"
  | "INSPECTIONS_OPEN"
  | "ACTIVE"
  | "UNDER_OFFER"
  | "SOLD"
  | "WITHDRAWN"
  | "EXPIRED";

const STEPS: { key: ListingStatus; label: string }[] = [
  { key: "DRAFT", label: "Draft" },
  { key: "COMING_SOON", label: "Coming Soon" },
  { key: "INSPECTIONS_OPEN", label: "Inspections" },
  { key: "ACTIVE", label: "Active" },
  { key: "UNDER_OFFER", label: "Under Offer" },
  { key: "SOLD", label: "Sold" },
];

// Map each status to its position in the pipeline (0-indexed)
const STATUS_INDEX: Partial<Record<ListingStatus, number>> = {
  DRAFT: 0,
  COMING_SOON: 1,
  INSPECTIONS_OPEN: 2,
  ACTIVE: 3,
  UNDER_OFFER: 4,
  SOLD: 5,
};

interface Props {
  status: ListingStatus;
}

export function ListingStatusProgress({ status }: Props) {
  if (status === "WITHDRAWN" || status === "EXPIRED") {
    return (
      <div
        className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium"
        style={{
          background: status === "WITHDRAWN" ? "#fee2e2" : "#f3f4f6",
          color: status === "WITHDRAWN" ? "#dc2626" : "#6b7280",
        }}
      >
        <span
          className="w-2 h-2 rounded-full"
          style={{ background: status === "WITHDRAWN" ? "#dc2626" : "#9ca3af" }}
        />
        {status === "WITHDRAWN" ? "Withdrawn" : "Expired"}
      </div>
    );
  }

  const currentIndex = STATUS_INDEX[status] ?? 0;

  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-1">
      {STEPS.map((step, i) => {
        const isDone = i < currentIndex;
        const isCurrent = i === currentIndex;

        return (
          <div key={step.key} className="flex items-center gap-1 flex-shrink-0">
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors"
              style={{
                background: isCurrent
                  ? "#0f1a2e"
                  : isDone
                    ? "#e8a838"
                    : "#f3f4f6",
                color: isCurrent
                  ? "#ffffff"
                  : isDone
                    ? "#ffffff"
                    : "#9ca3af",
              }}
            >
              {isDone && (
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path
                    d="M1.5 5L4 7.5L8.5 3"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
              {step.label}
            </div>
            {i < STEPS.length - 1 && (
              <div
                className="w-4 h-px flex-shrink-0"
                style={{ background: i < currentIndex ? "#e8a838" : "#e5e7eb" }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// Compact badge used in listing cards and tables
const BADGE_STYLES: Partial<Record<ListingStatus, { bg: string; color: string; label: string }>> = {
  DRAFT:            { bg: "#f3f4f6", color: "#6b7280",  label: "Draft" },
  COMING_SOON:      { bg: "#eff6ff", color: "#2563eb",  label: "Coming Soon" },
  INSPECTIONS_OPEN: { bg: "#fffbeb", color: "#d97706",  label: "Inspections Open" },
  ACTIVE:           { bg: "#dcfce7", color: "#16a34a",  label: "Active" },
  UNDER_OFFER:      { bg: "#fef3c7", color: "#d97706",  label: "Under Offer" },
  SOLD:             { bg: "#f0fdf4", color: "#15803d",  label: "Sold" },
  WITHDRAWN:        { bg: "#fee2e2", color: "#dc2626",  label: "Withdrawn" },
  EXPIRED:          { bg: "#f3f4f6", color: "#6b7280",  label: "Expired" },
};

export function ListingStatusBadge({ status }: { status: ListingStatus }) {
  const style = BADGE_STYLES[status] ?? { bg: "#f3f4f6", color: "#6b7280", label: status };

  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ background: style.bg, color: style.color }}
    >
      {style.label}
    </span>
  );
}
