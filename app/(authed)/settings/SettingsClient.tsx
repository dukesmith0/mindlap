"use client";

import { useId, useState, useTransition } from "react";
import { AvatarEditTrigger } from "@/components/ui/AvatarEditTrigger";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { FormField } from "@/components/ui/FormField";
import {
  changeUsernameAction,
  deleteAccountAction,
  setAcceptsFriendRequestsAction,
  setProfilePrivacyAction,
  setSkipTutorialsAction,
  setThemeAction,
  updateProfileBasicsAction,
} from "@/actions/profile";
import { changePasswordAction, signOutAction } from "@/actions/auth";
import type { ThemePref } from "@/lib/theme/cookie";

type Props = {
  email: string;
  username: string;
  usernameChangedAt: string | null;
  displayName: string;
  bio: string;
  avatarColor: string;
  avatarEmoji: string | null;
  themePref: ThemePref;
  isPublic: boolean;
  skipTutorials: boolean;
  acceptsFriendRequests: boolean;
  friendCode: string;
};

export function SettingsClient(p: Props) {
  return (
    <>
      <ProfileSection {...p} />
      <hr />
      <PreferencesSection
        themePref={p.themePref}
        skipTutorials={p.skipTutorials}
      />
      <hr />
      <AccountSection
        email={p.email}
        username={p.username}
        usernameChangedAt={p.usernameChangedAt}
        friendCode={p.friendCode}
        isPublic={p.isPublic}
        acceptsFriendRequests={p.acceptsFriendRequests}
      />
      <hr />
      <PasswordSection />
      <hr />
      <DangerZone username={p.username} />
    </>
  );
}

