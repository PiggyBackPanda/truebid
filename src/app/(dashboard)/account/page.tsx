import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { AccountClient } from "@/components/dashboard/AccountClient";
export const metadata = { title: "Account Settings | TrueBid" };

export default async function AccountPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const userId = (session.user as { id: string }).id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      role: true,
      verificationStatus: true,
      notificationPreferences: true,
    },
  });

  if (!user) redirect("/login");

  const rawPrefs = user.notificationPreferences as {
    newOffers?: boolean;
    offerUpdates?: boolean;
    messages?: boolean;
    listingActivity?: boolean;
  } | null;

  const prefs = {
    newOffers: rawPrefs?.newOffers ?? true,
    offerUpdates: rawPrefs?.offerUpdates ?? true,
    messages: rawPrefs?.messages ?? true,
    listingActivity: rawPrefs?.listingActivity ?? true,
  };

  return (
    <AccountClient
      user={{
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone ?? "",
        role: user.role,
        verificationStatus: user.verificationStatus,
      }}
      notificationPrefs={prefs}
    />
  );
}
