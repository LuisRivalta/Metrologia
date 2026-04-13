"use client";

import { supabaseBrowser } from "@/lib/supabase/browser";

export async function fetchApi(input: string | URL, init: RequestInit = {}) {
  const headers = new Headers(init.headers);

  if (!headers.has("authorization")) {
    const {
      data: { session }
    } = await supabaseBrowser.auth.getSession();

    if (session?.access_token) {
      headers.set("authorization", `Bearer ${session.access_token}`);
    }
  }

  return fetch(input, {
    ...init,
    headers,
    credentials: "same-origin"
  });
}
