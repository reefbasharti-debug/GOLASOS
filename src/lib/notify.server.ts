// Server-only notification helpers (Telegram + email).

export type OrderNotification = {
  kind?: "new" | "paid" | "test";
  orderNumber: number | string;
  customerName: string;
  phone: string;
  email?: string | null | undefined;
  city?: string | null | undefined;
  address?: string | null | undefined;
  notes?: string | null | undefined;
  total: number;
  paidAt?: string | null | undefined;
  items: { name: string; size?: string | null | undefined; quantity: number; price: number }[];
};

const TZ = "Asia/Jerusalem";

function fmtTime(iso?: string | null): string {
  const d = iso ? new Date(iso) : new Date();
  return d.toLocaleString("he-IL", { timeZone: TZ, dateStyle: "short", timeStyle: "medium" });
}

function subject(o: OrderNotification): string {
  if (o.kind === "paid") return `✅ הזמנה #${o.orderNumber} שולמה — גולאסוס`;
  if (o.kind === "test") return `🔔 בדיקת התראות — גולאסוס`;
  return `🛒 הזמנה חדשה באתר גולאסוס #${o.orderNumber}`;
}

function plainText(o: OrderNotification): string {
  const lines = [
    subject(o),
    o.kind === "paid" ? `זמן אישור התשלום: ${fmtTime(o.paidAt)}` : `זמן יצירה: ${fmtTime()}`,
    "",
    `שם: ${o.customerName}`,
    `טלפון: ${o.phone}`,
    o.email ? `אימייל: ${o.email}` : "",
    o.city ? `עיר: ${o.city}` : "",
    o.address ? `כתובת: ${o.address}` : "",
    o.notes ? `הערות: ${o.notes}` : "",
    "",
    "מוצרים:",
    ...o.items.map(
      (i) => `• ${i.name}${i.size ? ` | מידה ${i.size}` : ""} × ${i.quantity} — ${i.price * i.quantity} ₪`,
    ),
    "",
    o.kind === "paid" ? `סה"כ ששולם: ${o.total} ₪` : `סה"כ לתשלום: ${o.total} ₪`,
  ];
  return lines.filter(Boolean).join("\n");
}

export type NotifyResult = { channel: "telegram" | "email"; ok: boolean; detail: string };

export async function sendTelegramOrder(chatId: string, o: OrderNotification): Promise<NotifyResult> {
  const token = process.env["TELEGRAM_BOT_TOKEN"];
  if (!token) return { channel: "telegram", ok: false, detail: "חסר טוקן לבוט הטלגרם" };
  if (!chatId) return { channel: "telegram", ok: false, detail: "לא הוגדר מזהה צ'אט בטלגרם" };

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: plainText(o), disable_web_page_preview: true }),
    });
    if (!res.ok) {
      const body = await res.text();
      console.error(`[notify] Telegram failed [${res.status}]: ${body}`);
      return { channel: "telegram", ok: false, detail: `טלגרם החזיר שגיאה ${res.status}` };
    }
    return { channel: "telegram", ok: true, detail: "נשלח לטלגרם" };
  } catch (e) {
    console.error("[notify] Telegram error", e);
    return { channel: "telegram", ok: false, detail: "שליחה לטלגרם נכשלה" };
  }
}

export async function sendEmailOrder(to: string, o: OrderNotification): Promise<NotifyResult> {
  const apiKey = process.env["RESEND_API_KEY"];
  if (!apiKey) return { channel: "email", ok: false, detail: "חסר מפתח שירות המייל (RESEND_API_KEY)" };
  if (!to) return { channel: "email", ok: false, detail: "לא הוגדר אימייל לקבלת הזמנות" };

  const html = `<div dir="rtl" style="font-family:Arial,sans-serif;color:#1A2B48">
    <h2>${subject(o)}</h2>
    <pre style="font-family:inherit;white-space:pre-wrap">${plainText(o)}</pre>
  </div>`;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
      body: JSON.stringify({
        from: "Golassos <onboarding@resend.dev>",
        to: [to],
        subject: subject(o),
        html,
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      console.error(`[notify] Resend failed [${res.status}]: ${body}`);
      return { channel: "email", ok: false, detail: `שירות המייל החזיר שגיאה ${res.status}` };
    }
    return { channel: "email", ok: true, detail: "נשלח במייל" };
  } catch (e) {
    console.error("[notify] Resend error", e);
    return { channel: "email", ok: false, detail: "שליחת המייל נכשלה" };
  }
}

/** Send both channels; never throws. */
export async function broadcastOrder(
  settings: Record<string, string>,
  o: OrderNotification,
): Promise<NotifyResult[]> {
  return Promise.all([
    sendTelegramOrder(settings["telegram_chat_id"] ?? "", o),
    sendEmailOrder(settings["notify_email"] ?? "", o),
  ]);
}

/** Loads an order from the DB and sends the "paid" alert to Telegram + email. */
export async function notifyOrderPaid(orderId: string): Promise<NotifyResult[]> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const [{ data: order }, { data: items }, { data: settingsRows }] = await Promise.all([
    supabaseAdmin
      .from("orders")
      .select("order_number, customer_name, phone, email, city, address, notes, total_ils, paid_at")
      .eq("id", orderId)
      .maybeSingle(),
    supabaseAdmin.from("order_items").select("product_name, size, quantity, unit_price_ils").eq("order_id", orderId),
    supabaseAdmin.from("site_settings").select("key, value"),
  ]);
  if (!order) return [];
  const settings: Record<string, string> = {};
  for (const r of settingsRows ?? []) settings[r.key] = r.value ?? "";

  return broadcastOrder(settings, {
    kind: "paid",
    orderNumber: order.order_number,
    customerName: order.customer_name,
    phone: order.phone,
    email: order.email,
    city: order.city,
    address: order.address,
    notes: order.notes,
    total: Number(order.total_ils),
    paidAt: order.paid_at,
    items: (items ?? []).map((i) => ({
      name: i.product_name,
      size: i.size,
      quantity: i.quantity,
      price: Number(i.unit_price_ils),
    })),
  });
}

/** Lists chats that recently messaged the bot, so the owner can pick a chat id. */
export async function detectTelegramChats(): Promise<{ id: string; label: string }[]> {
  const token = process.env["TELEGRAM_BOT_TOKEN"];
  if (!token) return [];
  const res = await fetch(`https://api.telegram.org/bot${token}/getUpdates?limit=100`);
  if (!res.ok) return [];
  const json = (await res.json()) as {
    result?: { message?: { chat?: { id: number; type: string; title?: string; username?: string; first_name?: string } } }[];
  };
  const seen = new Map<string, string>();
  for (const u of json.result ?? []) {
    const c = u.message?.chat;
    if (!c) continue;
    const label = c.title ?? [c.first_name, c.username ? `@${c.username}` : ""].filter(Boolean).join(" ") ?? c.type;
    seen.set(String(c.id), label || c.type);
  }
  return [...seen].map(([id, label]) => ({ id, label }));
}
