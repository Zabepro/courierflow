import { SignIn } from "@clerk/nextjs";
import { AuthShell, clerkAppearance } from "@/components/auth/auth-shell";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect_url?: string }>;
}) {
  const { redirect_url } = await searchParams;
  // Only allow same-site relative redirects (e.g. /invite/<token>).
  const redirect = redirect_url?.startsWith("/") ? redirect_url : undefined;

  return (
    <AuthShell
      title="Welcome back. Let's get moving."
      subtitle="Sign in to dispatch drivers, track parcels and manage payments."
    >
      <SignIn appearance={clerkAppearance} {...(redirect ? { forceRedirectUrl: redirect } : {})} />
    </AuthShell>
  );
}
