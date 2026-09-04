INSERT INTO public.products (name, description, product_type, price_ils, sizes, is_active, is_featured, sort_order, source_id, home_rank)
VALUES
  ('מיסטרי בוקס', 'חולצת כדורגל מסתורית באיכות מעולה — אתם בוחרים את הסוג, הגודל והעדפות, ואנחנו בוחרים את החולצה. הפתעה מובטחת!', 'mystery', 159, ARRAY['S','M','L','XL','2XL','3XL','4XL'], true, true, -100, 'mystery-box', 1000),
  ('פאץ'' רשמי למיסטרי בוקס', 'תוספת פאץ'' רשמי לחולצת המיסטרי בוקס', 'mystery_addon', 10, ARRAY[]::text[], true, false, -99, 'mystery-box-patch', 0)
ON CONFLICT DO NOTHING;