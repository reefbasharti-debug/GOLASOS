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
  "id, name, image_url, price_ils, product_type, sizes, category_id, supplier_model, description, extra_images, is_featured, sort_order, shoe_tier, color, home_rank";

export async function loadSettings(): Promise<Record<string, string>> {
  const sb = publicClient();
  const { data } = await sb.from("site_settings").select("key, value");
  const out: Record<string, string> = {};
  for (const row of data ?? []) out[row.key] = row.value ?? "";
  return out;
}

export async function loadStoreData() {
  const sb = publicClient();
  const [categories, groups, featured, settings] = await Promise.all([
    sb
      .from("categories")
      .select("id, slug, name, kind, image_url, logo_url, description, group_name, group_order")
      .eq("is_active", true)
      .order("sort_order"),
    sb.from("category_groups").select("name, image_url").order("sort_order"),
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
    groups: groups.data ?? [],
    featured: featured.data ?? [],
    settings,
  };
}

export async function loadCategoryPage(slug: string) {
  const sb = publicClient();
  const { data: category } = await sb
    .from("categories")
    .select("id, slug, name, kind, description, image_url, logo_url, group_name, group_order")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (!category) return { category: null, products: [] };

  const [{ data: products }, { data: siblings }] = await Promise.all([
    sb
      .from("products")
      .select(`${PRODUCT_FIELDS}, created_at` as const)
      .eq("category_id", category.id)
      .eq("is_active", true)
      .order("sort_order"),
    sb
      .from("categories")
      .select("slug, name")
      .eq("is_active", true)
      .eq("group_name", category.group_name)
      .order("sort_order"),
  ]);

  return { category, products: products ?? [], siblings: siblings ?? [] };
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
      ? sb.from("categories").select("id, slug, name, group_name, kind, logo_url").eq("id", product.category_id).maybeSingle()
      : Promise.resolve({ data: null }),
    sb
      .from("products")
      .select(PRODUCT_FIELDS)
      .eq("is_active", true)
      .eq("category_id", product.category_id ?? "")
      .neq("id", product.id)
      .limit(28),
  ]);

  const { data: alsoLike } = await sb
    .from("products")
    .select(PRODUCT_FIELDS)
    .eq("is_active", true)
    .eq("product_type", product.product_type)
    .neq("id", product.id)
    .order("created_at", { ascending: false })
    .limit(10);

  return { product, category: category ?? null, related: related ?? [], alsoLike: alsoLike ?? [] };
}

function stripJoin<T extends { categories?: unknown }>(rows: T[] | null): Omit<T, "categories">[] {
  return (rows ?? []).map(({ categories: _c, ...rest }) => rest);
}

