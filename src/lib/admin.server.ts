import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

/** The single email allowed to become the first admin of the store. */
const OWNER_EMAIL = "reefbasharti@gmail.com";

export async function claimAdminRole(userId: string, email: string) {
  if (email.toLowerCase() !== OWNER_EMAIL) return { granted: false };

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: existing } = await supabaseAdmin
    .from("user_roles")
    .select("id")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();

  if (existing) return { granted: true };

  const { error } = await supabaseAdmin.from("user_roles").insert({ user_id: userId, role: "admin" });
  if (error) throw new Error(error.message);
  return { granted: true };
}

/** Throws unless the signed-in user holds the admin role (checked via RLS-safe RPC). */
export async function assertAdmin(supabase: SupabaseClient<Database>, userId: string): Promise<void> {
  const { data, error } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (error || !data) throw new Error("Forbidden: admin role required");
}

export async function loadAdminOverview(supabase: SupabaseClient<Database>) {
  const [orders, items, products, categories, settings, customers, tickets, testimonials] = await Promise.all([
    supabase
      .from("orders")
      .select("id, order_number, customer_name, phone, email, city, address, notes, total_ils, status, payment_status, paid_at, customer_id, created_at, tracking_number, shipped_at, shipping_method, referral_code, credit_used_ils")
      .order("created_at", { ascending: false })
      .limit(200),
    supabase.from("order_items").select("order_id, product_name, size, quantity, unit_price_ils"),
    supabase
      .from("products")
      .select("id, name, price_ils, product_type, is_active, is_featured, category_id, sizes, image_url, shoe_tier, color, home_rank")
      .order("sort_order")
      .limit(1000),
    supabase.from("categories").select("id, slug, name, kind, sort_order, is_active, logo_url").order("sort_order"),
    supabase.from("site_settings").select("key, value"),
    supabase
      .from("customers")
      .select("id, full_name, phone, email, city, address, postal_code, notes, source, created_at")
      .order("created_at", { ascending: false })
      .limit(500),
    supabase
      .from("support_tickets")
      .select("id, kind, order_number, email, description, image_url, status, created_at")
      .order("created_at", { ascending: false })
      .limit(200),
    supabase
      .from("testimonials")
      .select("id, customer_name, message, reply, image_url, sort_order, is_active")
      .order("sort_order")
      .limit(100),
  ]);

  const settingsMap: Record<string, string> = {};
  for (const row of settings.data ?? []) settingsMap[row.key] = row.value ?? "";

  return {
    customers: customers.data ?? [],
    orders: orders.data ?? [],
    orderItems: items.data ?? [],
    products: products.data ?? [],
    categories: categories.data ?? [],
    settings: settingsMap,
    tickets: tickets.data ?? [],
    testimonials: testimonials.data ?? [],
  };
}
