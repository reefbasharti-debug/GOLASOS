import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import {
  deleteTestimonial,
  saveTestimonial,
  updateTicketStatus,
  type getAdminOverview,
} from "@/lib/admin.functions";

type Overview = Awaited<ReturnType<typeof getAdminOverview>>;

const TICKET_KIND: Record<string, string> = {
  damaged: "פריט פגום / שגוי",
  request: "בקשת מוצר",
  sizing: "ייעוץ מידות",
  other: "אחר",
};

const TICKET_STATUS: Record<string, string> = {
  open: "פתוח",
  in_progress: "בטיפול",
  closed: "טופל",
};

export function TicketsTab({ data, onChange }: { data: Overview; onChange: () => void }) {
  const setStatus = useServerFn(updateTicketStatus);

  if (data.tickets.length === 0) {
    return <p className="py-10 text-center text-muted-foreground">אין פניות שירות לקוחות.</p>;
  }

  const update = async (id: string, status: string) => {
    try {
      await setStatus({ data: { id, status: status as "open" } });
      toast.success("הסטטוס עודכן");
      onChange();
    } catch {
      toast.error("עדכון הסטטוס נכשל");
    }
  };

  return (
    <div className="mt-4 space-y-3">
      {data.tickets.map((t) => (
        <div key={t.id} className="rounded-lg border bg-card p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-bold">
                {TICKET_KIND[t.kind] ?? t.kind}
                {t.order_number ? ` — הזמנה #${t.order_number}` : ""}
              </p>
              <p className="text-sm text-muted-foreground">
                {t.email ?? "ללא אימייל"} · {new Date(t.created_at).toLocaleString("he-IL")}
              </p>
            </div>
            <select
              aria-label="סטטוס פנייה"
              value={t.status}
              onChange={(e) => update(t.id, e.target.value)}
              className="rounded-md border bg-background px-2 py-1 text-sm"
            >
              {Object.entries(TICKET_STATUS).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </div>
          {t.description ? <p className="mt-2 whitespace-pre-wrap text-sm">{t.description}</p> : null}
          {t.image_url ? (
            <p className="mt-1 text-xs text-muted-foreground">צורפה תמונה (נשלחה במייל התמיכה)</p>
          ) : null}
        </div>
      ))}
    </div>
  );
}

const EMPTY = { customer_name: "", message: "", reply: "", image_url: "", sort_order: "0" };

export function TestimonialsTab({ data, onChange }: { data: Overview; onChange: () => void }) {
  const save = useServerFn(saveTestimonial);
  const remove = useServerFn(deleteTestimonial);
  const [form, setForm] = useState({ ...EMPTY });
  const [editing, setEditing] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const submit = async () => {
    if (!form.customer_name.trim() || !form.message.trim()) {
      toast.error("נא למלא שם וטקסט המלצה");
      return;
    }
    setPending(true);
    try {
      await save({
        data: {
          ...(editing ? { id: editing } : {}),
          customer_name: form.customer_name.trim(),
          message: form.message.trim(),
          reply: form.reply.trim(),
          image_url: form.image_url.trim(),
          sort_order: Number(form.sort_order) || 0,
          is_active: true,
        },
      });
      toast.success("ההמלצה נשמרה");
      setForm({ ...EMPTY });
      setEditing(null);
      onChange();
    } catch {
      toast.error("שמירת ההמלצה נכשלה");
    } finally {
      setPending(false);
    }
  };

  const del = async (id: string) => {
    try {
      await remove({ data: { id } });
      toast.success("ההמלצה נמחקה");
      onChange();
    } catch {
      toast.error("מחיקה נכשלה");
    }
  };

  return (
    <div className="mt-4 grid gap-6 lg:grid-cols-[2fr_3fr]">
      <div className="space-y-3 rounded-lg border bg-card p-4">
        <h2 className="font-bold">{editing ? "עריכת המלצה" : "הוספת המלצה"}</h2>
        <input
          value={form.customer_name}
          onChange={(e) => setForm((f) => ({ ...f, customer_name: e.target.value }))}
          placeholder="שם הלקוח (לדוגמה רועי מ.)"
          className="w-full rounded-md border px-3 py-2"
          maxLength={80}
        />
        <textarea
          value={form.message}
          onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
          placeholder="ההודעה של הלקוח"
          rows={3}
          className="w-full rounded-md border px-3 py-2"
          maxLength={600}
        />
        <textarea
          value={form.reply}
          onChange={(e) => setForm((f) => ({ ...f, reply: e.target.value }))}
          placeholder="התשובה שלנו (רשות)"
          rows={2}
          className="w-full rounded-md border px-3 py-2"
          maxLength={600}
        />
        <input
          value={form.image_url}
          onChange={(e) => setForm((f) => ({ ...f, image_url: e.target.value }))}
          placeholder="קישור לצילום מסך של הצ'אט (רשות)"
          className="w-full rounded-md border px-3 py-2"
          maxLength={600}
        />
        <input
          value={form.sort_order}
          onChange={(e) => setForm((f) => ({ ...f, sort_order: e.target.value }))}
          placeholder="סדר הצגה"
          inputMode="numeric"
          className="w-full rounded-md border px-3 py-2"
        />
        <div className="flex gap-2">
          <button
            onClick={submit}
            disabled={pending}
            className="rounded-md surface-gold px-5 py-2 font-bold disabled:opacity-60"
          >
            {pending ? "שומר..." : "שמירה"}
          </button>
          {editing ? (
            <button
              onClick={() => {
                setEditing(null);
                setForm({ ...EMPTY });
              }}
              className="rounded-md border px-4 py-2 text-sm font-semibold"
            >
              ביטול
            </button>
          ) : null}
        </div>
      </div>

      <div className="space-y-3">
        {data.testimonials.length === 0 ? (
          <p className="py-10 text-center text-muted-foreground">אין המלצות. הוסיפו המלצות אמיתיות מלקוחות.</p>
        ) : (
          data.testimonials.map((t) => (
            <div key={t.id} className="rounded-lg border bg-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-bold">{t.customer_name}</p>
                  <p className="mt-1 text-sm">{t.message}</p>
                  {t.reply ? <p className="mt-1 text-sm text-muted-foreground">תשובה: {t.reply}</p> : null}
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    onClick={() => {
                      setEditing(t.id);
                      setForm({
                        customer_name: t.customer_name,
                        message: t.message,
                        reply: t.reply ?? "",
                        image_url: t.image_url ?? "",
                        sort_order: String(t.sort_order),
                      });
                    }}
                    className="rounded-md border px-3 py-1 text-sm font-semibold"
                  >
                    עריכה
                  </button>
                  <button onClick={() => del(t.id)} className="rounded-md border px-3 py-1 text-sm font-semibold">
                    מחיקה
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
