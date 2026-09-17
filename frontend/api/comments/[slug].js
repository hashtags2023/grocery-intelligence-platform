// api/comments/[slug].js — deployed via the frontend Vercel project.
// Public blog comments, same Supabase pattern as community-prices.js,
// but uses only the anon key — no login required.

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY,
);

const VALID_SLUGS = new Set(
  Array.from({ length: 12 }, (_, i) => `post_${i + 1}`),
);

export default async function handler(req, res) {
  res.setHeader("https://www.smartgrocerysavings.com");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  const { slug } = req.query;
  if (!VALID_SLUGS.has(slug)) {
    return res.status(404).json({ error: "Unknown post" });
  }

  if (req.method === "GET") {
    const { data, error } = await supabase
      .from("comments")
      .select("id, author_name, body, created_at")
      .eq("post_slug", slug)
      .eq("status", "approved")
      .order("created_at", { ascending: true });

    if (error) {
      console.error("comments GET error:", error);
      return res.status(500).json({ error: "Could not load comments" });
    }

    return res.status(200).json({ comments: data, count: data.length });
  }

  if (req.method === "POST") {
    const { author_name, body, website } = req.body || {};

    if (website) return res.status(201).json({ ok: true });

    if (!author_name || !author_name.trim() || author_name.length > 80) {
      return res.status(400).json({ error: "Name must be 1-80 characters" });
    }
    if (!body || !body.trim() || body.length > 2000) {
      return res
        .status(400)
        .json({ error: "Comment must be 1-2000 characters" });
    }

    const today = new Date().toISOString().slice(0, 10);
    const { count } = await supabase
      .from("comments")
      .select("id", { count: "exact", head: true })
      .eq("post_slug", slug)
      .gte("created_at", `${today}T00:00:00Z`);

    if (count >= 30) {
      return res.status(429).json({
        error: "Too many comments on this post today. Try again tomorrow.",
      });
    }

    const { data, error } = await supabase
      .from("comments")
      .insert([
        {
          post_slug: slug,
          author_name: author_name.trim(),
          body: body.trim(),
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("comments POST error:", error);
      return res.status(500).json({ error: "Could not post comment" });
    }

    return res.status(201).json({ comment: data });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
