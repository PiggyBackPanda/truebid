import { prisma } from "@/lib/db";
import { registerApiSchema } from "@/lib/validation";
import { errorResponse } from "@/lib/api-helpers";
import { ZodError } from "zod";
import bcrypt from "bcryptjs";

const BCRYPT_COST = 12;

async function generateUniqueAlias(): Promise<string> {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  for (let attempt = 0; attempt < 10; attempt++) {
    let alias = "Buyer_";
    for (let i = 0; i < 4; i++) {
      alias += chars[Math.floor(Math.random() * chars.length)];
    }
    const existing = await prisma.user.findUnique({ where: { publicAlias: alias } });
    if (!existing) return alias;
  }
  // Fallback: use timestamp-based suffix
  return `Buyer_${Date.now().toString(36).slice(-4)}`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = registerApiSchema.parse(body);

    // Check email uniqueness
    const existing = await prisma.user.findUnique({
      where: { email: data.email },
      select: { id: true },
    });
    if (existing) {
      return Response.json(
        { error: "An account with this email already exists.", code: "EMAIL_EXISTS" },
        { status: 409 }
      );
    }

    const [passwordHash, publicAlias] = await Promise.all([
      bcrypt.hash(data.password, BCRYPT_COST),
      generateUniqueAlias(),
    ]);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone ?? null,
        role: data.role,
        publicAlias,
        verificationStatus: "UNVERIFIED",
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        verificationStatus: true,
        publicAlias: true,
        createdAt: true,
      },
    });

    return Response.json({ user }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return Response.json(
        { error: "Validation failed", code: "VALIDATION_ERROR", details: error.issues },
        { status: 400 }
      );
    }
    return errorResponse(error);
  }
}
