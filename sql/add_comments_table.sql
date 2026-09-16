-- ============================================================
-- Comments feature — run this in the Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS public.comments (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  post_slug     text NOT NULL,
  author_name   text NOT NULL CHECK (char_length(author_name) BETWEEN 1 AND 80),
  body          text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 2000),
  status        text NOT NULL DEFAULT 'approved',
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_comments_post_slug
  ON public.comments (post_slug, created_at ASC);

-- RLS: anyone can read approved comments, anyone can post a new one
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read approved"
  ON public.comments FOR SELECT
  USING (status = 'approved');

CREATE POLICY "public insert"
  ON public.comments FOR INSERT
  WITH CHECK (true);

GRANT SELECT, INSERT ON public.comments TO anon, authenticated;
