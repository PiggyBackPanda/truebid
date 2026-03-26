"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      email: email.trim().toLowerCase(),
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Invalid email or password. Please try again.");
      return;
    }

    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <div
      style={{
        width: "100%",
        maxWidth: 440,
        background: "#ffffff",
        border: "1px solid #e5e2db",
        borderRadius: 16,
        padding: "40px 40px 36px",
        boxShadow: "0 1px 3px rgba(15,26,46,0.06), 0 4px 12px rgba(15,26,46,0.04)",
      }}
    >
      {/* Logo */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 28 }}>
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
            }}
          >
            T
          </div>
          <span
            style={{
              fontFamily: "DM Serif Display, Georgia, serif",
              fontSize: 20,
              color: "#0f1a2e",
              letterSpacing: "-0.02em",
            }}
          >
            TrueBid
          </span>
        </Link>
      </div>

      <h1
        style={{
          fontFamily: "DM Serif Display, Georgia, serif",
          fontSize: 28,
          fontWeight: 400,
          color: "#0f1a2e",
          textAlign: "center",
          marginBottom: 8,
          letterSpacing: "-0.02em",
        }}
      >
        Welcome back
      </h1>
      <p style={{ textAlign: "center", color: "#6b7280", fontSize: 14, marginBottom: 28 }}>
        Sign in to your TrueBid account
      </p>

      {/* Error banner */}
      {error && (
        <div
          role="alert"
          style={{
            background: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: 8,
            padding: "10px 14px",
            marginBottom: 20,
            color: "#e05252",
            fontSize: 14,
          }}
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <Input
          label="Email address"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
        />

        <Input
          label="Password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
        />

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              style={{ accentColor: "#e8a838", width: 15, height: 15 }}
            />
            <span style={{ fontSize: 13, color: "#6b7280" }}>Remember me</span>
          </label>
          <span
            style={{ fontSize: 13, color: "#9ca3af", cursor: "not-allowed" }}
            title="Coming soon"
          >
            Forgot password?
          </span>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          loading={loading}
          className="w-full mt-2"
        >
          Sign in
        </Button>
      </form>

      <p style={{ textAlign: "center", fontSize: 14, color: "#6b7280", marginTop: 24 }}>
        Don&apos;t have an account?{" "}
        <Link href="/register" style={{ color: "#4a90d9", fontWeight: 500, textDecoration: "none" }}>
          Create one
        </Link>
      </p>
    </div>
  );
}
