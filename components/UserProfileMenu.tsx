"use client";

import { DNA_BODY, DNA_CAPTION, DNA_LABEL_STRONG } from "@/lib/design-dna";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { openAuthPrompt } from "@/lib/open-auth-prompt";
import { HOME_PRIMARY_BUTTON } from "@/lib/home-ui";

type AuthUser = {
  id: string;
  email: string;
  name?: string;
};

function displayLabel(user: AuthUser): string {
  const name = user.name?.trim();
  if (name) return name;
  const local = user.email.split("@")[0]?.trim();
  return local || user.email;
}

export function UserProfileMenu() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<AuthUser | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const initials = useMemo(() => {
    const source = user?.name?.trim() || user?.email || "U";
    return source.slice(0, 1).toUpperCase();
  }, [user]);

  const label = useMemo(() => (user ? displayLabel(user) : ""), [user]);

  async function refreshAuthState() {
    setLoading(true);
    try {
      const authRes = await fetch("/api/auth/me", {
        method: "GET",
        credentials: "include",
      });
      if (!authRes.ok) {
        setUser(null);
        return;
      }
      const authData = (await authRes.json()) as { user?: AuthUser };
      setUser(authData.user ?? null);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refreshAuthState();
    const onAuthChanged = () => void refreshAuthState();
    window.addEventListener("auth-state-changed", onAuthChanged);
    return () =>
      window.removeEventListener("auth-state-changed", onAuthChanged);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("auth_success") !== "true") return;

    void refreshAuthState().then(() => {
      window.dispatchEvent(new Event("auth-state-changed"));
      params.delete("auth_success");
      const query = params.toString();
      window.history.replaceState(
        {},
        "",
        `${window.location.pathname}${query ? `?${query}` : ""}`
      );
    });
  }, []);

  useEffect(() => {
    if (!open) return;

    function handleClickOutside(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    const timer = window.setTimeout(() => {
      document.addEventListener("click", handleClickOutside);
    }, 0);

    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("click", handleClickOutside);
    };
  }, [open]);

  async function handleSignOut() {
    setOpen(false);
    try {
      await fetch("/api/auth/signout", {
        method: "POST",
        credentials: "include",
      });
    } finally {
      setUser(null);
      window.dispatchEvent(new Event("auth-state-changed"));
    }
  }

  if (loading) {
    return <span className={`px-1 ${DNA_CAPTION}`}>…</span>;
  }

  if (!user) {
    return (
      <button
        type="button"
        onClick={() => openAuthPrompt()}
        className={`rounded-lg px-2 py-1.5 ${DNA_BODY} hover:bg-stone-100 dark:hover:bg-stone-800`}
        data-testid="nav-sign-in"
      >
        Sign in
      </button>
    );
  }

  return (
    <div ref={rootRef} className="relative z-[10060] flex-shrink-0">
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          setOpen((prev) => !prev);
        }}
        className="flex items-center gap-2 rounded-lg border border-stone-200 px-2 py-1.5 text-left hover:bg-stone-100 dark:border-stone-700 dark:hover:bg-stone-800"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={`Account menu, signed in as ${user.email}`}
        data-testid="user-profile-menu-trigger"
      >
        <span
          className={`inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-sm font-semibold ${HOME_PRIMARY_BUTTON}`}
        >
          {initials}
        </span>
        <span
          className={`hidden max-w-[9rem] truncate sm:inline ${DNA_LABEL_STRONG}`}
        >
          {label}
        </span>
        <svg
          className={`h-4 w-4 flex-shrink-0 text-stone-500 transition-transform dark:text-stone-400 ${
            open ? "rotate-180" : ""
          }`}
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.24 4.5a.75.75 0 01-1.08 0l-4.24-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          data-testid="user-profile-dropdown"
          className="absolute right-0 top-[calc(100%+0.5rem)] w-72 rounded-lg border border-stone-200 bg-white shadow-xl dark:border-stone-700 dark:bg-stone-900"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="border-b border-stone-200 px-4 py-3 dark:border-stone-700">
            <p className={`${DNA_CAPTION}`}>Signed in as</p>
            <p className={`mt-0.5 break-all ${DNA_LABEL_STRONG}`}>
              {user.email}
            </p>
          </div>
          <div className="py-1">
            <Link
              href="/profile"
              role="menuitem"
              onClick={() => setOpen(false)}
              className={`block px-4 py-2.5 ${DNA_BODY} hover:bg-stone-100 dark:hover:bg-stone-800`}
            >
              User Profile
            </Link>
            <button
              type="button"
              role="menuitem"
              onClick={() => void handleSignOut()}
              className={`block w-full px-4 py-2.5 text-left ${DNA_BODY} hover:bg-stone-100 dark:hover:bg-stone-800`}
            >
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