export async function loadHomeData() {
  const sb = publicClient();
  const byKind = (kind: string, limit: number) =>
    sb
      .from("products")
      .select(`${PRODUCT_FIELDS}, categories!inner(kind)` as const)
      .eq("is_active", true)
      .eq("categories.kind", kind)
      .order("home_rank", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(limit);

  const [newest, national, club, retro, shoes] = await Promise.all([
    // newest season jerseys (2026/27) first
    sb
      .from("products")
      .select(PRODUCT_FIELDS)
      .eq("is_active", true)
      .neq("product_type", "shoes")
      .or("name.ilike.%2026%,name.ilike.%2027%,name.ilike.%26/27%,name.ilike.%26-27%")
      .order("home_rank", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(15),
    byKind("national", 15),
    byKind("club", 15),
    byKind("retro", 15),
    sb
      .from("products")
      .select(PRODUCT_FIELDS)
      .eq("is_active", true)
      .eq("product_type", "shoes")
      .order("home_rank", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(15),
  ]);

  return {
    newest: newest.data ?? [],
    national: stripJoin(national.data),
    club: stripJoin(club.data),
    retro: stripJoin(retro.data),
    shoes: shoes.data ?? [],
  };
}

export type ShoeFilters = { model?: string | undefined; color?: string | undefined; size?: string | undefined; tier?: string | undefined };

export async function loadShoes(f: ShoeFilters) {
  const sb = publicClient();
  let q = sb
    .from("products")
    .select(`${PRODUCT_FIELDS}, created_at` as const)
    .eq("is_active", true)
    .eq("product_type", "shoes");
  if (f.model) q = q.eq("category_id", f.model);
  if (f.color) q = q.eq("color", f.color);
  if (f.tier) q = q.eq("shoe_tier", f.tier);
  if (f.size) q = q.contains("sizes", [f.size]);
  const [{ data }, facets] = await Promise.all([
    q.order("home_rank", { ascending: false }).order("created_at", { ascending: false }).limit(300),
    sb.from("products").select("color, sizes, shoe_tier, category_id").eq("is_active", true).eq("product_type", "shoes"),
  ]);
  const colors = new Map<string, number>();
  const sizes = new Set<string>();
  const models = new Map<string, number>();
  for (const r of facets.data ?? []) {
    if (r.color) colors.set(r.color, (colors.get(r.color) ?? 0) + 1);
    for (const sz of r.sizes ?? []) sizes.add(sz);
    if (r.category_id) models.set(r.category_id, (models.get(r.category_id) ?? 0) + 1);
  }
  return {
    products: data ?? [],
    colors: [...colors.entries()].sort((a, b) => b[1] - a[1]).map(([c]) => c),
    sizes: [...sizes].sort((a, b) => Number(a) - Number(b)),
    modelCounts: Object.fromEntries(models),
  };
}

export async function searchProducts(q: string) {
  const sb = publicClient();
  const term = q.replace(/[%_,]/g, " ").trim();
  if (!term) return { products: [], categories: [] };
  const [products, categories] = await Promise.all([
    sb
      .from("products")
      .select(PRODUCT_FIELDS)
      .eq("is_active", true)
      .or(`name.ilike.%${term}%,supplier_model.ilike.%${term}%`)
      .order("sort_order")
      .limit(60),
    sb.from("categories").select("slug, name, logo_url, image_url").eq("is_active", true).ilike("name", `%${term}%`).limit(12),
  ]);
  return { products: products.data ?? [], categories: categories.data ?? [] };
}

export async function trackOrder(orderNumber: number, phone: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const digits = phone.replace(/\D/g, "");
  const { data: order } = await supabaseAdmin
    .from("orders")
    .select("id, order_number, status, total_ils, created_at, phone, customer_name")
    .eq("order_number", orderNumber)
    .maybeSingle();
  if (!order || order.phone.replace(/\D/g, "").slice(-7) !== digits.slice(-7)) return { order: null, items: [] };
  const { data: items } = await supabaseAdmin
    .from("order_items")
    .select("product_name, size, quantity, unit_price_ils")
    .eq("order_id", order.id);
  return {
    order: {
      orderNumber: order.order_number,
      status: order.status,
      total: Number(order.total_ils),
      createdAt: order.created_at,
      customerName: order.customer_name,
    },
    items: items ?? [],
  };
}

type OrderInput = {
  customerName: string;
  phone: string;
  email?: string | undefined;
  city?: string | undefined;
  address?: string | undefined;
  notes?: string | undefined;
  shipping?: "free" | "express" | undefined;
  items: { productId: string; size?: string | undefined; quantity: number }[];
};

export const EXPRESS_SHIPPING_ILS = 50;


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

/** Products backing the Mystery Box page (the box itself + the optional patch add-on). */
export async function loadMysteryBox() {
  const sb = publicClient();
  const { data } = await sb
    .from("products")
    .select("id, name, description, price_ils, sizes, image_url, extra_images, source_id")
    .in("source_id", ["mystery-box", "mystery-box-patch"])
    .eq("is_active", true);

  const rows = data ?? [];
  return {
    box: rows.find((r) => r.source_id === "mystery-box") ?? null,
    patch: rows.find((r) => r.source_id === "mystery-box-patch") ?? null,
  };
}
