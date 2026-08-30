import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { sendEmailOrder, sendTelegramOrder, type OrderNotification } from "./notify.server";

function publicClient() {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient<Database>(process.env["SUPABASE_URL"]!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) {
          headers.delete("Authorization");
        }
        headers.set("apikey", key);
        return fetch(input, { ...init, headers });
      },
    },
  });
}

const PRODUCT_FIELDS =
  "id, name, image_url, price_ils, product_type, sizes, category_id, supplier_model, description, extra_images, is_featured, sort_order";

export async function loadSettings(): Promise<Record<string, string>> {
  const sb = publicClient();
  const { data } = await sb.from("site_settings").select("key, value");
  const out: Record<string, string> = {};
  for (const row of data ?? []) out[row.key] = row.value ?? "";
  return out;
}

export async function loadStoreData() {
  const sb = publicClient();
  const [categories, featured, settings] = await Promise.all([
    sb
      .from("categories")
      .select("id, slug, name, kind, image_url, description")
      .eq("is_active", true)
      .order("sort_order"),
    sb
      .from("products")
      .select(PRODUCT_FIELDS)
      .eq("is_active", true)
      .order("is_featured", { ascending: false })
      .order("sort_order")
      .limit(12),
    loadSettings(),
  ]);

  return {
    categories: categories.data ?? [],
    featured: featured.data ?? [],
    settings,
  };
}

export async function loadCategoryPage(slug: string) {
  const sb = publicClient();
  const { data: category } = await sb
    .from("categories")
    .select("id, slug, name, kind, description, image_url")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (!category) return { category: null, products: [] };

  const { data: products } = await sb
    .from("products")
    .select(PRODUCT_FIELDS)
    .eq("category_id", category.id)
    .eq("is_active", true)
    .order("sort_order");

  return { category, products: products ?? [] };
}

export async function loadProduct(id: string) {
  const sb = publicClient();
  const { data: product } = await sb
    .from("products")
    .select(PRODUCT_FIELDS)
    .eq("id", id)
    .eq("is_active", true)
    .maybeSingle();

  if (!product) return { product: null, category: null, related: [] };

  const [{ data: category }, { data: related }] = await Promise.all([
    product.category_id
      ? sb.from("categories").select("id, slug, name").eq("id", product.category_id).maybeSingle()
      : Promise.resolve({ data: null }),
    sb
      .from("products")
      .select(PRODUCT_FIELDS)
      .eq("is_active", true)
      .eq("category_id", product.category_id ?? "")
      .neq("id", product.id)
      .limit(8),
  ]);

  return { product, category: category ?? null, related: related ?? [] };
}

type OrderInput = {
  customerName: string;
  phone: string;
  email?: string;
  city?: string;
  address?: string;
  notes?: string;
  items: { productId: string; size?: string; quantity: number }[];
};

export async function createOrder(input: OrderInput) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const ids = [...new Set(input.items.map((i) => i.productId))];
  const { data: products, error: productError } = await supabaseAdmin
    .from("products")
    .select("id, name, price_ils")
    .in("id", ids)
    .eq("is_active", true);

  if (productError) throw new Error(productError.message);
  if (!products?.length) throw new Error("המוצרים בעגלה אינם זמינים");

  const byId = new Map(products.map((p) => [p.id, p]));
  const items = input.items
    .filter((i) => byId.has(i.productId))
    .map((i) => {
      const p = byId.get(i.productId)!;
      return {
        product_id: p.id,
        product_name: p.name,
        size: i.size || null,
        quantity: i.quantity,
        unit_price_ils: Number(p.price_ils),
      };
    });

  if (!items.length) throw new Error("המוצרים בעגלה אינם זמינים");

  const total = items.reduce((sum, i) => sum + i.unit_price_ils * i.quantity, 0);

  const { data: order, error: orderError } = await supabaseAdmin
    .from("orders")
    .insert({
      customer_name: input.customerName,
      phone: input.phone,
      email: input.email || null,
      city: input.city || null,
      address: input.address || null,
      notes: input.notes || null,
      total_ils: total,
    })
    .select("id, order_number")
    .single();

  if (orderError || !order) throw new Error(orderError?.message ?? "יצירת ההזמנה נכשלה");

  const { error: itemsError } = await supabaseAdmin
    .from("order_items")
    .insert(items.map((i) => ({ ...i, order_id: order.id })));
  if (itemsError) throw new Error(itemsError.message);

  const settings = await loadSettings();
  const notification: OrderNotification = {
    orderNumber: order.order_number,
    customerName: input.customerName,
    phone: input.phone,
    email: input.email,
    city: input.city,
    address: input.address,
    notes: input.notes,
    total,
    items: items.map((i) => ({
      name: i.product_name,
      size: i.size,
      quantity: i.quantity,
      price: i.unit_price_ils,
    })),
  };

  await Promise.allSettled([
    sendTelegramOrder(settings["telegram_chat_id"] ?? "", notification),
    sendEmailOrder(settings["notify_email"] ?? "", notification),
  ]);

  return { orderNumber: order.order_number, total };
}
