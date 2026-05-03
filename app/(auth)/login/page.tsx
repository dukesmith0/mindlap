import Link from "next/link";
import { LoginForm } from "./LoginForm";

export const metadata = { title: "Sign in - mindlap" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const params = await searchParams;
  return (
    <main style={{ maxWidth: 360, margin: "0 auto", padding: "64px 32px" }}>
      <h1>Sign in</h1>
      <p style={{ color: "var(--muted)", marginBottom: 32 }}>
        Welcome back to mindlap.
      </p>
      <LoginForm next={params.next ?? "/today"} initialError={params.error} />
      <hr />
      <p className="text-muted-sm">
        New here?{" "}
        <Link href="/signup" style={{ color: "var(--accent)" }}>
          Create an account
        </Link>
      </p>
    </main>
  );
}
