"use client";

type LogoVariant = "dark" | "light" | "mono";

interface LogoProps {
  variant?: LogoVariant;
  className?: string;
  /** Renders as an <a> wrapping to "/" when true */
  linked?: boolean;
}

// dark  = logo on a light background  → use dark amber for contrast
// light = logo on a dark background   → use bright amber
const variantStyles: Record<
  LogoVariant,
  { true_: string; bid: string; dot: string }
> = {
  dark: {
    true_: "text-[#0f1623]",
    bid: "text-[#b45309]",
    dot: "text-[#b45309]",
  },
  light: {
    true_: "text-white",
    bid: "text-[#f59e0b]",
    dot: "text-[#f59e0b]",
  },
  mono: {
    true_: "text-current",
    bid: "text-current",
    dot: "text-current",
  },
};

export function Logo({ variant = "dark", className = "", linked = false }: LogoProps) {
  const styles = variantStyles[variant];

  const wordmark = (
    <span
      className={`inline-flex items-baseline select-none ${className}`}
      style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
      aria-label="TrueBid"
    >
      <span
        className={`font-normal tracking-tight ${styles.true_}`}
        style={{ fontSize: "inherit" }}
      >
        True
      </span>
      <span
        className={`font-bold tracking-tight ${styles.bid}`}
        style={{ fontSize: "inherit" }}
      >
        Bid
      </span>
      <span
        className={`font-bold ${styles.dot}`}
        style={{ fontSize: "inherit", lineHeight: 1 }}
        aria-hidden="true"
      >
        .
      </span>
    </span>
  );

  if (linked) {
    return (
      <a href="/" className="no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f59e0b] rounded-sm">
        {wordmark}
      </a>
    );
  }

  return wordmark;
}
