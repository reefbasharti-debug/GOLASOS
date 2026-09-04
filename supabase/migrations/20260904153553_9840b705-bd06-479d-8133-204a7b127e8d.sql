CREATE TABLE public.customers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name text NOT NULL,
  phone text NOT NULL,
  email text,
  city text,
  address text,
  postal_code text,
  notes text,
  source text NOT NULL DEFAULT 'checkout',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX customers_phone_key ON public.customers (phone);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customers TO authenticated;
GRANT ALL ON public.customers TO service_role;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage customers" ON public.customers FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.orders
  ADD COLUMN customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  ADD COLUMN payment_status text NOT NULL DEFAULT 'unpaid',
  ADD COLUMN paid_at timestamptz;
ALTER TABLE public.orders ADD CONSTRAINT orders_payment_status_check
  CHECK (payment_status IN ('unpaid','paid','refunded'));
CREATE INDEX orders_customer_id_idx ON public.orders (customer_id);

CREATE OR REPLACE FUNCTION public.link_order_customer()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE cid uuid; p text;
BEGIN
  p := regexp_replace(coalesce(NEW.phone,''), '[^0-9+]', '', 'g');
  IF p = '' THEN RETURN NEW; END IF;
  SELECT id INTO cid FROM public.customers WHERE phone = p;
  IF cid IS NULL THEN
    INSERT INTO public.customers (full_name, phone, email, city, address, source)
    VALUES (NEW.customer_name, p, NEW.email, NEW.city, NEW.address, 'checkout')
    RETURNING id INTO cid;
  ELSE
    UPDATE public.customers SET
      email = coalesce(NEW.email, email),
      city = coalesce(NEW.city, city),
      address = coalesce(NEW.address, address)
    WHERE id = cid;
  END IF;
  NEW.customer_id := cid;
  IF NEW.payment_status = 'paid' AND NEW.paid_at IS NULL THEN NEW.paid_at := now(); END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER orders_link_customer BEFORE INSERT ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.link_order_customer();

-- backfill existing orders
INSERT INTO public.customers (full_name, phone, email, city, address, source)
SELECT DISTINCT ON (regexp_replace(phone,'[^0-9+]','','g')) customer_name, regexp_replace(phone,'[^0-9+]','','g'), email, city, address, 'checkout'
FROM public.orders WHERE regexp_replace(phone,'[^0-9+]','','g') <> ''
ORDER BY regexp_replace(phone,'[^0-9+]','','g'), created_at DESC
ON CONFLICT (phone) DO NOTHING;
UPDATE public.orders o SET customer_id = c.id FROM public.customers c
WHERE o.customer_id IS NULL AND c.phone = regexp_replace(o.phone,'[^0-9+]','','g');
UPDATE public.orders SET payment_status = 'paid', paid_at = coalesce(paid_at, updated_at)
WHERE status IN ('paid','shipped','done') AND payment_status = 'unpaid';