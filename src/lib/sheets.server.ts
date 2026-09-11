// Server-only Google Sheets sync (orders out, tracking numbers back in).
// Requires the Google Sheets connector to be linked and a sheet id in site settings.

const GATEWAY = "https://connector-gateway.lovable.dev/google_sheets/v4";

/** English header, one row per ordered item. Columns A..S. */
const HEADER = [
  "Order #",
  "Order Date",
  "Customer Name",
  "Phone",
  "Email",
  "Full Address",
  "Item Image",
  "Product",
  "Size",
  "Version",
  "Custom Print",
  "Qty",
  "Unit Price (ILS)",
  "Line Total (ILS)",
  "Order Total (ILS)",
  "Tracking Number",
  "Carrier",
  "Status",
  "Agent Notes",
];

const RANGE = "A1:S1";
const READ_RANGE = "A2:S5000";
const COL_ORDER_NUMBER = 0;
const COL_TRACKING = 15;

const DEFAULT_SITE_URL = "https://project--2e58a4c6-5eec-44bc-ba03-a071cd205b5e.lovable.app";

function gatewayHeaders(): Record<string, string> | null {
  const lovableKey = process.env["LOVABLE_API_KEY"];
  const connKey = process.env["GOOGLE_SHEETS_API_KEY"];
  if (!lovableKey || !connKey) return null;
  return {
    Authorization: `Bearer ${lovableKey}`,
    "X-Connection-Api-Key": connKey,
    "content-type": "application/json",
  };
}

async function settings(): Promise<Record<string, string>> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin.from("site_settings").select("key, value");
  const out: Record<string, string> = {};
  for (const row of data ?? []) out[row.key] = (row.value ?? "").trim();
  return out;
}

/** Absolute, publicly reachable image URL so Google can render =IMAGE(). */
function absoluteImage(url: string | null | undefined, base: string): string {
  if (!url) return "";
  if (url.includes("yupoo.com")) return `${base}/api/public/img?u=${encodeURIComponent(url)}`;
  if (url.startsWith("http")) return url;
  return `${base}${url.startsWith("/") ? "" : "/"}${url}`;
}

export type SheetOrderItem = {
  productName: string;
  imageUrl: string | null;
  size: string | null;
  version: string | null;
  customText: string | null;
  quantity: number;
  unitPrice: number;
};

export type SheetOrderRow = {
  createdAt: string;
  orderNumber: number;
  customerName: string;
  phone: string;
  email: string;
  fullAddress: string;
  total: number;
  items: SheetOrderItem[];
};

async function ensureHeader(id: string, headers: Record<string, string>) {
  const res = await fetch(`${GATEWAY}/spreadsheets/${id}/values/${RANGE}`, { headers });
  if (!res.ok) return;
  const json = (await res.json()) as { values?: string[][] };
  if (json.values?.[0]?.length === HEADER.length) return;
  await fetch(`${GATEWAY}/spreadsheets/${id}/values/${RANGE}?valueInputOption=USER_ENTERED`, {
    method: "PUT",
    headers,
    body: JSON.stringify({ values: [HEADER] }),
  });
}

