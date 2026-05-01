import Link from "next/link";

// Zetamac-pure empty state: muted text + optional accent CTA. No icons.
export function EmptyState({
  message,
  cta,
}: {
  message: string;
  cta?: { href: string; label: string };
}) {
  return (
    <div className="empty-state">
      <p className="empty-state-msg">{message}</p>
      {cta && (
        <Link href={cta.href} className="empty-state-cta">
          {cta.label} -&gt;
        </Link>
      )}
    </div>
  );
}
