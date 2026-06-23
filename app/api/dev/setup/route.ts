import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db/prisma";

export async function POST() {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 });
  }

  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return NextResponse.json({ error: "Sign in first" }, { status: 401 });
  }

  const clerkUser = await currentUser();
  const email = clerkUser?.emailAddresses[0]?.emailAddress ?? "dev@courierflow.co.tz";
  const name  = [clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(" ") || "Admin";

  // Always run full setup — all operations are upserts so it's idempotent
  const result = await prisma.$transaction(async (tx) => {
    const org = await tx.organization.upsert({
      where:  { slug: "dev-org" },
      update: {},
      create: {
        name: "CourierFlow Dev", slug: "dev-org",
        city: "Dar es Salaam", phone: "+255700000000", country: "Tanzania",
      },
    });

    const adminUser = await tx.user.upsert({
      where:  { clerkId },
      update: { organizationId: org.id, role: "ADMIN" },
      create: { clerkId, email, name, role: "ADMIN", organizationId: org.id },
    });

    const testDriver = await tx.user.upsert({
      where:  { clerkId: "dev_driver_001" },
      update: { organizationId: org.id },
      create: {
        clerkId: "dev_driver_001",
        email:   "driver@dev.courierflow.co.tz",
        name:    "Test Driver",
        phone:   "+255712000001",
        role:    "DRIVER",
        organizationId: org.id,
      },
    });

    return { org, adminUser, testDriver };
  });

  return NextResponse.json({
    success:      true,
    orgId:        result.org.id,
    testDriverId: result.testDriver.id,
  });
}
