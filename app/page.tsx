import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { LandingContent } from "@/components/landing/landing-content";

export default async function HomePage() {
  const { userId } = await auth();
  if (userId) redirect("/dashboard");

  return <LandingContent />;
}
