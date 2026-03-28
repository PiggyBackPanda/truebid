"use client";

import { useState } from "react";

export function AntiSnipeExplainer() {
  const [show, setShow] = useState(false);

  return (
    <div className="flex justify-center py-6 px-4">
      <div className="relative inline-flex items-center gap-2 px-3.5 py-2 rounded-full border border-amber/30 bg-amber/8 text-xs text-amber-900"
        style={{ background: "rgba(232,168,56,0.07)" }}
      >
        {/* Shield icon */}
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" className="shrink-0 text-amber" style={{ color: "#e8a838" }}>
          <path
            d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        <span style={{ color: "#7a5a1a" }}>
          Anti-snipe protection active: last-minute offers automatically extend the offer period.
        </span>

        {/* Info button */}
        <div className="relative">
          <button
            className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold leading-none transition-colors shrink-0"
            style={{ border: "1px solid rgba(122,90,26,0.35)", color: "#7a5a1a" }}
            onMouseEnter={() => setShow(true)}
            onMouseLeave={() => setShow(false)}
            onClick={() => setShow((v) => !v)}
            aria-label="Learn more about anti-snipe protection"
            aria-expanded={show}
          >
            ?
          </button>
          {show && (
            <div
              className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-72 rounded-[8px] p-3 text-xs leading-relaxed shadow-lg z-10"
              style={{ background: "#0f1a2e", color: "#ffffff" }}
              role="tooltip"
            >
              If an offer is submitted within the final 10 minutes of the offer period, the deadline
              is automatically extended by 10 minutes. This continues until no new offers are
              received in the final window, ensuring no buyer can win by waiting until the last
              second.
              {/* Arrow */}
              <div
                className="absolute top-full left-1/2 -translate-x-1/2"
                style={{
                  width: 0,
                  height: 0,
                  borderLeft: "5px solid transparent",
                  borderRight: "5px solid transparent",
                  borderTop: "5px solid #0f1a2e",
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
