import Link from "next/link";
import { SignupForm } from "./SignupForm";

export const metadata = { title: "Sign up - mindlap" };

export default function SignupPage() {
  return (
    <main style={{ maxWidth: 360, margin: "0 auto", padding: "64px 32px" }}>
      <h1>Sign up</h1>
      <p style={{ color: "var(--muted)", marginBottom: 32 }}>
        Track your cognitive performance over time.
      </p>
      <SignupForm />
      <hr />
      <p style={{ fontSize: 13, color: "var(--muted)" }}>
        Already have an account?{" "}
        <Link href="/login" style={{ color: "var(--accent)" }}>
          Sign in
        </Link>
      </p>
    </main>
  );
}
