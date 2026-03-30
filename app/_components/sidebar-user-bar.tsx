"use client";

import type { User } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { LogoutButton } from "./logout-button";

function toTitleCase(value: string) {
  return value
    .split(/[\s._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function getDisplayName(user: User | null) {
  if (!user) return "Usuario";

  const metadata = user.user_metadata as Record<string, unknown>;
  const fullName =
    metadata.full_name ??
    metadata.name ??
    metadata.display_name ??
    (metadata.first_name || metadata.last_name
      ? `${metadata.first_name ?? ""} ${metadata.last_name ?? ""}`.trim()
      : null);

  if (typeof fullName === "string" && fullName.trim()) {
    return fullName.trim();
  }

  const emailLocalPart = user.email?.split("@")[0];
  return emailLocalPart ? toTitleCase(emailLocalPart) : "Usuario";
}

function getSecondaryInfo(user: User | null) {
  if (!user) return "Sessao ativa";

  const appMetadata = user.app_metadata as Record<string, unknown>;
  const userMetadata = user.user_metadata as Record<string, unknown>;
  const role = appMetadata.role ?? userMetadata.role;

  if (typeof role === "string" && role.trim()) {
    return role.replace(/_/g, " ").toUpperCase();
  }

  return user.email ?? "Sessao ativa";
}

function getInitials(label: string) {
  const parts = label.split(/\s+/).filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
  }

  return label.slice(0, 2).toUpperCase();
}

export function SidebarUserBar() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadUser() {
      const {
        data: { user: currentUser }
      } = await supabaseBrowser.auth.getUser();

      if (isMounted) {
        setUser(currentUser);
      }
    }

    void loadUser();

    const {
      data: { subscription }
    } = supabaseBrowser.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const displayName = getDisplayName(user);
  const secondaryInfo = getSecondaryInfo(user);
  const initials = getInitials(displayName);

  return (
    <div className="profile-card sidebar-profile-card">
      <div className="profile-avatar" aria-hidden="true">
        <span>{initials}</span>
      </div>

      <div className="profile-copy sidebar-profile-copy">
        <strong>{displayName}</strong>
        <span>{secondaryInfo}</span>
      </div>

      <LogoutButton />
    </div>
  );
}
