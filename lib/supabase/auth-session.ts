import type { Session } from "@supabase/supabase-js";

export const SUPABASE_ACCESS_TOKEN_COOKIE = "metrologia-access-token";
export const SUPABASE_REFRESH_TOKEN_COOKIE = "metrologia-refresh-token";
export const SUPABASE_REFRESH_TOKEN_MAX_AGE = 60 * 60 * 24 * 30;

function buildCookieAttributes(maxAge: number) {
  const secureAttribute =
    typeof window !== "undefined" && window.location.protocol === "https:"
      ? "; Secure"
      : "";

  return `Path=/; SameSite=Lax; Max-Age=${maxAge}${secureAttribute}`;
}

function setCookie(name: string, value: string, maxAge: number) {
  document.cookie = `${name}=${encodeURIComponent(value)}; ${buildCookieAttributes(maxAge)}`;
}

function readCookieValue(name: string) {
  const cookiePrefix = `${name}=`;

  for (const cookiePart of document.cookie.split(";")) {
    const normalizedPart = cookiePart.trim();

    if (!normalizedPart.startsWith(cookiePrefix)) {
      continue;
    }

    return decodeURIComponent(normalizedPart.slice(cookiePrefix.length));
  }

  return null;
}

export function clearSupabaseSessionCookies() {
  document.cookie = `${SUPABASE_ACCESS_TOKEN_COOKIE}=; ${buildCookieAttributes(0)}`;
  document.cookie = `${SUPABASE_REFRESH_TOKEN_COOKIE}=; ${buildCookieAttributes(0)}`;
}

export function readSupabaseSessionCookies() {
  return {
    accessToken: readCookieValue(SUPABASE_ACCESS_TOKEN_COOKIE),
    refreshToken: readCookieValue(SUPABASE_REFRESH_TOKEN_COOKIE)
  };
}

export function syncSupabaseSessionCookies(session: Session | null) {
  if (!session) {
    clearSupabaseSessionCookies();
    return;
  }

  const nowInSeconds = Math.floor(Date.now() / 1000);
  const accessTokenMaxAge = Math.max((session.expires_at ?? nowInSeconds + 3600) - nowInSeconds, 1);

  setCookie(SUPABASE_ACCESS_TOKEN_COOKIE, session.access_token, accessTokenMaxAge);

  if (session.refresh_token) {
    setCookie(
      SUPABASE_REFRESH_TOKEN_COOKIE,
      session.refresh_token,
      SUPABASE_REFRESH_TOKEN_MAX_AGE
    );
    return;
  }

  document.cookie = `${SUPABASE_REFRESH_TOKEN_COOKIE}=; ${buildCookieAttributes(0)}`;
}
