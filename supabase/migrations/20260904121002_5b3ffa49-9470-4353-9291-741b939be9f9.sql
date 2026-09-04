CREATE TABLE public.category_groups (
  name text PRIMARY KEY,
  image_url text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.category_groups TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.category_groups TO authenticated;
GRANT ALL ON public.category_groups TO service_role;
ALTER TABLE public.category_groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read category groups" ON public.category_groups FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "admins manage category groups" ON public.category_groups FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER category_groups_updated_at BEFORE UPDATE ON public.category_groups FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();