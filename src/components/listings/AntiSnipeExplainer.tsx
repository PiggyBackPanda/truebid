"use client";

import { useState } from "react";

export function AntiSnipeExplainer() {
  const [show, setShow] = useState(false);

  return (
    <div className="flex items-center justify-center gap-1.5 py-6 px-4">
      <p className="text-xs text-text-muted text-center">
        TrueBid uses anti-snipe protection — last-minute offers automatically extend the offer
        period to keep the process fair.
      </p>
      <div className="relative shrink-0">
        <button
          className="w-4 h-4 rounded-full border border-text-muted/40 text-text-muted flex items-center justify-center text-[10px] font-bold leading-none hover:border-slate hover:text-navy transition-colors"
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
  );
}