// ----------------------------------------------------------------------------
function ProfileSection({
  displayName,
  bio,
  avatarColor,
  avatarEmoji,
  username,
}: {
  displayName: string;
  bio: string;
  avatarColor: string;
  avatarEmoji: string | null;
  username: string;
}) {
  const nameId = useId();
  const bioId = useId();
  const [name, setName] = useState(displayName);
  const [bioVal, setBio] = useState(bio);
  const [info, setInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function save() {
    setError(null);
    setInfo(null);
    const form = new FormData();
    form.set("display_name", name);
    form.set("bio", bioVal);
    startTransition(async () => {
      const r = await updateProfileBasicsAction(form);
      if (r.ok) setInfo("Saved.");
      else setError(r.error);
    });
  }

  return (
    <section>
      <h2>profile</h2>
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
        <AvatarEditTrigger
          color={avatarColor}
          emoji={avatarEmoji}
          displayName={name || username}
          size={48}
          ariaLabel="edit avatar"
        />
        <span className="text-muted-sm">click avatar to change color or emoji</span>
      </div>
      <FormField label="display name (optional, max 40)" htmlFor={nameId}>
        <input
          id={nameId}
          type="text"
          value={name}
          maxLength={40}
          onChange={(e) => setName(e.target.value)}
          style={{ width: "100%" }}
        />
      </FormField>
      <FormField label="bio (optional, max 280)" htmlFor={bioId}>
        <textarea
          id={bioId}
          value={bioVal}
          maxLength={280}
          rows={3}
          onChange={(e) => setBio(e.target.value)}
          style={{ width: "100%" }}
        />
      </FormField>
      <button onClick={save} disabled={pending}>
        save profile
      </button>
      {info && <p className="tag" style={{ marginTop: 8 }}>{info}</p>}
      {error && <p className="tag-error" style={{ marginTop: 8 }}>{error}</p>}
    </section>
  );
}

// ----------------------------------------------------------------------------
function PreferencesSection({
  themePref,
  skipTutorials,
}: {
  themePref: ThemePref;
  skipTutorials: boolean;
}) {
  const [theme, setThemeState] = useState<ThemePref>(themePref);
  const [skip, setSkip] = useState(skipTutorials);
  const [pending, startTransition] = useTransition();

  function changeTheme(next: ThemePref) {
    const previous = theme;
    setThemeState(next);
    // Optimistic visual flip: update `<html data-theme>` immediately so the
    // CSS variables swap with no server round-trip (#44). The action persists
    // the cookie + profile row in the background; if it fails we roll back.
    let priorAttr: string | null = null;
    if (typeof document !== "undefined") {
      priorAttr = document.documentElement.getAttribute("data-theme");
      const resolved =
        next === "system"
          ? window.matchMedia("(prefers-color-scheme: dark)").matches
            ? "dark"
            : "light"
          : next;
      document.documentElement.setAttribute("data-theme", resolved);
    }
    const form = new FormData();
    form.set("theme", next);
    startTransition(async () => {
      const r = await setThemeAction(form);
      if (!r.ok) {
        setThemeState(previous);
        if (typeof document !== "undefined" && priorAttr !== null) {
          document.documentElement.setAttribute("data-theme", priorAttr);
        }
      }
    });
  }

  function toggleSkip() {
    const next = !skip;
    setSkip(next);
    startTransition(() => {
      void setSkipTutorialsAction(next);
    });
  }

  return (
    <section>
      <h2>preferences</h2>

      <div style={{ marginBottom: 24 }}>
        <p className="text-muted-xs" style={{ marginBottom: 8 }}>theme</p>
        <div style={{ display: "flex", gap: 16 }}>
          {(["light", "dark", "system"] as ThemePref[]).map((t) => (
            <label key={t} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
              <input
                type="radio"
                name="theme"
                checked={theme === t}
                onChange={() => changeTheme(t)}
                disabled={pending}
              />
              {t}
            </label>
          ))}
        </div>
      </div>

      <label style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
        <input type="checkbox" checked={skip} onChange={toggleSkip} disabled={pending} />
        <span>skip tutorials globally</span>
      </label>
    </section>
  );
}

// ----------------------------------------------------------------------------
function AccountSection({
  email,
  username,
  usernameChangedAt,
  friendCode,
  isPublic,
  acceptsFriendRequests,
}: {
  email: string;
  username: string;
  usernameChangedAt: string | null;
  friendCode: string;
  isPublic: boolean;
  acceptsFriendRequests: boolean;
}) {
  const usernameId = useId();
  const [u, setU] = useState(username);
  const [pub, setPub] = useState(isPublic);
  const [acceptsReqs, setAcceptsReqs] = useState(acceptsFriendRequests);
  const [info, setInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const lastChange = usernameChangedAt ? new Date(usernameChangedAt) : null;
  const nextAllowed = lastChange ? new Date(lastChange.getTime() + 30 * 86400000) : null;
  // Stable enough across re-renders for the form-session check; the server
  // re-validates on submit. useState ensures we read the boundary once.
  const [boundaryNow] = useState(() => Date.now());
  const canChangeUsername = !nextAllowed || nextAllowed.getTime() <= boundaryNow;

  function saveUsername() {
    setError(null);
    setInfo(null);
    const form = new FormData();
    form.set("username", u);
    startTransition(async () => {
      const r = await changeUsernameAction(form);
      if (r.ok) setInfo("Username saved.");
      else setError(r.error);
    });
  }

  function togglePublic() {
    const next = !pub;
    setPub(next);
    startTransition(() => {
      void setProfilePrivacyAction(next);
    });
  }

  function toggleAcceptsRequests() {
    const next = !acceptsReqs;
    setAcceptsReqs(next);
    startTransition(() => {
      void setAcceptsFriendRequestsAction(next);
    });
  }

  function copyFriendCode() {
    if (typeof navigator === "undefined" || !navigator.clipboard) return;
    navigator.clipboard.writeText(friendCode).catch(() => {});
  }

  return (
    <section>
      <h2>account</h2>
      <p style={{ fontSize: 13, marginBottom: 12 }}>
        email: <span style={{ color: "var(--muted)" }}>{email}</span>
      </p>

      <FormField label="username (changes allowed once per 30 days)" htmlFor={usernameId}>
        <input
          id={usernameId}
          type="text"
          value={u}
          maxLength={24}
          onChange={(e) => setU(e.target.value)}
          disabled={!canChangeUsername || pending}
          style={{ width: "100%" }}
        />
      </FormField>
      <button onClick={saveUsername} disabled={!canChangeUsername || pending || u === username}>
        save username
      </button>
      {!canChangeUsername && nextAllowed && (
        <p className="tag" style={{ marginTop: 6 }}>
          next change allowed: {nextAllowed.toLocaleDateString()}
        </p>
      )}

      <p style={{ fontSize: 13, marginTop: 24 }}>
        friend code:{" "}
        <span style={{ color: "var(--accent)", letterSpacing: 1 }}>{friendCode}</span>{" "}
        <button onClick={copyFriendCode} style={{ marginLeft: 8 }}>
          copy
        </button>
      </p>

      <label style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 8, marginTop: 16 }}>
        <input type="checkbox" checked={pub} onChange={togglePublic} disabled={pending} />
        <span>public profile</span>
        <span className="tag">
          {pub ? "your profile page is visible" : "profile is hidden, scores still appear on leaderboards"}
        </span>
      </label>

      <label style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 8, marginTop: 12 }}>
        <input type="checkbox" checked={acceptsReqs} onChange={toggleAcceptsRequests} disabled={pending} />
        <span>accept friend requests</span>
        <span className="tag">
          {acceptsReqs ? "anyone can send you a friend request" : "your profile shows 'not accepting requests'"}
        </span>
      </label>

      {info && <p className="tag" style={{ marginTop: 8 }}>{info}</p>}
      {error && <p className="tag-error" style={{ marginTop: 8 }}>{error}</p>}

      <p style={{ marginTop: 24 }}>
        <button onClick={() => signOutAction()}>sign out</button>
      </p>
    </section>
  );
}

