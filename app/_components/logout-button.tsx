"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { supabaseBrowser } from "@/lib/supabase/browser";

export function LogoutButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [hasError, setHasError] = useState(false);

  async function handleLogout() {
    setHasError(false);

    const { error } = await supabaseBrowser.auth.signOut();

    if (error) {
      setHasError(true);
      return;
    }

    startTransition(() => {
      router.replace("/login");
      router.refresh();
    });
  }

  return (
    <div className="logout-slot">
      <button
        type="button"
        className="logout-button logout-button--icon"
        onClick={handleLogout}
        disabled={isPending}
        aria-label="Sair da conta"
        title={isPending ? "Saindo..." : "Logoff"}
      >
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M10 6H7.75A1.75 1.75 0 0 0 6 7.75v8.5C6 17.216 6.784 18 7.75 18H10"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="M13 8.5 17 12l-4 3.5M17 12H10"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {hasError ? <span className="logout-error">Nao foi possivel sair.</span> : null}
    </div>
  );
}
