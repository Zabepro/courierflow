import Link from "next/link";
import { IconTruck } from "@tabler/icons-react";
import { prisma } from "@/lib/db/prisma";
import { InviteClient } from "@/components/invite/invite-client";

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const driver = await prisma.user.findUnique({
    where:  { inviteToken: token },
    select: { name: true, organization: { select: { name: true } } },
  });

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0a1417] px-4 py-10 text-white">
      <div className="mb-6 flex items-center gap-2.5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cf-primary shadow-lg shadow-cf-primary/30">
          <IconTruck className="h-5 w-5 text-white" stroke={1.8} />
        </div>
        <span className="font-heading text-xl font-bold">CourierFlow</span>
      </div>

      {!driver ? (
        <div className="w-full max-w-md rounded-2xl bg-white/[0.03] p-8 text-center ring-1 ring-white/10">
          <h1 className="font-heading text-xl font-bold">Invite not found</h1>
          <p className="mt-2 text-sm text-white/55">
            This invite link is invalid or has already been used. Ask your admin for a new one.
          </p>
          <Link href="/" className="mt-5 inline-block rounded-xl bg-cf-primary px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-cf-primary/90">
            Go home
          </Link>
        </div>
      ) : (
        <InviteClient
          token={token}
          driverName={driver.name ?? "Driver"}
          orgName={driver.organization?.name ?? "the team"}
        />
      )}
    </div>
  );
}
