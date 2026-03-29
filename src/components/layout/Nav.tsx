"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState, useRef, useEffect } from "react";
import { Logo } from "@/components/Logo";

const SYS = "var(--font-sans)";

export function Nav() {
  const { data: session, status } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownOpen]);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/conversations")
      .then((r) => r.json())
      .then((data: { totalUnread?: number }) => {
        if (typeof data.totalUnread === "number") {
          setUnreadCount(data.totalUnread);
        }
      })
      .catch(() => {});
  }, [status]);

  const user = session?.user as { firstName?: string; role?: string } | undefined;

  return (
    <nav
      style={{
        background: "#0f1623",
        borderBottom: "1px solid #243456",
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
        <Logo variant="light" linked className="text-xl" />

        {/* Desktop nav links */}
        <div className="hidden md:flex" style={{ alignItems: "center", gap: 8 }}>
          <NavLink href="/listings">Browse</NavLink>
          <NavLink href="/how-it-works">How It Works</NavLink>
          <NavLink href="/pricing">Pricing</NavLink>
          <NavLink href="/guides">Guides</NavLink>
          <NavLink href="/faq">FAQ</NavLink>
          <NavLink href="/about">About</NavLink>

          {status === "loading" ? null : session ? (
            <>
              <div style={{ width: 1, height: 20, background: "#243456", margin: "0 4px" }} />
              {/* Favourites link */}
              <Link
                href="/favourites"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  color: "rgba(255,255,255,0.65)",
                  fontSize: 14,
                  fontWeight: 500,
                  textDecoration: "none",
                  padding: "6px 12px",
                  borderRadius: 6,
                  fontFamily: SYS,
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
                Favourites
              </Link>
              {/* User dropdown */}
              <div ref={dropdownRef} style={{ position: "relative" }}>
                <button
                  onClick={() => setDropdownOpen((o) => !o)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    background: dropdownOpen ? "#1b2640" : "transparent",
                    border: "1px solid",
                    borderColor: dropdownOpen ? "#334766" : "transparent",
                    color: "rgba(255,255,255,0.85)",
                    borderRadius: 8,
                    padding: "6px 12px",
                    fontSize: 14,
                    fontFamily: SYS,
                    fontWeight: 500,
                    cursor: "pointer",
                    transition: "background 0.15s, border-color 0.15s",
                  }}
                  aria-haspopup="true"
                  aria-expanded={dropdownOpen}
                >
                  {user?.firstName ?? session.user?.name ?? "Account"}
                  {unreadCount > 0 && (
                    <span
                      style={{
                        background: "#f59e0b",
                        color: "#1a0f00",
                        borderRadius: 10,
                        padding: "1px 6px",
                        fontSize: 11,
                        fontWeight: 700,
                        minWidth: 16,
                        textAlign: "center",
                      }}
                    >
                      {unreadCount}
                    </span>
                  )}
                  <svg
                    width="12"
                    height="12"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    style={{
                      transform: dropdownOpen ? "rotate(180deg)" : "rotate(0deg)",
                      transition: "transform 0.15s",
                      opacity: 0.6,
                    }}
                  >
                    <polyline points="2,4 6,8 10,4" />
                  </svg>
                </button>

                {dropdownOpen && (
                  <div
                    style={{
                      position: "absolute",
                      top: "calc(100% + 8px)",
                      right: 0,
                      background: "#ffffff",
                      border: "1px solid #e5e2db",
                      borderRadius: 12,
                      boxShadow: "0 4px 6px rgba(15,22,35,0.04), 0 12px 32px rgba(15,22,35,0.10)",
                      minWidth: 200,
                      overflow: "hidden",
                      zIndex: 200,
                    }}
                  >
                    <DropdownLink href="/account" onClick={() => setDropdownOpen(false)}>
                      My Account
                    </DropdownLink>
                    <DropdownLink href="/dashboard/buyer" onClick={() => setDropdownOpen(false)}>
                      Buyer Dashboard
                    </DropdownLink>
                    {(user?.role === "SELLER" || user?.role === "BOTH") && (
                      <DropdownLink href="/dashboard/seller" onClick={() => setDropdownOpen(false)}>
                        Seller Dashboard
                      </DropdownLink>
                    )}
                    <div style={{ position: "relative" }}>
                      <DropdownLink
                        href="/dashboard/messages"
                        onClick={() => { setDropdownOpen(false); setUnreadCount(0); }}
                      >
                        Messages
                      </DropdownLink>
                      {unreadCount > 0 && (
                        <span
                          style={{
                            position: "absolute",
                            top: "50%",
                            right: 16,
                            transform: "translateY(-50%)",
                            background: "#f59e0b",
                            color: "#1a0f00",
                            borderRadius: 10,
                            padding: "1px 6px",
                            fontSize: 11,
                            fontWeight: 700,
                            pointerEvents: "none",
                          }}
                        >
                          {unreadCount}
                        </span>
                      )}
                    </div>
                    <div style={{ height: 1, background: "#e5e2db", margin: "4px 0" }} />
                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        signOut({ callbackUrl: "/" });
                      }}
                      style={{
                        display: "block",
                        width: "100%",
                        padding: "10px 16px",
                        textAlign: "left",
                        background: "transparent",
                        border: "none",
                        fontSize: 14,
                        fontFamily: SYS,
                        color: "#e05252",
                        fontWeight: 500,
                        cursor: "pointer",
                      }}
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
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
                  fontFamily: SYS,
                }}
              >
                Sign in
              </Link>
              <Link
                href="/register"
                style={{
                  background: "#f59e0b",
                  color: "#1a0f00",
                  fontSize: 14,
                  fontWeight: 600,
                  textDecoration: "none",
                  padding: "8px 18px",
                  borderRadius: 8,
                  fontFamily: SYS,
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
            padding: 11,
            minWidth: 44,
            minHeight: 44,
            alignItems: "center",
            justifyContent: "center",
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
            background: "#0f1623",
            borderTop: "1px solid #243456",
            padding: "12px 24px 20px",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <MobileNavLink href="/listings" onClick={() => setMenuOpen(false)}>Browse</MobileNavLink>
            <MobileNavLink href="/how-it-works" onClick={() => setMenuOpen(false)}>How It Works</MobileNavLink>
            <MobileNavLink href="/pricing" onClick={() => setMenuOpen(false)}>Pricing</MobileNavLink>
            <MobileNavLink href="/guides" onClick={() => setMenuOpen(false)}>Guides</MobileNavLink>
            <MobileNavLink href="/faq" onClick={() => setMenuOpen(false)}>FAQ</MobileNavLink>
            <MobileNavLink href="/about" onClick={() => setMenuOpen(false)}>About</MobileNavLink>
            {status === "loading" ? null : session ? (
              <>
                <MobileNavLink href="/account" onClick={() => setMenuOpen(false)}>My Account</MobileNavLink>
                <MobileNavLink href="/dashboard/buyer" onClick={() => setMenuOpen(false)}>Buyer Dashboard</MobileNavLink>
                {(user?.role === "SELLER" || user?.role === "BOTH") && (
                  <MobileNavLink href="/dashboard/seller" onClick={() => setMenuOpen(false)}>
                    Seller Dashboard
                  </MobileNavLink>
                )}
                <MobileNavLink href="/favourites" onClick={() => setMenuOpen(false)}>
                  Favourites
                </MobileNavLink>
                <MobileNavLink href="/dashboard/messages" onClick={() => { setMenuOpen(false); setUnreadCount(0); }}>
                  Messages{unreadCount > 0 ? ` (${unreadCount})` : ""}
                </MobileNavLink>
                <button
                  onClick={() => { setMenuOpen(false); signOut({ callbackUrl: "/" }); }}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#e05252",
                    fontSize: 15,
                    fontFamily: SYS,
                    textAlign: "left",
                    padding: "10px 0",
                    cursor: "pointer",
                    minHeight: 44,
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
        fontFamily: SYS,
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
        padding: "12px 0",
        minHeight: 44,
        fontFamily: SYS,
        display: "flex",
        alignItems: "center",
        borderBottom: "1px solid #1b2640",
      }}
    >
      {children}
    </Link>
  );
}

function DropdownLink({
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
        display: "block",
        padding: "10px 16px",
        fontSize: 14,
        fontFamily: SYS,
        fontWeight: 500,
        color: "#0f1623",
        textDecoration: "none",
        transition: "background 0.1s",
      }}
      onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.background = "#f7f5f0")}
      onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.background = "transparent")}
    >
      {children}
    </Link>
  );
}
