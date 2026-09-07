// Server-only Google Sheets sync (orders out, tracking numbers back in).
// Requires the Google Sheets connector to be linked and a sheet id in site settings.

const GATEWAY = "https://connector-gateway.lovable.dev/google_sheets/v4";

const HEADER = [
  "תאריך הזמנה",
  "מספר הזמנה",
  "מייל לקוח",
  'סה"כ תשלום',
  "מספר מוצרים",
  "מספר מעקב",
  "חברת שילוח",
  "סטטוס טיפול",
  "הערות נציג",
];

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

async function sheetId(): Promise<string> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("site_settings")
    .select("value")
    .eq("key", "sheet_id")
    .maybeSingle();
  return (data?.value ?? "").trim();
}

export type SheetOrderRow = {
  createdAt: string;
  orderNumber: number;
  email: string;
  total: number;
  itemCount: number;
};

async function ensureHeader(id: string, headers: Record<string, string>) {
  const res = await fetch(`${GATEWAY}/spreadsheets/${id}/values/A1:I1`, { headers });
  if (!res.ok) return;
  const json = (await res.json()) as { values?: string[][] };
  if (json.values?.[0]?.length) return;
  await fetch(`${GATEWAY}/spreadsheets/${id}/values/A1:I1?valueInputOption=USER_ENTERED`, {
    method: "PUT",
    headers,
    body: JSON.stringify({ values: [HEADER] }),
  });
}

/** Appends one order row. Never throws — a sheet problem must not fail checkout. */
export async function appendOrderToSheet(row: SheetOrderRow): Promise<{ ok: boolean; detail: string }> {
  const headers = gatewayHeaders();
  if (!headers) return { ok: false, detail: "חיבור Google Sheets לא מוגדר" };
  const id = await sheetId();
  if (!id) return { ok: false, detail: "לא הוגדר מזהה גוגל שיטס בהגדרות" };

  try {
    await ensureHeader(id, headers);
    const date = new Date(row.createdAt).toLocaleString("he-IL", { timeZone: "Asia/Jerusalem" });
    const res = await fetch(`${GATEWAY}/spreadsheets/${id}/values/A1:I1:append?valueInputOption=USER_ENTERED`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        values: [[date, row.orderNumber, row.email, row.total, row.itemCount, "", "", "", ""]],
      }),
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
  const id = await sheetId();
  if (!id) return { ok: false, updated: 0, detail: "לא הוגדר מזהה גוגל שיטס בהגדרות" };

  try {
    const res = await fetch(`${GATEWAY}/spreadsheets/${id}/values/A2:I5000`, { headers });
    if (!res.ok) {
      const body = await res.text();
      console.error(`[sheets] read failed [${res.status}]: ${body}`);
      return { ok: false, updated: 0, detail: `גוגל שיטס החזיר שגיאה ${res.status}` };
    }
    const json = (await res.json()) as { values?: string[][] };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    let updated = 0;
    for (const row of json.values ?? []) {
      const orderNumber = Number(row[1]);
      const tracking = (row[5] ?? "").trim();
      if (!orderNumber || !tracking) continue;
      const { data: order } = await supabaseAdmin
        .from("orders")
        .select("id, tracking_number, status")
        .eq("order_number", orderNumber)
        .maybeSingle();
      if (!order || order.tracking_number === tracking) continue;
      const patch: Record<string, string> = { tracking_number: tracking };
      if (order.status !== "delivered") {
        patch["status"] = "shipped";
        patch["shipped_at"] = new Date().toISOString();
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
