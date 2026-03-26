import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { paginationSchema } from "@/lib/validation";

type AuthUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  verificationStatus: string;
  publicAlias: string;
};

export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function errorResponse(error: unknown): Response {
  if (error instanceof ApiError) {
    return Response.json(
      { error: error.message, code: error.code, details: error.details },
      { status: error.statusCode }
    );
  }

  // ZodError detection
  if (
    error &&
    typeof error === "object" &&
    "name" in error &&
    (error as { name: string }).name === "ZodError"
  ) {
    return Response.json(
      {
        error: "Validation failed",
        code: "VALIDATION_ERROR",
        details: (error as unknown as { errors: unknown }).errors,
      },
      { status: 400 }
    );
  }

  console.error("Unhandled API error:", error);
  return Response.json(
    { error: "Internal server error", code: "SERVER_ERROR" },
    { status: 500 }
  );
}

export async function requireAuth(): Promise<AuthUser> {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    throw new ApiError(401, "UNAUTHORIZED", "Authentication required");
  }

  const u = session.user as unknown as AuthUser;
  if (!u.id) {
    throw new ApiError(401, "UNAUTHORIZED", "Authentication required");
  }

  return u;
}

export function requireVerified(user: AuthUser): void {
  if (user.verificationStatus !== "VERIFIED") {
    throw new ApiError(
      403,
      "VERIFICATION_REQUIRED",
      "Identity verification is required to perform this action"
    );
  }
}

export function requireOwner(user: AuthUser, resourceUserId: string): void {
  if (user.id !== resourceUserId) {
    throw new ApiError(403, "FORBIDDEN", "You do not have permission to perform this action");
  }
}

export function paginationParams(searchParams: URLSearchParams): {
  page: number;
  limit: number;
  skip: number;
} {
  const parsed = paginationSchema.parse({
    page: searchParams.get("page") ?? 1,
    limit: searchParams.get("limit") ?? 20,
  });

  return {
    page: parsed.page,
    limit: parsed.limit,
    skip: (parsed.page - 1) * parsed.limit,
  };
}

export function paginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number
) {
  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}
