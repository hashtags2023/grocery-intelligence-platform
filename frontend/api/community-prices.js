// api/community-prices.js
// Crowdsourced price submissions for stores without official APIs
// (Safeway, Trader Joe's, Costco, Sprouts, etc.)
//
// SETUP: No extra credentials needed — uses your existing Supabase connection.
// Run this SQL in your Supabase SQL editor first (see bottom of file).
//
// Endpoints:
//   GET  /api/community-prices?item=apples&store=safeway&zip=95814
//        → returns recent community-submitted prices for that item/store/zip
//   POST /api/community-prices
//        body: { item_name, store_name, price, unit, zip_code, user_id? }
//        → saves a new price submission

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY, // service role for server-side writes
);

// Stores covered by crowdsourcing (no official API available)
const SUPPORTED_STORES = [
  "safeway",
  "albertsons",
  "trader joes",
  "trader joe's",
  "costco",
  "sprouts",
  "whole foods",
  "target",
  "aldi",
  "winco",
  "smart & final",
  "food maxx",
  "grocery outlet",
];

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.status(200).end();

  // ── GET: fetch recent community prices ──────────────────────────────────
  if (req.method === "GET") {
    const { item, store, zip, days = 14, limit = 20 } = req.query;

    if (!item)
      return res.status(400).json({ error: "item parameter is required" });

    let query = supabase
      .from("community_prices")
      .select(
        "id, item_name, store_name, price, unit, zip_code, verified_count, submitted_at",
      )
      .ilike("item_name", `%${item}%`)
      .gte("submitted_at", new Date(Date.now() - days * 86400000).toISOString())
      .order("submitted_at", { ascending: false })
      .limit(parseInt(limit));

    if (store) query = query.ilike("store_name", `%${store}%`);
    if (zip) query = query.eq("zip_code", zip);

    const { data, error } = await query;

    if (error) {
      console.error("community-prices GET error:", error);
      return res
        .status(500)
        .json({ error: "Database error", message: error.message });
    }

    // Group by store for easy frontend rendering
    const byStore = {};
    (data || []).forEach((row) => {
      const key = row.store_name.toLowerCase();
      if (!byStore[key]) byStore[key] = [];
      byStore[key].push(row);
    });

    return res.status(200).json({
      source: "community",
      item,
      store: store || "all",
      zip: zip || "all",
      results: data || [],
      byStore,
    });
  }

  // ── POST: submit a community price ──────────────────────────────────────
  if (req.method === "POST") {
    const { item_name, store_name, price, unit, zip_code, user_id } =
      req.body || {};

    // Validation
    const missing = ["item_name", "store_name", "price", "zip_code"].filter(
      (k) => !req.body?.[k],
    );
    if (missing.length) {
      return res
        .status(400)
        .json({ error: `Missing required fields: ${missing.join(", ")}` });
    }
    if (typeof price !== "number" || price <= 0 || price > 999) {
      return res
        .status(400)
        .json({ error: "price must be a positive number under $999" });
    }
    if (!/^\d{5}$/.test(zip_code)) {
      return res
        .status(400)
        .json({ error: "zip_code must be a 5-digit US zip code" });
    }
    if (item_name.length > 120 || store_name.length > 80) {
      return res
        .status(400)
        .json({ error: "item_name or store_name too long" });
    }

    // Rate limiting: max 10 submissions per zip per day (basic abuse prevention)
    const today = new Date().toISOString().slice(0, 10);
    const { count } = await supabase
      .from("community_prices")
      .select("id", { count: "exact", head: true })
      .eq("zip_code", zip_code)
      .gte("submitted_at", `${today}T00:00:00Z`);

    if (count >= 10) {
      return res
        .status(429)
        .json({
          error:
            "Too many submissions from this zip today. Try again tomorrow.",
        });
    }

    const { data, error } = await supabase
      .from("community_prices")
      .insert([
        {
          item_name: item_name.trim(),
          store_name: store_name.trim().toLowerCase(),
          price: parseFloat(price.toFixed(2)),
          unit: (unit || "").trim() || "each",
          zip_code,
          user_id: user_id || null,
          verified_count: 0,
          submitted_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("community-prices POST error:", error);
      return res
        .status(500)
        .json({ error: "Failed to save price", message: error.message });
    }

    return res.status(201).json({
      message: "Price submitted — thank you!",
      submission: data,
    });
  }

  return res.status(405).json({ error: "Method not allowed" });
}

/*
──────────────────────────────────────────────────────────────────────────────
SQL TO RUN IN SUPABASE SQL EDITOR (one time setup):
──────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.community_prices (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  item_name       text NOT NULL,
  store_name      text NOT NULL,
  price           numeric(8,2) NOT NULL CHECK (price > 0 AND price < 1000),
  unit            text NOT NULL DEFAULT 'each',
  zip_code        char(5) NOT NULL,
  user_id         uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  verified_count  integer NOT NULL DEFAULT 0,
  submitted_at    timestamptz NOT NULL DEFAULT now()
);

-- Index for fast lookup by item + store + zip
CREATE INDEX IF NOT EXISTS idx_community_prices_lookup
  ON public.community_prices (item_name, store_name, zip_code, submitted_at DESC);

-- RLS: anyone can read, only authenticated users can insert
ALTER TABLE public.community_prices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read"
  ON public.community_prices FOR SELECT USING (true);

CREATE POLICY "authenticated insert"
  ON public.community_prices FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Grants
GRANT SELECT ON public.community_prices TO anon, authenticated;
GRANT INSERT ON public.community_prices TO authenticated;

──────────────────────────────────────────────────────────────────────────────
*/