// ----------------------------------------------------------------------------
function PasswordSection() {
  const currentId = useId();
  const newId = useId();
  const confirmId = useId();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [info, setInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function save() {
    setError(null);
    setInfo(null);
    if (next !== confirm) {
      setError("New passwords don't match.");
      return;
    }
    const form = new FormData();
    form.set("current_password", current);
    form.set("password", next);
    form.set("confirm_password", confirm);
    startTransition(async () => {
      const r = await changePasswordAction(form);
      if (r.ok) {
        setInfo("Password updated.");
        setCurrent("");
        setNext("");
        setConfirm("");
      } else {
        setError(r.error);
      }
    });
  }

  return (
    <section>
      <h2>password</h2>
      <FormField label="current password" htmlFor={currentId}>
        <input
          id={currentId}
          type="password"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          autoComplete="current-password"
          style={{ width: "100%" }}
        />
      </FormField>
      <FormField label="new password (10+ chars, 1 number or symbol)" htmlFor={newId}>
        <input
          id={newId}
          type="password"
          value={next}
          onChange={(e) => setNext(e.target.value)}
          minLength={10}
          autoComplete="new-password"
          style={{ width: "100%" }}
        />
      </FormField>
      <FormField label="confirm new password" htmlFor={confirmId}>
        <input
          id={confirmId}
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          minLength={10}
          autoComplete="new-password"
          style={{ width: "100%" }}
        />
      </FormField>
      <button onClick={save} disabled={pending || !current || !next || !confirm}>
        {pending ? "..." : "update password"}
      </button>
      {info && <p className="tag" style={{ marginTop: 8 }}>{info}</p>}
      {error && <p className="tag-error" style={{ marginTop: 8 }}>{error}</p>}
    </section>
  );
}

// ----------------------------------------------------------------------------
function DangerZone({ username }: { username: string }) {
  const confirmId = useId();
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  function open() {
    setError(null);
    if (confirm.trim().toLowerCase() !== username.toLowerCase()) {
      setError("Type your username exactly to confirm.");
      return;
    }
    setDialogOpen(true);
  }

  return (
    <section>
      <h2 className="danger-h2">delete account</h2>
      <p className="danger-h2" style={{ fontSize: 13, marginBottom: 8, textTransform: "none", letterSpacing: 0 }}>
        Deleting your account is permanent. All scores, badges, and friendships are removed.
      </p>
      <p className="text-muted-sm" style={{ marginBottom: 12 }}>
        Cascades through every score, badge, friendship, group membership. There is no undo.
      </p>
      <FormField
        label={`type your username (${username}) to confirm`}
        htmlFor={confirmId}
      >
        <input
          id={confirmId}
          type="text"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          style={{ width: "100%" }}
        />
      </FormField>
      <button onClick={open} disabled={!confirm} className="btn-danger">
        delete my account
      </button>
      {error && <p className="tag-error" style={{ marginTop: 8 }} role="alert">{error}</p>}
      <ConfirmDialog
        open={dialogOpen}
        title="delete account"
        message="This permanently removes your mindlap account, every score, every badge, and every friendship. There is no undo."
        confirmLabel="yes, delete forever"
        danger
        onConfirm={async () => {
          const form = new FormData();
          form.set("confirm_username", confirm);
          const r = await deleteAccountAction(form);
          // deleteAccountAction redirects on success, so we never get an `ok`
          // value back; only error paths return a result.
          return r ?? { ok: true };
        }}
        onClose={() => setDialogOpen(false)}
      />
    </section>
  );
}
