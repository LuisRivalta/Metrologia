"use client";

import { useEffect } from "react";
import {
  clearSupabaseSessionCookies,
  syncSupabaseSessionCookies
} from "@/lib/supabase/auth-session";
import { supabaseBrowser } from "@/lib/supabase/browser";

export function AuthSessionSync() {
  useEffect(() => {
    let isMounted = true;

    async function syncInitialSession() {
      const {
        data: { session }
      } = await supabaseBrowser.auth.getSession();

      if (!isMounted) {
        return;
      }

      syncSupabaseSessionCookies(session);
    }

    void syncInitialSession();

    const {
      data: { subscription }
    } = supabaseBrowser.auth.onAuthStateChange((_event, session) => {
      if (session) {
        syncSupabaseSessionCookies(session);
        return;
      }

      clearSupabaseSessionCookies();
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return null;
}
