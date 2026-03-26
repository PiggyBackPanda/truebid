"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";

export function Nav() {
  const { data: session, status } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav
      style={{
        background: "#0f1a2e",
        borderBottom: "1px solid #243656",
        height: 64,
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "0 24px",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* Logo */}
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: "#e8a838",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "DM Serif Display, Georgia, serif",
              fontSize: 16,
              fontWeight: 700,
              color: "#0f1a2e",
              flexShrink: 0,
            }}
          >
            T
          </div>
          <span
            style={{
              fontFamily: "DM Serif Display, Georgia, serif",
              fontSize: 20,
              color: "#ffffff",
              letterSpacing: "-0.02em",
            }}
          >
            TrueBid
          </span>
        </Link>

        {/* Desktop nav links */}
        <div
          className="hidden md:flex"
          style={{ alignItems: "center", gap: 8 }}
        >
          <NavLink href="/listings">Browse</NavLink>
          <NavLink href="/how-it-works">How it works</NavLink>

          {status === "loading" ? null : session ? (
            <>
              <NavLink href="/dashboard">Dashboard</NavLink>
              <div style={{ width: 1, height: 20, background: "#243656", margin: "0 8px" }} />
              <span style={{ color: "rgba(255,255,255,0.65)", fontSize: 14 }}>
                {(session.user as { firstName?: string }).firstName ?? session.user?.name}
              </span>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                style={{
                  background: "transparent",
                  border: "1px solid #334766",
                  color: "rgba(255,255,255,0.65)",
                  borderRadius: 8,
                  padding: "6px 14px",
                  fontSize: 13,
                  fontFamily: "Outfit, sans-serif",
                  cursor: "pointer",
                  marginLeft: 4,
                }}
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                style={{
                  color: "rgba(255,255,255,0.65)",
                  fontSize: 14,
                  fontWeight: 500,
                  textDecoration: "none",
                  padding: "6px 14px",
                  borderRadius: 8,
                  fontFamily: "Outfit, sans-serif",
                }}
              >
                Sign in
              </Link>
              <Link
                href="/register"
                style={{
                  background: "#e8a838",
                  color: "#0f1a2e",
                  fontSize: 14,
                  fontWeight: 600,
                  textDecoration: "none",
                  padding: "8px 18px",
                  borderRadius: 8,
                  fontFamily: "Outfit, sans-serif",
                }}
              >
                Get started
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="flex md:hidden"
          onClick={() => setMenuOpen((o) => !o)}
          style={{
            background: "transparent",
            border: "none",
            color: "rgba(255,255,255,0.65)",
            cursor: "pointer",
            padding: 8,
          }}
          aria-label="Toggle menu"
        >
          <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
            {menuOpen ? (
              <>
                <line x1="4" y1="4" x2="20" y2="20" />
                <line x1="20" y1="4" x2="4" y2="20" />
              </>
            ) : (
              <>
                <line x1="3" y1="7" x2="21" y2="7" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="17" x2="21" y2="17" />
              </>
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div
          style={{
            background: "#0f1a2e",
            borderTop: "1px solid #243656",
            padding: "12px 24px 20px",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <MobileNavLink href="/listings" onClick={() => setMenuOpen(false)}>Browse</MobileNavLink>
            <MobileNavLink href="/how-it-works" onClick={() => setMenuOpen(false)}>How it works</MobileNavLink>
            {session ? (
              <>
                <MobileNavLink href="/dashboard" onClick={() => setMenuOpen(false)}>Dashboard</MobileNavLink>
                <button
                  onClick={() => { setMenuOpen(false); signOut({ callbackUrl: "/" }); }}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "rgba(255,255,255,0.65)",
                    fontSize: 15,
                    fontFamily: "Outfit, sans-serif",
                    textAlign: "left",
                    padding: "10px 0",
                    cursor: "pointer",
                  }}
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <MobileNavLink href="/login" onClick={() => setMenuOpen(false)}>Sign in</MobileNavLink>
                <MobileNavLink href="/register" onClick={() => setMenuOpen(false)}>Get started</MobileNavLink>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      style={{
        color: "rgba(255,255,255,0.65)",
        fontSize: 14,
        fontWeight: 500,
        textDecoration: "none",
        padding: "6px 12px",
        borderRadius: 6,
        fontFamily: "Outfit, sans-serif",
        transition: "color 0.15s, background 0.15s",
      }}
    >
      {children}
    </Link>
  );
}

function MobileNavLink({
  href,
  children,
  onClick,
}: {
  href: string;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      style={{
        color: "rgba(255,255,255,0.65)",
        fontSize: 15,
        fontWeight: 500,
        textDecoration: "none",
        padding: "10px 0",
        fontFamily: "Outfit, sans-serif",
        display: "block",
        borderBottom: "1px solid #1a2a45",
      }}
    >
      {children}
    </Link>
  );
}
