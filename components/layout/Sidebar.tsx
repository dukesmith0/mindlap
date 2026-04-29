"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Item = {
  label: string;
  href: string;
  enabled: boolean;
  // Inline SVG, 14x14, no fill, accent on hover via currentColor.
  icon: React.ReactNode;
};

const ITEMS: Item[] = [
  {
    label: "Today",
    href: "/today",
    enabled: true,
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M2 12h2M20 12h2" />
      </svg>
    ),
  },
  {
    label: "Leaderboards",
    href: "/leaderboards",
    enabled: true,
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 20h4V10H4zM10 20h4V4h-4zM16 20h4v-7h-4z" />
      </svg>
    ),
  },
  {
    label: "Profile",
    href: "/profile/me",
    enabled: true,
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21c0-4 4-7 8-7s8 3 8 7" />
      </svg>
    ),
  },
  {
    label: "Friends",
    href: "/friends",
    enabled: false,
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="9" cy="8" r="3" />
        <circle cx="17" cy="9" r="2.5" />
        <path d="M3 20c0-3 3-5 6-5s6 2 6 5" />
      </svg>
    ),
  },
  {
    label: "Groups",
    href: "/groups",
    enabled: false,
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18" />
      </svg>
    ),
  },
  {
    label: "Settings",
    href: "/settings",
    enabled: true,
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
  },
];

export function Sidebar() {
  const pathname = usePathname() ?? "/";

  return (
    <aside className="app-sidebar">
      <ul>
        {ITEMS.map((item) => {
          // Profile gets a special-case so it lights up on the canonical
          // /profile/<username> URL after the /profile/me redirect.
          const isProfile = item.href.startsWith("/profile/");
          const isActive =
            item.enabled &&
            (isProfile
              ? pathname.startsWith("/profile/")
              : pathname === item.href ||
                (item.href !== "/" && pathname.startsWith(item.href + "/")));
          if (!item.enabled) {
            return (
              <li key={item.label}>
                <span className="sidebar-link is-disabled" title="coming in a later phase">
                  {item.icon}
                  <span>{item.label}</span>
                  <span className="sidebar-soon">soon</span>
                </span>
              </li>
            );
          }
          return (
            <li key={item.label}>
              <Link
                href={item.href}
                className={`sidebar-link${isActive ? " is-active" : ""}`}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
