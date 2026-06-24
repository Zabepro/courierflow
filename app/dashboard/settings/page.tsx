import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { SettingsView } from "@/components/settings/settings-view";


export default async function SettingsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const me = await prisma.user.findUnique({
    where:  { clerkId: userId },
    select: { id: true, role: true, organizationId: true },
  });
  if (!me?.organizationId) redirect("/dashboard");
  if (me.role === "DRIVER") redirect("/dashboard/driver");

  const org = await prisma.organization.findUnique({
    where:  { id: me.organizationId },
    select: {
      id: true, name: true, phone: true, address: true, city: true, country: true,
      createdAt: true,
      users: {
        select: { id: true, name: true, email: true, role: true },
        orderBy: [{ role: "asc" }, { name: "asc" }],
      },
      _count: { select: { users: true, deliveries: true } },
    },
  });
  if (!org) redirect("/dashboard");

  const canEdit = me.role === "ADMIN";
  const since   = org.createdAt.toLocaleDateString("en-TZ", { month: "short", year: "numeric" });

  return (
    <SettingsView
      org={{
        id: org.id,
        name: org.name,
        phone: org.phone,
        address: org.address,
        city: org.city,
        country: org.country,
      }}
      users={org.users}
      usersCount={org._count.users}
      deliveriesCount={org._count.deliveries}
      canEdit={canEdit}
      since={since}
    />
  );
}
