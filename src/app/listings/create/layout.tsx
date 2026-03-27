import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Create Listing — TrueBid",
};

export default async function CreateListingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/login?callbackUrl=/listings/create");
  }

  return (
    <div className="min-h-screen bg-bg">
      {children}
    </div>
  );
}
