import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

function makeCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 6; i += 1) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return `GOL${out}`;
}

/** Returns the customer profile, creating it (with a referral code) on first visit. */
export async function ensureProfile(
  supabase: SupabaseClient<Database>,
  userId: string,
  email: string,
  referredByCode?: string,
) {
  const { data: existing } = await supabase
    .from("profiles")
    .select("id, email, full_name, phone, referral_code, credit_ils, payment_pref")
    .eq("id", userId)
    .maybeSingle();
  if (existing) return existing;

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  let referredBy: string | null = null;
  const code = (referredByCode ?? "").trim().toUpperCase();
  if (code) {
    const { data: ref } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("referral_code", code)
      .maybeSingle();
    referredBy = ref?.id ?? null;
  }

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .insert({ id: userId, email, referral_code: makeCode(), referred_by: referredBy })
      .select("id, email, full_name, phone, referral_code, credit_ils, payment_pref")
      .single();
    if (!error && data) return data;
    if (error && error.code !== "23505") throw new Error(error.message);
  }
  throw new Error("יצירת הפרופיל נכשלה");
}

export async function loadAccount(supabase: SupabaseClient<Database>, userId: string, email: string) {
  const profile = await ensureProfile(supabase, userId, email);
  const [{ data: orders }, { data: referrals }] = await Promise.all([
    supabase
      .from("orders")
      .select("id, order_number, status, payment_status, total_ils, created_at, tracking_number, shipped_at, notes")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("referrals")
      .select("id, buyer_label, amount_ils, created_at")
      .eq("referrer_id", userId)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  const ids = (orders ?? []).map((o) => o.id);
  const { data: items } = ids.length
    ? await supabase
        .from("order_items")
        .select("order_id, product_name, size, quantity, unit_price_ils, version, custom_text")
        .in("order_id", ids)
    : { data: [] };

  return { profile, orders: orders ?? [], items: items ?? [], referrals: referrals ?? [] };
}

/** Looks up an order for the chatbot: order number + email must both match. */
export async function chatOrderStatus(orderNumber: number, email: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: order } = await supabaseAdmin
    .from("orders")
    .select("order_number, email, status, created_at, tracking_number, shipped_at")
    .eq("order_number", orderNumber)
    .maybeSingle();
  if (!order || (order.email ?? "").trim().toLowerCase() !== email.trim().toLowerCase()) return null;

  const created = new Date(order.created_at);
  const businessDays = countBusinessDays(created, new Date());
  const eta = new Date(created.getTime() + 30 * 86400000);
  return {
    orderNumber: order.order_number,
    status: order.status,
    tracking: order.tracking_number,
    businessDays,
    etaLabel: eta.toLocaleDateString("he-IL", { timeZone: "Asia/Jerusalem" }),
  };
}

function countBusinessDays(from: Date, to: Date): number {
  let days = 0;
  const cur = new Date(from);
  while (cur < to) {
    cur.setDate(cur.getDate() + 1);
    const d = cur.getDay();
    if (d !== 5 && d !== 6) days += 1;
  }
  return days;
}
