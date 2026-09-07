// Server-only support-ticket handling for the customer-service chatbot.

export type TicketInput = {
  kind: "shipping_delay" | "damaged_item" | "product_request" | "misunderstood";
  orderNumber?: number | undefined;
  email?: string | undefined;
  description?: string | undefined;
  imageDataUrl?: string | undefined;
};

const KIND_LABEL: Record<TicketInput["kind"], string> = {
  shipping_delay: "עיכוב במשלוח",
  damaged_item: "פריט פגום / שגוי",
  product_request: "בקשה למוצר שאינו באתר",
  misunderstood: "פנייה שלא הובנה בצ'אט",
};

/** Stores the ticket and emails the service team (Resend), never throwing. */
export async function createTicket(input: TicketInput) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data: settingsRows } = await supabaseAdmin.from("site_settings").select("key, value");
  const settings: Record<string, string> = {};
  for (const r of settingsRows ?? []) settings[r.key] = r.value ?? "";
  const to = settings["support_email"] || "vamanage2@gmail.com";

  const { data: ticket } = await supabaseAdmin
    .from("support_tickets")
    .insert({
      kind: input.kind,
      order_number: input.orderNumber ?? null,
      email: input.email ?? null,
      description: input.description ?? null,
      image_url: input.imageDataUrl ? "attached-in-email" : null,
    })
    .select("id")
    .single();

  const lines = [
    `סוג פנייה: ${KIND_LABEL[input.kind]}`,
    input.orderNumber ? `מספר הזמנה: ${input.orderNumber}` : "",
    input.email ? `אימייל הלקוח: ${input.email}` : "",
    input.description ? `תיאור: ${input.description}` : "",
    `מזהה פנייה: ${ticket?.id ?? "-"}`,
    `נשלח: ${new Date().toLocaleString("he-IL", { timeZone: "Asia/Jerusalem" })}`,
  ].filter(Boolean);

  const apiKey = process.env["RESEND_API_KEY"];
  if (!apiKey) return { ok: true, emailed: false, detail: "הפנייה נשמרה (שירות המייל לא מוגדר)" };

  const attachment = parseDataUrl(input.imageDataUrl);
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
      body: JSON.stringify({
        from: "Golassos Support <onboarding@resend.dev>",
        to: [to],
        reply_to: input.email || undefined,
        subject: `🛎️ ${KIND_LABEL[input.kind]}${input.orderNumber ? ` — הזמנה #${input.orderNumber}` : ""}`,
        html: `<div dir="rtl" style="font-family:Arial,sans-serif;color:#1A2B48"><pre style="font-family:inherit;white-space:pre-wrap">${lines.join("\n")}</pre></div>`,
        attachments: attachment ? [attachment] : undefined,
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      console.error(`[support] Resend failed [${res.status}]: ${body}`);
      return { ok: true, emailed: false, detail: "הפנייה נשמרה, שליחת המייל נכשלה" };
    }
    return { ok: true, emailed: true, detail: "הפנייה נשלחה לצוות השירות" };
  } catch (e) {
    console.error("[support] email error", e);
    return { ok: true, emailed: false, detail: "הפנייה נשמרה, שליחת המייל נכשלה" };
  }
}

function parseDataUrl(dataUrl?: string): { filename: string; content: string } | null {
  if (!dataUrl?.startsWith("data:")) return null;
  const comma = dataUrl.indexOf(",");
  if (comma < 0) return null;
  const meta = dataUrl.slice(5, comma);
  const base64 = dataUrl.slice(comma + 1);
  if (!meta.includes("base64")) return null;
  const ext = meta.split(";")[0]?.split("/")[1] ?? "png";
  return { filename: `customer-upload.${ext}`, content: base64 };
}
