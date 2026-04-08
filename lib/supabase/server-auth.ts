import { createClient, type Session, type User } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase auth env vars are missing on the server.");
}

const supabaseServerAuth = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

type ValidateSupabaseSessionArgs = {
  accessToken?: string | null;
  refreshToken?: string | null;
};

export type ValidatedSupabaseSession = {
  user: User | null;
  session: Session | null;
  refreshed: boolean;
};

function normalizeToken(value: string | null | undefined) {
  const normalizedValue = value?.trim() ?? "";
  return normalizedValue || null;
}

export function extractBearerToken(authorizationHeader: string | null) {
  if (!authorizationHeader) {
    return null;
  }

  const [scheme, token] = authorizationHeader.split(/\s+/, 2);

  if (scheme?.toLowerCase() !== "bearer") {
    return null;
  }

  return normalizeToken(token);
}

export async function validateSupabaseSession({
  accessToken,
  refreshToken
}: ValidateSupabaseSessionArgs): Promise<ValidatedSupabaseSession> {
  const normalizedAccessToken = normalizeToken(accessToken);
  const normalizedRefreshToken = normalizeToken(refreshToken);

  if (normalizedAccessToken) {
    const {
      data: { user },
      error
    } = await supabaseServerAuth.auth.getUser(normalizedAccessToken);

    if (!error && user) {
      return {
        user,
        session: null,
        refreshed: false
      };
    }
  }

  if (normalizedRefreshToken) {
    const {
      data: { session },
      error
    } = await supabaseServerAuth.auth.refreshSession({
      refresh_token: normalizedRefreshToken
    });

    if (!error && session?.user) {
      return {
        user: session.user,
        session,
        refreshed: true
      };
    }
  }

  return {
    user: null,
    session: null,
    refreshed: false
  };
}
