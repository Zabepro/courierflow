import { SignUp } from "@clerk/nextjs";
import { AuthShell, clerkAppearance } from "@/components/auth/auth-shell";

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect_url?: string }>;
}) {
  const { redirect_url } = await searchParams;
  const redirect = redirect_url?.startsWith("/") ? redirect_url : undefined;

  return (
    <AuthShell>
      <SignUp appearance={clerkAppearance} {...(redirect ? { forceRedirectUrl: redirect } : {})} />
    </AuthShell>
  );
}
