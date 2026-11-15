/**
 * Embed a question with gte-small and return the closest knowledge passages.
 *
 * Body: {
 *   "query": "...",
 *   "match_threshold": 0.5,   // optional
 *   "match_count": 4          // optional
 * }
 *
 * Call with the project's service_role key. The app never calls this; only the
 * FastAPI server does.
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

  let body: {
    query?: string;
    match_threshold?: number;
    match_count?: number;
  };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Body must be JSON." }, 400);
  }

  const query = typeof body.query === "string" ? body.query.trim() : "";
  if (!query) {
    return json({ error: "query is required." }, 400);
  }

  const matchThreshold =
    typeof body.match_threshold === "number" ? body.match_threshold : 0.5;
  const matchCount =
    typeof body.match_count === "number" ? Math.min(Math.max(body.match_count, 1), 10) : 4;

  const embedding = (await model.run(query, {
    mean_pool: true,
    normalize: true,
  })) as number[];

  const { data, error } = await supabase.rpc("match_kb_sections", {
    query_embedding: JSON.stringify(embedding),
    match_threshold: matchThreshold,
    match_count: matchCount,
  });

  if (error) {
    return json({ error: error.message }, 500);
  }

  return json({ passages: data ?? [] }, 200);
});

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
