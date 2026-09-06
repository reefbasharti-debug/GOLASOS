-- ===== products: audience / sport / item_type =====
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS audience text NOT NULL DEFAULT 'men',
  ADD COLUMN IF NOT EXISTS sport text NOT NULL DEFAULT 'football',
  ADD COLUMN IF NOT EXISTS item_type text NOT NULL DEFAULT 'jersey';

UPDATE public.products SET audience = 'kids'  WHERE name ~* 'ילד|kid|youth|junior|בייבי|baby';
UPDATE public.products SET audience = 'women' WHERE name ~* 'נשים|women|woman|female|lady';
UPDATE public.products SET sport = 'basketball'
  WHERE name ~* 'NBA|לייקרס|Lakers|Bulls|בולס|Warriors|ווריורס|Celtics|סלטיקס|Jordan|ג''ורדן|כדורסל|basketball';

UPDATE public.products SET item_type = CASE
  WHEN product_type = 'shoes' THEN 'shoes'
  WHEN product_type IN ('mystery','mystery_addon') THEN 'mystery'
  WHEN name ~* 'סווטשירט|הודי|hoodie|sweatshirt' OR price_ils = 120 THEN 'sweatshirt'
  WHEN name ~* 'ג''קט|jacket|אימונית|tracksuit|מעיל' THEN 'jacket'
  WHEN name ~* 'שרוול ארוך|long sleeve' OR price_ils = 115 THEN 'long_sleeve'
  WHEN price_ils = 90 THEN 'kit'
  WHEN name ~* '(^|\s)מכנס|(^|\s)shorts?(\s|$)' THEN 'shorts'
  ELSE 'jersey' END;

CREATE INDEX IF NOT EXISTS products_audience_idx  ON public.products (audience)  WHERE is_active;
CREATE INDEX IF NOT EXISTS products_sport_idx     ON public.products (sport)     WHERE is_active;
CREATE INDEX IF NOT EXISTS products_item_type_idx ON public.products (item_type) WHERE is_active;

-- ===== orders / order_items =====
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS user_id uuid,
  ADD COLUMN IF NOT EXISTS tracking_number text,
  ADD COLUMN IF NOT EXISTS shipped_at timestamptz,
  ADD COLUMN IF NOT EXISTS referral_code text,
  ADD COLUMN IF NOT EXISTS credit_used_ils numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS shipping_method text NOT NULL DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS sheet_synced_at timestamptz;
CREATE INDEX IF NOT EXISTS orders_user_id_idx ON public.orders (user_id);
CREATE INDEX IF NOT EXISTS orders_email_idx ON public.orders (lower(email));

ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS version text,
  ADD COLUMN IF NOT EXISTS custom_text text;

CREATE POLICY "customers read own orders" ON public.orders
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "customers read own order items" ON public.order_items
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_items.order_id AND o.user_id = auth.uid()));

-- ===== profiles =====
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY,
  email text,
  full_name text,
  phone text,
  referral_code text NOT NULL UNIQUE,
  referred_by uuid,
  credit_ils numeric NOT NULL DEFAULT 0,
  payment_pref text NOT NULL DEFAULT 'card',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.profiles TO authenticated;
GRANT UPDATE (email, full_name, phone, payment_pref) ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users read own profile" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "users insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "admins read profiles" ON public.profiles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===== referrals =====
CREATE TABLE public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  buyer_label text,
  amount_ils numeric NOT NULL DEFAULT 15,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.referrals TO authenticated;
GRANT ALL ON public.referrals TO service_role;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "referrers read own referrals" ON public.referrals FOR SELECT TO authenticated USING (referrer_id = auth.uid());
CREATE POLICY "admins read referrals" ON public.referrals FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE INDEX referrals_referrer_idx ON public.referrals (referrer_id);

-- ===== support tickets (chatbot handoffs) =====
CREATE TABLE public.support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL,
  order_number bigint,
  email text,
  description text,
  image_url text,
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE, DELETE ON public.support_tickets TO authenticated;
GRANT ALL ON public.support_tickets TO service_role;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage tickets" ON public.support_tickets FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER support_tickets_updated_at BEFORE UPDATE ON public.support_tickets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===== testimonials =====
CREATE TABLE public.testimonials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name text NOT NULL,
  message text NOT NULL,
  reply text,
  image_url text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.testimonials TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.testimonials TO authenticated;
GRANT ALL ON public.testimonials TO service_role;
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read testimonials" ON public.testimonials FOR SELECT TO anon, authenticated USING (is_active);
CREATE POLICY "admins manage testimonials" ON public.testimonials FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

INSERT INTO public.testimonials (customer_name, message, reply, sort_order) VALUES
 ('רועי מ.', 'החולצה של ארגנטינה הגיעה מהר ובאיכות מטורפת, ההדפסה של מסי מושלמת 🔥', 'איזה כיף לשמוע! תודה רועי ⚽', 1),
 ('נועה ל.', 'הזמנתי מיסטרי בוקס לאח שלי והוא קיבל ריאל מדריד – הוא בעננים 😍', 'מקסים! שיהנה ממנה 💛', 2),
 ('דניאל ב.', 'נעליים מדהימות, בדיוק כמו בתמונות. השירות ענה לי תוך דקות.', 'תודה דניאל, תמיד כאן בשבילך 🙌', 3),
 ('עומר ש.', 'הזמנתי סט ברצלונה לילד, מידה מדויקת והמשלוח הגיע לפני הזמן.', 'שמחים שהיה חלק! 👕', 4);

-- ===== settings =====
INSERT INTO public.site_settings (key, value) VALUES
  ('support_email', 'vamanage2@gmail.com'),
  ('affiliate_bonus_ils', '15'),
  ('charity_pct', '10'),
  ('sheet_id', '')
ON CONFLICT (key) DO NOTHING;