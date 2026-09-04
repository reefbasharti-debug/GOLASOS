ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS home_rank integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS shoe_tier text,
  ADD COLUMN IF NOT EXISTS color text;
CREATE INDEX IF NOT EXISTS products_home_rank_idx ON public.products (home_rank DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS products_shoe_tier_idx ON public.products (shoe_tier) WHERE product_type = 'shoes';