import { SignIn } from "@clerk/nextjs";
import { AuthShell, clerkAppearance } from "@/components/auth/auth-shell";

export default function SignInPage() {
  return (
    <AuthShell
      title="Welcome back. Let's get moving."
      subtitle="Sign in to dispatch drivers, track parcels and manage payments."
    >
      <SignIn appearance={clerkAppearance} />
    </AuthShell>
  );
}
