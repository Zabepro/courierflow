import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";

export default async function SyncPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  // Attempt to sync immediately (useful if the webhook is delayed)
  let user = await prisma.user.findUnique({ where: { clerkId: userId } });
  
  if (!user || !user.organizationId) {
    const clerkUser = await currentUser();
    const email = clerkUser?.emailAddresses[0]?.emailAddress;
    
    if (email) {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        await prisma.user.update({ where: { id: existing.id }, data: { clerkId: userId } });
        user = existing;
      }
    }
  }

  // If synced successfully, send them to dashboard
  if (user && user.organizationId) {
    redirect("/dashboard");
  }

  // Otherwise, render a loading state and wait for webhook
  return (
    <div className="flex h-screen items-center justify-center bg-slate-50 p-4 text-center">
      <div className="space-y-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-cf-primary border-t-transparent mx-auto" />
        <p className="text-sm font-semibold text-slate-700">Akaunti yako inaandaliwa. Tafadhali subiri kidogo...</p>
        <p className="text-xs text-slate-500">Inaweza kuchukua sekunde chache kukamilika.</p>
        <meta httpEquiv="refresh" content="2" />
      </div>
    </div>
  );
}
