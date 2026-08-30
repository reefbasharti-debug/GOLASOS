// Server-only notification helpers (Telegram + email).

export type OrderNotification = {
  orderNumber: number | string;
  customerName: string;
  phone: string;
  email?: string | null;
  city?: string | null;
  address?: string | null;
  notes?: string | null;
  total: number;
  items: { name: string; size?: string | null; quantity: number; price: number }[];
};

function plainText(o: OrderNotification): string {
  const lines = [
    `הזמנה חדשה באתר גולאסוס #${o.orderNumber}`,
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
    `סה"כ לתשלום: ${o.total} ₪`,
  ];
  return lines.filter(Boolean).join("\n");
}

export async function sendTelegramOrder(chatId: string, o: OrderNotification): Promise<void> {
  const token = process.env["TELEGRAM_BOT_TOKEN"];
  if (!token || !chatId) {
    console.warn("[notify] Telegram skipped: missing bot token or chat id");
    return;
  }

  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text: plainText(o), disable_web_page_preview: true }),
  });

  if (!res.ok) {
    console.error(`[notify] Telegram failed [${res.status}]: ${await res.text()}`);
  }
}

export async function sendEmailOrder(to: string, o: OrderNotification): Promise<void> {
  const apiKey = process.env["RESEND_API_KEY"];
  if (!apiKey || !to) {
    console.warn("[notify] Email skipped: missing RESEND_API_KEY or recipient");
    return;
  }

  const html = `<div dir="rtl" style="font-family:Arial,sans-serif;color:#1A2B48">
    <h2>הזמנה חדשה #${o.orderNumber}</h2>
    <pre style="font-family:inherit;white-space:pre-wrap">${plainText(o)}</pre>
  </div>`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
    body: JSON.stringify({
      from: "Golassos <onboarding@resend.dev>",
      to: [to],
      subject: `הזמנה חדשה באתר גולאסוס #${o.orderNumber}`,
      html,
    }),
  });

  if (!res.ok) {
    console.error(`[notify] Resend failed [${res.status}]: ${await res.text()}`);
  }
}
