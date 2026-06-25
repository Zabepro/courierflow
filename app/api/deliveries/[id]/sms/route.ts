import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { user, error } = await requireAuth();
  if (error) return error;

  const logs = await prisma.smsLog.findMany({
    where: { deliveryId: id, organizationId: user.organizationId },
    orderBy: { createdAt: "desc" },
  });

  // Serialize Decimal -> string
  const data = logs.map((log) => ({
    ...log,
    cost: log.cost?.toString() ?? null,
  }));

  return NextResponse.json({ data });
}
