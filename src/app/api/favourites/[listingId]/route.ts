import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ listingId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ favourited: false });
    }

    const userId = (session.user as unknown as Record<string, unknown>).id as string;
    const { listingId } = await params;

    const favourite = await prisma.favourite.findUnique({
      where: { userId_listingId: { userId, listingId } },
      select: { id: true },
    });

    return NextResponse.json({ favourited: !!favourite });
  } catch (error) {
    logger.error("[GET /api/favourites/:listingId]", error);
    return NextResponse.json({ favourited: false });
  }
}
