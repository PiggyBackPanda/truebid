import { prisma } from "@/lib/db";
import { registerApiSchema } from "@/lib/validation";
import { errorResponse } from "@/lib/api-helpers";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { ZodError } from "zod";
import bcrypt from "bcryptjs";

const BCRYPT_COST = 12;

async function generateUniqueAlias(role?: string): Promise<string> {
  const prefix = role === "SELLER" ? "Seller_" : role === "BUYER" ? "Buyer_" : "User_";
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  for (let attempt = 0; attempt < 10; attempt++) {
    let alias = prefix;
    for (let i = 0; i < 4; i++) {
      alias += chars[Math.floor(Math.random() * chars.length)];
    }
    const existing = await prisma.user.findUnique({ where: { publicAlias: alias } });
    if (!existing) return alias;
  }
  // Fallback: use timestamp-based suffix
  return `${prefix}${Date.now().toString(36).slice(-4)}`;
}

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const { success } = await rateLimit(`register:${ip}`, 10, 60);
    if (!success) {
      return Response.json(
        { error: "Too many requests. Please try again later.", code: "RATE_LIMITED" },
        { status: 429 }
      );
    }

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
      generateUniqueAlias(data.role),
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

    // Resolve any pending open-house attendance records for this email
    const pendingAttendances = await prisma.pendingInspectionAttendance.findMany({
      where: { email: data.email },
      select: { id: true, slotId: true },
    });

    if (pendingAttendances.length > 0) {
      const resolutions = await Promise.allSettled(
        pendingAttendances.map(async (pending) => {
          await prisma.inspectionBooking.upsert({
            where: { slotId_buyerId: { slotId: pending.slotId, buyerId: user.id } },
            create: {
              slotId: pending.slotId,
              buyerId: user.id,
              status: "ATTENDED",
              attendedAt: new Date(),
            },
            update: {
              status: "ATTENDED",
              attendedAt: new Date(),
              cancelledAt: null,
              cancelledBy: null,
            },
          });
          await prisma.pendingInspectionAttendance.delete({ where: { id: pending.id } });
        })
      );
      resolutions.forEach((result, i) => {
        if (result.status === "rejected") {
          console.error(
            `[register] Failed to resolve pending attendance ${pendingAttendances[i].id} for ${data.email}:`,
            result.reason
          );
        }
      });
    }

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
