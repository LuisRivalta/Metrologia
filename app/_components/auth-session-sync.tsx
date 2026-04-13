"use client";

import { useEffect } from "react";
import {
  clearSupabaseSessionCookies,
  readSupabaseSessionCookies,
  syncSupabaseSessionCookies
} from "@/lib/supabase/auth-session";
import { supabaseBrowser } from "@/lib/supabase/browser";

export function AuthSessionSync() {
  useEffect(() => {
    let isMounted = true;

    async function syncInitialSession() {
      const cookieSession = readSupabaseSessionCookies();
      const {
        data: { session }
      } = await supabaseBrowser.auth.getSession();

      if (!isMounted) {
        return;
      }

      if (cookieSession.accessToken && cookieSession.refreshToken) {
        const cookieSessionChanged =
          !session ||
          session.access_token !== cookieSession.accessToken ||
          session.refresh_token !== cookieSession.refreshToken;

        if (cookieSessionChanged) {
          const {
            data: { session: updatedSession },
            error
          } = await supabaseBrowser.auth.setSession({
            access_token: cookieSession.accessToken,
            refresh_token: cookieSession.refreshToken
          });

          if (!isMounted) {
            return;
          }

          if (!error && updatedSession) {
            syncSupabaseSessionCookies(updatedSession);
            return;
          }
        }
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
