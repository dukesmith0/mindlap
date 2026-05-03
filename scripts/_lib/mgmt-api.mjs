// Supabase Management API helper. Single Mgmt-API SQL surface.
// Auth: SUPABASE_ACCESS_TOKEN (personal or service-role-equivalent PAT).
// Project: SUPABASE_PROJECT_REF (replaces every hardcoded ref).

import { required } from "./env.mjs";

let endpointCache = null;

async function endpoint() {
  if (endpointCache) return endpointCache;
  const ref = await required("SUPABASE_PROJECT_REF");
  endpointCache = `https://api.supabase.com/v1/projects/${ref}/database/query`;
  return endpointCache;
}

export async function runSql(sql) {
  const url = await endpoint();
  const token = await required("SUPABASE_ACCESS_TOKEN");
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: sql }),
  });
  const text = await res.text();
  if (!res.ok) {
    return { ok: false, status: res.status, body: text };
  }
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = text;
  }
  return { ok: true, status: res.status, rows: json };
}
