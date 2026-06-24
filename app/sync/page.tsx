import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { randomUUID } from "crypto";

function slugify(text: string) {
  return text.toString().toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

export default async function SyncPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  // Attempt to sync immediately (useful if the webhook is delayed or failed)
  let user = await prisma.user.findUnique({ where: { clerkId: userId } });
  
  if (!user || !user.organizationId) {
    const clerkUser = await currentUser();
    const email = clerkUser?.emailAddresses[0]?.emailAddress;
    const name = [clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(" ") || null;
    
    if (email) {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        // Link to existing pre-registered driver or admin
        await prisma.user.update({ 
          where: { id: existing.id }, 
          data: { clerkId: userId, ...(existing.name ? {} : { name }) } 
        });
        user = { ...existing, clerkId: userId, organizationId: existing.organizationId } as typeof existing;
      } else {
        // Fallback: Provision a new personal org and admin user right now!
        try {
          await prisma.$transaction(async (tx) => {
            let slug = "";
            for (let i = 0; i < 5; i++) {
              const candidate = `${slugify(name || email.split("@")[0])}-${randomUUID().slice(0, 6)}`;
              const taken = await tx.organization.findUnique({ where: { slug: candidate }, select: { id: true } });
              if (!taken) { slug = candidate; break; }
            }
            if (!slug) slug = `org-${randomUUID().slice(0, 12)}`;

            const org = await tx.organization.create({
              data: {
                name: name ? `${name}'s Organization` : "My Organization",
                slug,
                country: "Tanzania",
              },
            });

            user = await tx.user.create({
              data: { clerkId: userId, email, name, role: "ADMIN", organizationId: org.id },
            });
          });
        } catch (error) {
          // Ignore unique constraint errors in case of race condition with webhook
          console.error("[Sync] Error provisioning fallback user:", error);
        }
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
