import type { Metadata } from "next";
import { TrackingPage } from "./tracking-page";

export async function generateMetadata({ params }: { params: Promise<{ code: string }> }): Promise<Metadata> {
  const { code } = await params;
  return {
    title: `Track ${code.toUpperCase()} — CourierFlow`,
    description: "Track your CourierFlow delivery in real time.",
  };
}

export default async function Page({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return <TrackingPage code={code.toUpperCase()} />;
}
