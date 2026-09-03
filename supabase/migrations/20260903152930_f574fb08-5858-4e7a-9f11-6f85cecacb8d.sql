ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS group_name text NOT NULL DEFAULT '';
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS group_order integer NOT NULL DEFAULT 0;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS source_id text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS source_id text;
CREATE INDEX IF NOT EXISTS products_category_active_idx ON public.products (category_id, is_active, sort_order);
CREATE INDEX IF NOT EXISTS products_source_idx ON public.products (source_id);