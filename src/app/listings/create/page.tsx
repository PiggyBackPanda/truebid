import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

export const metadata: Metadata = {
  title: "List Your Property",
  description: "List your property on TrueBid — free. No agent commission. No marketing fees.",
};
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

// Entry point — if seller has an existing DRAFT, resume it; otherwise start fresh
export default async function CreateListingPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/login?callbackUrl=/listings/create");
  }

  const user = session.user as unknown as Record<string, unknown>;
  const userId = user.id as string;

  // Look for an existing draft to resume
  const draft = await prisma.listing.findFirst({
    where: { sellerId: userId, status: "DRAFT" },
    orderBy: { updatedAt: "desc" },
    select: { id: true },
  });

  if (draft) {
    redirect(`/listings/create/details?id=${draft.id}&resume=true`);
  }

  redirect("/listings/create/details");
}
