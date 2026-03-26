"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { registerFormSchema } from "@/lib/validation";

type Role = "BUYER" | "SELLER" | "BOTH";

const ROLES: { value: Role; label: string; description: string }[] = [
  { value: "BUYER", label: "Buy", description: "Browse and place offers on properties" },
  { value: "SELLER", label: "Sell", description: "List your property for free" },
  { value: "BOTH", label: "Buy & Sell", description: "Do both — most popular" },
];

export default function RegisterPage() {
  const router = useRouter();

  const [fields, setFields] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
  });
  const [role, setRole] = useState<Role>("BOTH");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  function setField(name: keyof typeof fields, value: string) {
    setFields((f) => ({ ...f, [name]: value }));
    if (errors[name]) setErrors((e) => ({ ...e, [name]: "" }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError("");

    // Client-side validation
    const result = registerFormSchema.safeParse({ ...fields, role, agreedToTerms });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((err) => {
        const field = err.path[0] as string;
        if (!fieldErrors[field]) fieldErrors[field] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: fields.firstName.trim(),
          lastName: fields.lastName.trim(),
          email: fields.email.trim().toLowerCase(),
          password: fields.password,
          phone: fields.phone.trim() || undefined,
          role,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.code === "EMAIL_EXISTS") {
          setErrors({ email: "An account with this email already exists." });
        } else if (data.code === "VALIDATION_ERROR") {
          setServerError("Please check your details and try again.");
        } else {
          setServerError("Something went wrong. Please try again.");
        }
        setLoading(false);
        return;
      }

      // Auto sign-in after registration
      await signIn("credentials", {
        email: fields.email.trim().toLowerCase(),
        password: fields.password,
        redirect: false,
      });

      // Sellers/both need to verify identity first
      if (role === "SELLER" || role === "BOTH") {
        router.push("/verify-identity");
      } else {
        router.push("/dashboard");
      }
    } catch {
      setServerError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        width: "100%",
        maxWidth: 520,
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
        Create your account
      </h1>
      <p style={{ textAlign: "center", color: "#6b7280", fontSize: 14, marginBottom: 28 }}>
        Free to join. No commissions. No middleman.
      </p>

      {/* Server error */}
      {serverError && (
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
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Name row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Input
            label="First name"
            required
            autoComplete="given-name"
            value={fields.firstName}
            onChange={(e) => setField("firstName", e.target.value)}
            error={errors.firstName}
          />
          <Input
            label="Last name"
            required
            autoComplete="family-name"
            value={fields.lastName}
            onChange={(e) => setField("lastName", e.target.value)}
            error={errors.lastName}
          />
        </div>

        <Input
          label="Email address"
          type="email"
          required
          autoComplete="email"
          value={fields.email}
          onChange={(e) => setField("email", e.target.value)}
          placeholder="you@example.com"
          error={errors.email}
        />

        <Input
          label="Phone number"
          type="tel"
          autoComplete="tel"
          value={fields.phone}
          onChange={(e) => setField("phone", e.target.value)}
          placeholder="0412 345 678"
          hint="Optional — Australian mobile format"
          error={errors.phone}
        />

        <Input
          label="Password"
          type="password"
          required
          autoComplete="new-password"
          value={fields.password}
          onChange={(e) => setField("password", e.target.value)}
          placeholder="••••••••"
          hint="Min 8 characters, 1 uppercase, 1 number"
          error={errors.password}
        />

        <Input
          label="Confirm password"
          type="password"
          required
          autoComplete="new-password"
          value={fields.confirmPassword}
          onChange={(e) => setField("confirmPassword", e.target.value)}
          placeholder="••••••••"
          error={errors.confirmPassword}
        />

        {/* Role selector */}
        <div>
          <p style={{ fontSize: 14, fontWeight: 500, color: "#1a1a1a", marginBottom: 10 }}>
            I want to <span style={{ color: "#e05252" }}>*</span>
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
            {ROLES.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => setRole(r.value)}
                style={{
                  background: role === r.value ? "rgba(232,168,56,0.08)" : "#ffffff",
                  border: `2px solid ${role === r.value ? "#e8a838" : "#e5e2db"}`,
                  borderRadius: 10,
                  padding: "12px 8px",
                  cursor: "pointer",
                  textAlign: "center",
                  transition: "border-color 0.15s, background 0.15s",
                }}
              >
                <p
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: role === r.value ? "#0f1a2e" : "#1a1a1a",
                    marginBottom: 4,
                    fontFamily: "Outfit, sans-serif",
                  }}
                >
                  {r.label}
                </p>
                <p
                  style={{
                    fontSize: 11,
                    color: "#6b7280",
                    lineHeight: 1.4,
                    fontFamily: "Outfit, sans-serif",
                  }}
                >
                  {r.description}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Terms */}
        <div>
          <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={agreedToTerms}
              onChange={(e) => {
                setAgreedToTerms(e.target.checked);
                if (errors.agreedToTerms) setErrors((err) => ({ ...err, agreedToTerms: "" }));
              }}
              style={{ accentColor: "#e8a838", width: 15, height: 15, marginTop: 2, flexShrink: 0 }}
            />
            <span style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.5 }}>
              I agree to the{" "}
              <Link href="/terms" style={{ color: "#4a90d9", textDecoration: "none" }}>
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/privacy" style={{ color: "#4a90d9", textDecoration: "none" }}>
                Privacy Policy
              </Link>
            </span>
          </label>
          {errors.agreedToTerms && (
            <p style={{ fontSize: 12, color: "#e05252", marginTop: 4 }} role="alert">
              {errors.agreedToTerms}
            </p>
          )}
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          loading={loading}
          className="w-full mt-2"
        >
          Create account
        </Button>
      </form>

      <p style={{ textAlign: "center", fontSize: 14, color: "#6b7280", marginTop: 24 }}>
        Already have an account?{" "}
        <Link href="/login" style={{ color: "#4a90d9", fontWeight: 500, textDecoration: "none" }}>
          Sign in
        </Link>
      </p>
    </div>
  );
}
