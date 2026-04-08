import { type Session } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import {
  SUPABASE_ACCESS_TOKEN_COOKIE,
  SUPABASE_REFRESH_TOKEN_COOKIE,
  SUPABASE_REFRESH_TOKEN_MAX_AGE
} from "@/lib/supabase/auth-session";
import { extractBearerToken, validateSupabaseSession } from "@/lib/supabase/server-auth";

const protectedPagePrefixes = [
  "/dashboard",
  "/instrumentos",
  "/categorias",
  "/configuracoes",
  "/inventario"
];
const protectedApiPrefixes = [
  "/api/calibracoes",
  "/api/categorias",
  "/api/centro-custo",
  "/api/instrumentos",
  "/api/medidas"
];

function matchesProtectedPrefix(pathname: string, prefixes: string[]) {
  return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function applySessionCookies(response: NextResponse, session: Session | null) {
  if (!session) {
    response.cookies.delete(SUPABASE_ACCESS_TOKEN_COOKIE);
    response.cookies.delete(SUPABASE_REFRESH_TOKEN_COOKIE);
    return;
  }

  const nowInSeconds = Math.floor(Date.now() / 1000);
  const accessTokenMaxAge = Math.max((session.expires_at ?? nowInSeconds + 3600) - nowInSeconds, 1);
  const secure = process.env.NODE_ENV === "production";

  response.cookies.set({
    name: SUPABASE_ACCESS_TOKEN_COOKIE,
    value: session.access_token,
    httpOnly: false,
    maxAge: accessTokenMaxAge,
    path: "/",
    sameSite: "lax",
    secure
  });

  if (session.refresh_token) {
    response.cookies.set({
      name: SUPABASE_REFRESH_TOKEN_COOKIE,
      value: session.refresh_token,
      httpOnly: false,
      maxAge: SUPABASE_REFRESH_TOKEN_MAX_AGE,
      path: "/",
      sameSite: "lax",
      secure
    });
    return;
  }

  response.cookies.delete(SUPABASE_REFRESH_TOKEN_COOKIE);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isLoginPage = pathname === "/login";
  const isProtectedPage = matchesProtectedPrefix(pathname, protectedPagePrefixes);
  const isProtectedApi = matchesProtectedPrefix(pathname, protectedApiPrefixes);

  if (!isLoginPage && !isProtectedPage && !isProtectedApi) {
    return NextResponse.next();
  }

  const bearerToken = extractBearerToken(request.headers.get("authorization"));
  const accessToken = bearerToken ?? request.cookies.get(SUPABASE_ACCESS_TOKEN_COOKIE)?.value ?? null;
  const refreshToken = bearerToken
    ? null
    : request.cookies.get(SUPABASE_REFRESH_TOKEN_COOKIE)?.value ?? null;
  const authResult = await validateSupabaseSession({
    accessToken,
    refreshToken
  });
  const isAuthenticated = Boolean(authResult.user);

  let response: NextResponse;

  if (isLoginPage && isAuthenticated) {
    response = NextResponse.redirect(new URL("/dashboard", request.url));
  } else if (!isLoginPage && !isAuthenticated) {
    response = isProtectedApi
      ? NextResponse.json({ error: "Nao autenticado." }, { status: 401 })
      : NextResponse.redirect(new URL("/login", request.url));
  } else {
    response = NextResponse.next();
  }

  if (authResult.session) {
    applySessionCookies(response, authResult.session);
  } else if (!bearerToken && !isAuthenticated && (accessToken || refreshToken)) {
    applySessionCookies(response, null);
  }

  return response;
}

export const config = {
  matcher: [
    "/login",
    "/dashboard/:path*",
    "/instrumentos/:path*",
    "/categorias/:path*",
    "/configuracoes/:path*",
    "/inventario/:path*",
    "/api/calibracoes/:path*",
    "/api/categorias/:path*",
    "/api/centro-custo/:path*",
    "/api/instrumentos/:path*",
    "/api/medidas/:path*"
  ]
};