/** Appends one block of rows per order (one row per item + a blank separator). */
export async function appendOrderToSheet(row: SheetOrderRow): Promise<{ ok: boolean; detail: string }> {
  const headers = gatewayHeaders();
  if (!headers) return { ok: false, detail: "חיבור Google Sheets לא מוגדר" };
  const cfg = await settings();
  const id = cfg["sheet_id"] ?? "";
  if (!id) return { ok: false, detail: "לא הוגדר מזהה גוגל שיטס בהגדרות" };
  const base = (cfg["site_url"] || DEFAULT_SITE_URL).replace(/\/$/, "");

  try {
    await ensureHeader(id, headers);
    const date = new Date(row.createdAt).toLocaleString("en-GB", { timeZone: "Asia/Jerusalem" });

    const values: (string | number)[][] = row.items.map((item, i) => {
      const img = absoluteImage(item.imageUrl, base);
      return [
        row.orderNumber,
        i === 0 ? date : "",
        i === 0 ? row.customerName : "",
        i === 0 ? `'${row.phone}` : "",
        i === 0 ? row.email : "",
        i === 0 ? row.fullAddress : "",
        img ? `=IMAGE("${img}")` : "",
        item.productName,
        item.size ?? "",
        item.version === "player" ? "Player" : "Fan",
        item.customText ?? "",
        item.quantity,
        item.unitPrice,
        item.unitPrice * item.quantity,
        i === 0 ? row.total : "",
        "",
        "",
        i === 0 ? "New" : "",
        "",
      ];
    });
    // Blank row: full visual separation between orders.
    values.push(Array.from({ length: HEADER.length }, () => ""));

    const res = await fetch(`${GATEWAY}/spreadsheets/${id}/values/${RANGE}:append?valueInputOption=USER_ENTERED`, {
      method: "POST",
      headers,
      body: JSON.stringify({ values }),
    });
    if (!res.ok) {
      const body = await res.text();
      console.error(`[sheets] append failed [${res.status}]: ${body}`);
      return { ok: false, detail: `גוגל שיטס החזיר שגיאה ${res.status}` };
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin
      .from("orders")
      .update({ sheet_synced_at: new Date().toISOString() })
      .eq("order_number", row.orderNumber);
    return { ok: true, detail: "נוסף לגוגל שיטס" };
  } catch (e) {
    console.error("[sheets] append error", e);
    return { ok: false, detail: "שליחת ההזמנה לגוגל שיטס נכשלה" };
  }
}

/** Reads the sheet and copies tracking numbers back onto matching orders. */
export async function pullTrackingFromSheet(): Promise<{ ok: boolean; updated: number; detail: string }> {
  const headers = gatewayHeaders();
  if (!headers) return { ok: false, updated: 0, detail: "חיבור Google Sheets לא מוגדר" };
  const cfg = await settings();
  const id = cfg["sheet_id"] ?? "";
  if (!id) return { ok: false, updated: 0, detail: "לא הוגדר מזהה גוגל שיטס בהגדרות" };

  try {
    const res = await fetch(`${GATEWAY}/spreadsheets/${id}/values/${READ_RANGE}`, { headers });
    if (!res.ok) {
      const body = await res.text();
      console.error(`[sheets] read failed [${res.status}]: ${body}`);
      return { ok: false, updated: 0, detail: `גוגל שיטס החזיר שגיאה ${res.status}` };
    }
    const json = (await res.json()) as { values?: string[][] };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // One order can span several item rows; keep the first tracking number found.
    const byOrder = new Map<number, string>();
    for (const row of json.values ?? []) {
      const orderNumber = Number(row[COL_ORDER_NUMBER]);
      const tracking = (row[COL_TRACKING] ?? "").trim();
      if (!orderNumber || !tracking || byOrder.has(orderNumber)) continue;
      byOrder.set(orderNumber, tracking);
    }

    let updated = 0;
    for (const [orderNumber, tracking] of byOrder) {
      const { data: order } = await supabaseAdmin
        .from("orders")
        .select("id, tracking_number, status")
        .eq("order_number", orderNumber)
        .maybeSingle();
      if (!order || order.tracking_number === tracking) continue;
      const patch: { tracking_number: string; status?: string; shipped_at?: string } = {
        tracking_number: tracking,
      };
      if (order.status !== "delivered") {
        patch.status = "shipped";
        patch.shipped_at = new Date().toISOString();
      }
      await supabaseAdmin.from("orders").update(patch).eq("id", order.id);
      updated += 1;
    }
    return { ok: true, updated, detail: `עודכנו ${updated} מספרי מעקב` };
  } catch (e) {
    console.error("[sheets] pull error", e);
    return { ok: false, updated: 0, detail: "קריאת גוגל שיטס נכשלה" };
  }
}
