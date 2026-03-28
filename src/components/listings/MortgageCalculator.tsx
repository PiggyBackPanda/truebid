"use client";

import { useState } from "react";

interface Props {
  guidePriceCents: number | null;
}

function calcMonthly(principal: number, annualRatePct: number, years: number): number {
  if (principal <= 0 || years <= 0) return 0;
  const r = annualRatePct / 100 / 12;
  const n = years * 12;
  if (r === 0) return principal / n;
  return (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

function formatAUD(amount: number): string {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

type DepositMode = "pct" | "dollar";

export function MortgageCalculator({ guidePriceCents }: Props) {
  const defaultPrice = guidePriceCents ? Math.round(guidePriceCents / 100) : 800000;

  const [isOpen, setIsOpen] = useState(false);
  const [disclaimerOpen, setDisclaimerOpen] = useState(false);
  const [price, setPrice] = useState(defaultPrice);
  const [depositMode, setDepositMode] = useState<DepositMode>("pct");
  const [depositValue, setDepositValue] = useState(20); // pct or dollars depending on mode
  const [term, setTerm] = useState(30);
  const [rate, setRate] = useState(6.5);

  // Derive the canonical deposit dollar and pct amounts from whichever mode is active
  const depositDollars =
    depositMode === "pct" ? Math.round(price * depositValue / 100) : depositValue;
  const depositPct =
    depositMode === "dollar" ? (price > 0 ? (depositValue / price) * 100 : 0) : depositValue;

  const loanAmount = Math.max(0, price - depositDollars);
  const monthly = calcMonthly(loanAmount, rate, term);
  const fortnightly = (monthly * 12) / 26;
  const weekly = (monthly * 12) / 52;

  const showLMIWarning = depositPct < 20 && loanAmount > 0;
  const rateWarning =
    rate <= 0
      ? "Please enter a rate above 0%."
      : rate > 25
      ? "Rate seems very high — please double-check."
      : null;

  function switchDepositMode(newMode: DepositMode) {
    if (newMode === depositMode) return;
    // Convert current value to the new mode
    if (newMode === "dollar") {
      setDepositValue(depositDollars);
    } else {
      setDepositValue(Math.round(depositPct * 10) / 10);
    }
    setDepositMode(newMode);
  }

  return (
    <div className="mb-8">
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center justify-between w-full text-left group"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2">
          <svg
            width="16"
            height="16"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
            style={{ color: "#334766", flexShrink: 0 }}
          >
            <rect x="2" y="3" width="20" height="14" rx="2" />
            <path d="M8 21h8M12 17v4" />
          </svg>
          <h2 className="text-base font-semibold text-navy">Mortgage Calculator</h2>
        </div>
        <span className="text-sm text-amber font-medium group-hover:underline">
          {isOpen ? "Hide Calculator" : "Show Calculator"}
        </span>
      </button>

      {isOpen && (
        <div className="mt-4 bg-white border border-border rounded-[12px] p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
            {/* Property Price */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-text-muted">
                  Property Price
                </label>
                {price !== defaultPrice && guidePriceCents && (
                  <button
                    type="button"
                    onClick={() => setPrice(defaultPrice)}
                    className="text-xs text-amber hover:underline"
                  >
                    Reset to guide price
                  </button>
                )}
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-text-muted pointer-events-none">
                  $
                </span>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(Math.max(0, Number(e.target.value)))}
                  min={0}
                  step={5000}
                  className="w-full pl-7 pr-3 py-2.5 border border-border rounded-[8px] text-sm text-navy focus:outline-none focus:ring-1 focus:ring-amber"
                />
              </div>
            </div>

            {/* Deposit */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-text-muted">Deposit</label>
                <div
                  className="flex text-xs rounded-[6px] overflow-hidden border border-border"
                  style={{ fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}
                >
                  <button
                    type="button"
                    onClick={() => switchDepositMode("pct")}
                    className="px-2 py-0.5 transition-colors"
                    style={{
                      background: depositMode === "pct" ? "#0f1a2e" : "transparent",
                      color: depositMode === "pct" ? "#ffffff" : "#6b7280",
                    }}
                  >
                    %
                  </button>
                  <button
                    type="button"
                    onClick={() => switchDepositMode("dollar")}
                    className="px-2 py-0.5 transition-colors"
                    style={{
                      background: depositMode === "dollar" ? "#0f1a2e" : "transparent",
                      color: depositMode === "dollar" ? "#ffffff" : "#6b7280",
                    }}
                  >
                    $
                  </button>
                </div>
              </div>

              <div className="relative">
                {depositMode === "pct" ? (
                  <>
                    <input
                      type="number"
                      value={depositValue}
                      onChange={(e) =>
                        setDepositValue(Math.min(100, Math.max(0, Number(e.target.value))))
                      }
                      min={0}
                      max={100}
                      step={1}
                      className="w-full pl-3 pr-10 py-2.5 border border-border rounded-[8px] text-sm text-navy focus:outline-none focus:ring-1 focus:ring-amber"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-text-muted pointer-events-none">
                      %
                    </span>
                  </>
                ) : (
                  <>
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-text-muted pointer-events-none">
                      $
                    </span>
                    <input
                      type="number"
                      value={depositValue}
                      onChange={(e) =>
                        setDepositValue(Math.min(price, Math.max(0, Number(e.target.value))))
                      }
                      min={0}
                      max={price}
                      step={5000}
                      className="w-full pl-7 pr-3 py-2.5 border border-border rounded-[8px] text-sm text-navy focus:outline-none focus:ring-1 focus:ring-amber"
                    />
                  </>
                )}
              </div>

              {/* Corresponding value */}
              <p className="text-xs text-text-muted mt-1.5">
                {depositMode === "pct"
                  ? `= ${formatAUD(depositDollars)}`
                  : `= ${depositPct.toFixed(1)}% of property price`}
              </p>

              {/* LMI warning */}
              {showLMIWarning && (
                <div
                  className="mt-2 rounded-[6px] px-3 py-2"
                  style={{ background: "#fffbeb", border: "1px solid #fde68a" }}
                >
                  <p className="text-xs leading-relaxed" style={{ color: "#92400e" }}>
                    ⚠️ Deposits below 20% typically require Lenders Mortgage Insurance (LMI), which can add thousands to your costs.
                  </p>
                </div>
              )}
            </div>

            {/* Loan Term */}
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1.5">
                Loan Term
              </label>
              <select
                value={term}
                onChange={(e) => setTerm(Number(e.target.value))}
                className="w-full px-3 py-2.5 border border-border rounded-[8px] text-sm text-navy focus:outline-none focus:ring-1 focus:ring-amber bg-white"
              >
                {[10, 15, 20, 25, 30].map((y) => (
                  <option key={y} value={y}>
                    {y} years
                  </option>
                ))}
              </select>
            </div>

            {/* Interest Rate */}
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1.5">
                Interest Rate
              </label>
              <div className="relative mb-2">
                <input
                  type="number"
                  value={rate}
                  onChange={(e) => setRate(Math.max(0, Number(e.target.value)))}
                  min={0}
                  max={25}
                  step={0.25}
                  className="w-full pl-3 pr-14 py-2.5 border rounded-[8px] text-sm text-navy focus:outline-none focus:ring-1 focus:ring-amber"
                  style={{ borderColor: rateWarning ? "#f87171" : undefined }}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-text-muted pointer-events-none">
                  % p.a.
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={15}
                step={0.25}
                value={Math.min(15, Math.max(1, rate))}
                onChange={(e) => setRate(Number(e.target.value))}
                className="w-full"
                style={{ accentColor: "#e8a838" }}
              />
              {rateWarning && (
                <p className="text-xs mt-1" style={{ color: "#dc2626" }}>
                  {rateWarning}
                </p>
              )}
            </div>
          </div>

          {/* Results */}
          <div className="bg-bg rounded-[10px] p-4 mb-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-text-muted mb-1">Est. Monthly</p>
              <p className="text-lg font-semibold text-navy">{formatAUD(monthly)}</p>
            </div>
            <div>
              <p className="text-xs text-text-muted mb-1">Est. Fortnightly</p>
              <p className="text-lg font-semibold text-navy">{formatAUD(fortnightly)}</p>
            </div>
            <div>
              <p className="text-xs text-text-muted mb-1">Est. Weekly</p>
              <p className="text-lg font-semibold text-navy">{formatAUD(weekly)}</p>
            </div>
            <div>
              <p className="text-xs text-text-muted mb-1">Loan Amount</p>
              <p className="text-lg font-semibold text-navy">{formatAUD(loanAmount)}</p>
            </div>
          </div>

          {/* Disclaimer — collapsed footnote */}
          <button
            type="button"
            onClick={() => setDisclaimerOpen((prev) => !prev)}
            className="flex items-center gap-1.5 text-xs text-text-muted hover:text-text transition-colors"
            style={{ fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4M12 8h.01" />
            </svg>
            Disclaimer
            <svg
              width="10"
              height="10"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              style={{
                transform: disclaimerOpen ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 0.15s",
              }}
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>

          {disclaimerOpen && (
            <p className="text-xs text-text-muted leading-relaxed mt-2">
              This calculator provides an estimate only. The interest rate used ({rate.toFixed(2)}%
              p.a.) is for illustrative purposes and does not represent any lender&apos;s actual
              rate. Calculations assume principal and interest repayments. Contact a licensed
              mortgage broker or financial adviser for personalised advice.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
