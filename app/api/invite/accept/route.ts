import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { enforceRateLimit } from "@/lib/security/rate-limit";

/**
 * POST /api/invite/accept  { token }
 *
 * Links the signed-in Clerk identity to the driver record the admin pre-created
 * (matched by invite token). A fresh sign-up may have triggered the Clerk
 * webhook to spin up a throwaway personal org for this identity — if so, and it
 * holds no data, we remove it so the clerkId can attach to the invited driver.
 * Refuses to convert an account that already owns real data.
 */
export async function POST(req: Request) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Sign in to accept the invite" }, { status: 401 });

  // Defence-in-depth: stop a signed-in account from hammering invite tokens.
  const limited = await enforceRateLimit(`rate:invite:accept:${clerkId}`, 10, 60);
  if (limited) return limited;

  const body  = (await req.json().catch(() => null)) as { token?: string } | null;
  const token = body?.token?.trim();
  if (!token) return NextResponse.json({ error: "Missing invite token" }, { status: 400 });

  const driver = await prisma.user.findUnique({
    where:  { inviteToken: token },
    select: { id: true, organizationId: true, name: true },
  });
  if (!driver) {
    return NextResponse.json(
      { error: "This invite is invalid or has already been used." },
      { status: 404 },
    );
  }

  const clerkUser = await currentUser();
  const name = [clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(" ") || driver.name;

  try {
    await prisma.$transaction(async (tx) => {
      const existing = await tx.user.findUnique({
        where:  { clerkId },
        select: { id: true, organizationId: true },
      });

      if (existing && existing.id !== driver.id) {
        const orgId = existing.organizationId;
        const [otherUsers, dels] = await Promise.all([
          tx.user.count({ where: { organizationId: orgId ?? "", id: { not: existing.id } } }),
          tx.delivery.count({ where: { organizationId: orgId ?? "" } }),
        ]);
        // Only safe to remove a fresh, empty personal org.
        if (otherUsers > 0 || dels > 0) {
          throw new Error("ACCOUNT_IN_USE");
        }
        await tx.user.delete({ where: { id: existing.id } });
        if (orgId) await tx.organization.delete({ where: { id: orgId } }).catch(() => {});
      }

      await tx.user.update({
        where: { id: driver.id },
        data:  { clerkId, inviteToken: null, ...(name ? { name } : {}) },
      });
    });
  } catch (e) {
    if (e instanceof Error && e.message === "ACCOUNT_IN_USE") {
      return NextResponse.json(
        { error: "You're signed in with an account that already has data. Sign out and use a new account to accept this driver invite." },
        { status: 409 },
      );
    }
    console.error("[invite/accept] error:", e);
    return NextResponse.json({ error: "Could not complete the invite. Please try again." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
