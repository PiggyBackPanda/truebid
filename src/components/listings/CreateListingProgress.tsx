"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

const STEPS = [
  { label: "Details", path: "/listings/create/details" },
  { label: "Photos", path: "/listings/create/photos" },
  { label: "Sale Method", path: "/listings/create/method" },
  { label: "Review", path: "/listings/create/review" },
];

interface CreateListingProgressProps {
  listingId?: string;
}

export function CreateListingProgress({ listingId }: CreateListingProgressProps) {
  const pathname = usePathname();
  const currentIndex = STEPS.findIndex((s) => pathname.startsWith(s.path));

  return (
    <div className="bg-white border-b border-border">
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "0 24px" }}>
        <div className="flex items-center py-4 gap-0">
          {STEPS.map((step, index) => {
            const isCompleted = index < currentIndex;
            const isCurrent = index === currentIndex;
            const href = listingId && isCompleted
              ? `${step.path}?id=${listingId}`
              : undefined;

            const label = (
              <span
                className={
                  isCurrent
                    ? "text-xs font-bold text-navy"
                    : isCompleted
                    ? "text-xs font-medium text-amber"
                    : "text-xs text-text-muted"
                }
              >
                {step.label}
              </span>
            );

            return (
              <div key={step.path} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div className="flex items-center w-full">
                    {/* Connector line before */}
                    {index > 0 && (
                      <div
                        className="flex-1 h-0.5"
                        style={{
                          background: index <= currentIndex ? "#f59e0b" : "#e2ddd6",
                        }}
                      />
                    )}

                    {/* Step circle */}
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        background: isCurrent
                          ? "#f59e0b"
                          : isCompleted
                          ? "#f59e0b"
                          : "#e2ddd6",
                        color: isCurrent || isCompleted ? "#0f1a2e" : "#9c8f83",
                        fontSize: 12,
                        fontWeight: 700,
                      }}
                    >
                      {isCompleted ? (
                        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      ) : (
                        index + 1
                      )}
                    </div>

                    {/* Connector line after */}
                    {index < STEPS.length - 1 && (
                      <div
                        className="flex-1 h-0.5"
                        style={{
                          background: index < currentIndex ? "#f59e0b" : "#e2ddd6",
                        }}
                      />
                    )}
                  </div>

                  {/* Label below */}
                  <div className="mt-1">
                    {href ? (
                      <Link href={href} className="hover:opacity-75 transition-opacity">
                        {label}
                      </Link>
                    ) : (
                      label
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
