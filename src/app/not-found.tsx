import Link from "next/link";

export default function NotFound() {
  return (
    <div className="bg-bg min-h-[70vh] flex items-center justify-center px-6">
      <div className="text-center max-w-md mx-auto">
        <p
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: 13,
            fontWeight: 600,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "#f59e0b",
            marginBottom: 16,
          }}
        >
          404
        </p>
        <h1
          className="text-navy mb-4"
          style={{
            fontFamily: "Georgia, 'Times New Roman', serif",
            fontSize: "clamp(28px, 5vw, 40px)",
            fontWeight: 400,
            letterSpacing: "-0.02em",
            lineHeight: 1.2,
          }}
        >
          Page not found
        </h1>
        <p
          className="text-text-muted mb-8"
          style={{ fontFamily: "var(--font-sans)", fontSize: 16, lineHeight: 1.6 }}
        >
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-block bg-navy text-white font-semibold text-sm px-6 py-3 rounded-[10px] hover:bg-navy-light transition-colors"
          >
            Go home
          </Link>
          <Link
            href="/listings"
            className="inline-block border border-border text-text font-medium text-sm px-6 py-3 rounded-[10px] hover:bg-white transition-colors"
          >
            Browse listings
          </Link>
        </div>
      </div>
    </div>
  );
}
