// Supabase Auth Admin REST helper. Service-role only.
// Used by user-create.mjs (and any future admin-user op).

import { required } from "./env.mjs";

export async function adminFetch(path, init = {}) {
  const baseUrl = await required("NEXT_PUBLIC_SUPABASE_URL");
  const serviceKey = await required("SUPABASE_SERVICE_ROLE_KEY");
  const res = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${serviceKey}`,
      apikey: serviceKey,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  const text = await res.text();
  return { ok: res.ok, status: res.status, body: text };
}
