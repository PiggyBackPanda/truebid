# TrueBid — Authentication System Specification

## Overview

Authentication uses NextAuth.js v5 with a credentials provider (email/password), JWT strategy, and role-based access control. No OAuth providers at MVP — keep it simple.

---

## 1. Technology

- NextAuth.js v5 (`next-auth@beta`)
- JWT strategy (not database sessions — faster, stateless)
- bcrypt for password hashing (cost factor 12)
- Zod for input validation
- HTTP-only cookies for token storage (NextAuth handles this)

## 2. User Roles

```typescript
enum UserRole {
  BUYER    // Can browse, save, place offers, message sellers
  SELLER   // Can create listings, manage offers, message buyers
  BOTH     // Can do everything (most users will be this)
}
```

Role is set at registration and can be upgraded (BUYER → BOTH, SELLER → BOTH) but never downgraded. Upgrading happens automatically — if a BUYER creates a listing, their role becomes BOTH.

## 3. Registration Flow

### Page: `/register`

Form fields:
- First name (required, 1–50 chars)
- Last name (required, 1–50 chars)
- Email (required, valid email format, unique)
- Password (required, min 8 chars, must contain 1 uppercase letter and 1 number)
- Confirm password (must match)
- Phone (optional, Australian format: 04XX XXX XXX)
- "I want to" selector: "Buy a property" (BUYER), "Sell a property" (SELLER), "Both" (BOTH)
- Checkbox: "I agree to the Terms of Service and Privacy Policy" (required)

### API: `POST /api/auth/register`

1. Validate all inputs with Zod schema `registerSchema`.
2. Check email uniqueness — if exists, return 409 `EMAIL_EXISTS`.
3. Hash password with bcrypt (cost 12).
4. Generate a unique `publicAlias` in format `Buyer_` + 4 random alphanumeric chars. Check uniqueness, regenerate if collision.
5. Create User record with `verificationStatus: UNVERIFIED`.
6. Auto-sign-in the user (create JWT session via NextAuth).
7. Send welcome email with link to verify identity.
8. Return user profile and redirect to `/dashboard` (or `/verify-identity` if they chose SELLER/BOTH).

### Validation Schema

```typescript
const registerSchema = z.object({
  firstName: z.string().min(1).max(50).trim(),
  lastName: z.string().min(1).max(50).trim(),
  email: z.string().email().toLowerCase().trim(),
  password: z.string().min(8).regex(/[A-Z]/, "Must contain uppercase letter").regex(/[0-9]/, "Must contain a number"),
  confirmPassword: z.string(),
  phone: z.string().regex(/^04\d{2}\s?\d{3}\s?\d{3}$/).optional().or(z.literal("")),
  role: z.enum(["BUYER", "SELLER", "BOTH"]),
  agreedToTerms: z.literal(true, { errorMap: () => ({ message: "You must agree to the terms" }) }),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});
```

## 4. Login Flow

### Page: `/login`

Form fields:
- Email
- Password
- "Remember me" checkbox (extends session to 30 days instead of default 24 hours)

### API: `POST /api/auth/login` (handled by NextAuth)

1. Find user by email (case-insensitive).
2. Compare password with stored hash using bcrypt.
3. If no match, return 401 `INVALID_CREDENTIALS`. Do NOT reveal whether the email exists.
4. Update `lastLoginAt` timestamp.
5. Create JWT session.
6. Redirect to `/dashboard` (or the page they were trying to access before being redirected to login).

## 5. Session Management

### JWT Contents

```typescript
{
  sub: string;              // User ID
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  verificationStatus: VerificationStatus;
  publicAlias: string;
  iat: number;              // Issued at
  exp: number;              // Expiry
}
```

### Token Refresh

NextAuth handles this automatically. Default session length: 24 hours. "Remember me": 30 days. On each request, if the token is past halfway through its lifetime, NextAuth issues a new one.

### Accessing the Session

Server Components: `const session = await auth();`
Client Components: `const { data: session } = useSession();`
API Routes: `const session = await auth(); if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });`

## 6. Protected Routes — Middleware

Create `src/middleware.ts`:

```typescript
export { auth as middleware } from "@/lib/auth";

export const config = {
  matcher: [
    "/dashboard/:path*",     // All dashboard routes
    "/listings/create/:path*", // Listing creation
    "/api/offers/:path*",    // Offer endpoints (except GET)
    "/api/messages/:path*",  // Messaging
    "/api/dashboard/:path*", // Dashboard API
    "/api/verification/:path*", // Verification
    "/api/saves/:path*",     // Saves
  ],
};
```

Unauthenticated users hitting these routes are redirected to `/login?callbackUrl=[original-url]`.

## 7. Auth Helper Functions

Create in `src/lib/auth-helpers.ts`:

```typescript
// Use in API routes — throws if not authenticated
async function requireAuth(request?: Request): Promise<User>

// Use after requireAuth — throws 403 if not verified  
function requireVerified(user: User): void

// Use after requireAuth — throws 403 if user.id !== resourceOwnerId
function requireOwner(user: User, resourceOwnerId: string): void

// Use after requireAuth — throws 403 if user.role is not SELLER or BOTH
function requireSeller(user: User): void
```

## 8. Password Reset (Post-MVP but design for it)

Don't implement now, but the registration email should include a "If you forget your password, you can reset it from the login page." The login page should have a "Forgot password?" link that shows a "Coming soon" message at MVP.

## 9. UI Design

### Login Page
- Clean, centered card on the warm off-white background.
- TrueBid logo at top.
- Email and password fields.
- Amber "Sign In" button.
- "Don't have an account? Register" link below.
- "Forgot password?" link (greyed out at MVP).

### Register Page
- Same centered card layout.
- Two-column grid for first name / last name.
- Full-width email, password, confirm password.
- "I want to" as three selectable cards (Buy / Sell / Both) — not a dropdown.
- Terms checkbox with linked text.
- Amber "Create Account" button.
- "Already have an account? Sign in" link.

### Auth Errors
- Display inline below the relevant field (red text, small font).
- For server errors (email exists, invalid credentials), display as a subtle alert banner above the form.

## 10. Security

- Rate limit login attempts: 5 per minute per IP. After 5 failures, add a 60-second cooldown.
- Rate limit registration: 3 per hour per IP.
- Never log passwords or password hashes.
- Use CSRF protection (NextAuth handles this).
- Set secure, httpOnly, sameSite cookies (NextAuth default).
- Password requirements are enforced both client-side (Zod) and server-side (same Zod schema).
