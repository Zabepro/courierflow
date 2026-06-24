"use client";

import { useEffect, useState } from "react";
import { useAuth, SignUp } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { IconUserCheck, IconAlertTriangle } from "@tabler/icons-react";

const appearance = { variables: { colorPrimary: "#0b5d5e" } };

export function InviteClient({
  token, driverName, orgName,
}: {
  token: string;
  driverName: string;
  orgName: string;
}) {
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "accepting" | "error">("idle");
  const [err, setErr] = useState("");

  /* Once the visitor is signed in, link their identity to the driver record. */
  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    let cancelled = false;
    setStatus("accepting");
    fetch("/api/invite/accept", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ token }),
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (res.ok) router.replace("/dashboard/driver");
        else { setStatus("error"); setErr((data as { error?: string }).error ?? "Could not accept the invite."); }
      })
      .catch(() => { if (!cancelled) { setStatus("error"); setErr("Network error — please try again."); } });
    return () => { cancelled = true; };
  }, [isLoaded, isSignedIn, token, router]);

  if (!isLoaded) {
    return <div className="h-8 w-8 animate-spin rounded-full border-4 border-cf-primary border-t-transparent" />;
  }

  if (isSignedIn) {
    if (status === "error") {
      return (
        <div className="w-full max-w-md rounded-2xl bg-white/[0.03] p-8 text-center ring-1 ring-white/10">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/15">
            <IconAlertTriangle className="h-6 w-6 text-red-400" stroke={2} />
          </div>
          <h1 className="font-heading text-lg font-bold">Couldn&apos;t join</h1>
          <p className="mt-2 text-sm text-white/60">{err}</p>
        </div>
      );
    }
    return (
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-cf-primary border-t-transparent" />
        <p className="text-sm text-white/60">Joining {orgName}…</p>
      </div>
    );
  }

  /* Signed out → show the invite + a sign-up form that returns here when done */
  return (
    <div className="w-full max-w-md">
      <div className="mb-5 rounded-2xl bg-white/[0.03] p-6 text-center ring-1 ring-white/10">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-cf-primary/15 text-cf-primary ring-1 ring-cf-primary/20">
          <IconUserCheck className="h-6 w-6" stroke={1.8} />
        </div>
        <h1 className="font-heading text-xl font-bold text-white">You&apos;re invited, {driverName}</h1>
        <p className="mt-1.5 text-sm text-white/60">
          Create your account below to join{" "}
          <span className="font-semibold text-white/80">{orgName}</span> as a driver.
        </p>
      </div>
      <div className="flex justify-center">
        <SignUp
          forceRedirectUrl={`/invite/${token}`}
          signInUrl={`/sign-in?redirect_url=${encodeURIComponent(`/invite/${token}`)}`}
          appearance={appearance}
        />
      </div>
    </div>
  );
}
