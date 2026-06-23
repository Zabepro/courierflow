import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import type { Role } from "@/lib/generated/prisma/client";

export type AuthUser = {
  id: string;
  clerkId: string;
  role: Role;
  organizationId: string;
  name: string | null;
  email: string;
};

type AuthResult =
  | { user: AuthUser; error: null }
  | { user: null; error: NextResponse };

export async function requireAuth(): Promise<AuthResult> {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return {
      user: null,
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true, clerkId: true, role: true, organizationId: true, name: true, email: true },
  });

  if (!user || !user.organizationId) {
    return {
      user: null,
      error: NextResponse.json(
        { error: "User is not linked to an organization" },
        { status: 403 }
      ),
    };
  }

  return { user: user as AuthUser, error: null };
}
