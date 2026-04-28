export default function Page() {
  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "48px 64px" }}>
      <h1>mindlap</h1>
      <p style={{ color: "var(--muted)" }}>
        Track your cognitive performance over time.
      </p>
      <hr />
      <p>
        Phase 0 scaffold. Tokens loaded. Courier Prime wired. Streak pulse animation defined.
      </p>
      <p>
        <span style={{ color: "var(--accent)", animation: "streak-pulse 2s ease-in-out infinite" }}>
          12 day streak
        </span>
      </p>
      <hr />
      <button>play -&gt;</button>
    </main>
  );
}
