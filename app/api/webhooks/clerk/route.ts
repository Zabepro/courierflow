import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { prisma } from "@/lib/db/prisma";

/**
 * POST /api/webhooks/clerk
 *
 * Provisions the local database when Clerk reports identity changes. The first
 * time we see a user we create a personal Organization and make them its ADMIN
 * so the dashboard is usable immediately — without this, requireAuth() rejects
 * every new sign-up with "User is not linked to an organization".
 *
 * Signature is verified with CLERK_WEBHOOK_SIGNING_SECRET (Svix). Configure the
 * endpoint URL + secret in the Clerk dashboard → Webhooks.
 */

function slugify(base: string): string {
  const s = base
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32);
  return s || "org";
}

export async function POST(req: NextRequest) {
  let evt: Awaited<ReturnType<typeof verifyWebhook>>;
  try {
    evt = await verifyWebhook(req);
  } catch (err) {
    console.error("[Clerk Webhook] signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (evt.type) {
      case "user.created":
      case "user.updated": {
        const data = evt.data;
        const clerkId = data.id;
        const email =
          data.email_addresses?.find((e) => e.id === data.primary_email_address_id)?.email_address ??
          data.email_addresses?.[0]?.email_address ??
          null;
        const name = [data.first_name, data.last_name].filter(Boolean).join(" ") || null;

        if (!email) {
          console.warn(`[Clerk Webhook] ${evt.type} ${clerkId} has no email — skipping`);
          return NextResponse.json({ ok: true });
        }

        const existing = await prisma.user.findUnique({
          where: { clerkId },
          select: { id: true },
        });

        if (existing) {
          // Keep profile in sync; never touch an existing organization link.
          await prisma.user.update({ where: { clerkId }, data: { email, name } });
          return NextResponse.json({ ok: true });
        }

        // An admin may have pre-registered this person by email (e.g. an invited
        // driver). Link the Clerk identity to that record instead of creating a
        // brand-new organization, preserving their role + org membership.
        const preRegistered = await prisma.user.findUnique({
          where:  { email },
          select: { id: true, name: true },
        });
        if (preRegistered) {
          await prisma.user.update({
            where: { id: preRegistered.id },
            data:  { clerkId, ...(preRegistered.name ? {} : { name }) },
          });
          console.info(`[Clerk Webhook] linked ${clerkId} to pre-registered ${email}`);
          return NextResponse.json({ ok: true });
        }

        // First sighting → provision a personal org and ADMIN user atomically.
        await prisma.$transaction(async (tx) => {
          let slug = "";
          for (let i = 0; i < 5; i++) {
            const candidate = `${slugify(name ?? email.split("@")[0])}-${randomUUID().slice(0, 6)}`;
            const taken = await tx.organization.findUnique({
              where: { slug: candidate },
              select: { id: true },
            });
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

          await tx.user.create({
            data: { clerkId, email, name, role: "ADMIN", organizationId: org.id },
          });
        });

        console.info(`[Clerk Webhook] provisioned user + org for ${clerkId}`);
        return NextResponse.json({ ok: true });
      }

      case "user.deleted": {
        // Best-effort cleanup. Kept non-fatal: a user with delivery/location
        // history can't be hard-deleted (FK constraints), and that's fine —
        // we log it and let the provider stop retrying.
        const clerkId = evt.data.id;
        if (clerkId) {
          await prisma.user
            .deleteMany({ where: { clerkId } })
            .catch((e) => console.warn("[Clerk Webhook] user.deleted skipped:", e instanceof Error ? e.message : e));
        }
        return NextResponse.json({ ok: true });
      }

      default:
        return NextResponse.json({ ok: true });
    }
  } catch (err) {
    // Unique-constraint race on a retried delivery → already processed.
    if ((err as { code?: string }).code === "P2002") {
      console.warn("[Clerk Webhook] duplicate event — already processed");
      return NextResponse.json({ ok: true });
    }
    console.error("[Clerk Webhook] handler error:", err);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}
