/**
 * Embed knowledge-base sections with Supabase's built-in gte-small model.
 *
 * Body: { "ids": ["02-symptoms/what-are-the-first-symptoms-of-malaria", ...] }
 *
 * Call with the project's service_role key in the Authorization header.
 * Only rows whose embedding is still null are updated.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const model = new Supabase.ai.Session("gte-small");

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

Deno.serve(async (req) => {
  if (!supabaseUrl || !supabaseAnonKey) {
    return json({ error: "Missing SUPABASE_URL or SUPABASE_ANON_KEY." }, 500);
  }

  const authorization = req.headers.get("Authorization");
  if (!authorization) {
    return json({ error: "No Authorization header." }, 401);
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let body: { ids?: string[] };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Body must be JSON." }, 400);
  }

  const ids = Array.isArray(body.ids) ? body.ids.filter((id) => typeof id === "string") : [];
  if (!ids.length) {
    return json({ error: "ids must be a non-empty string array." }, 400);
  }

  const { data: rows, error: selectError } = await supabase
    .from("kb_sections")
    .select("id, content")
    .in("id", ids)
    .is("embedding", null);

  if (selectError) {
    return json({ error: selectError.message }, 500);
  }

  let updated = 0;
  for (const row of rows ?? []) {
    if (!row.content) continue;
    const output = (await model.run(row.content, {
      mean_pool: true,
      normalize: true,
    })) as number[];

    const { error } = await supabase
      .from("kb_sections")
      .update({ embedding: JSON.stringify(output) })
      .eq("id", row.id)
      .is("embedding", null);

    if (error) {
      console.error(`Failed to save embedding for ${row.id}: ${error.message}`);
      continue;
    }
    updated += 1;
  }

  return json({ updated }, 200);
});

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
