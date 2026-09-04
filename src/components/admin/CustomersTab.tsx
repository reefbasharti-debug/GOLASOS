import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { deleteCustomer, saveCustomer, type getAdminOverview } from "@/lib/admin.functions";

type Overview = Awaited<ReturnType<typeof getAdminOverview>>;
type Customer = Overview["customers"][number];

const EMPTY = { full_name: "", phone: "", email: "", city: "", address: "", postal_code: "", notes: "" };
type FormState = typeof EMPTY;

export const PAYMENT_LABEL: Record<string, string> = {
  unpaid: "לא שולם",
  paid: "שולם",
  refunded: "הוחזר",
};

export const ORDER_STATUS_LABEL: Record<string, string> = {
  new: "חדשה",
  contacted: "יצרנו קשר",
  paid: "שולמה",
  shipped: "נשלחה",
  done: "הושלמה",
  cancelled: "בוטלה",
};

export function PaymentBadge({ status }: { status: string }) {
  const cls =
    status === "paid"
      ? "bg-success/15 text-success border-success/40"
      : status === "refunded"
        ? "bg-muted text-muted-foreground border-border"
        : "bg-destructive/10 text-destructive border-destructive/40";
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold ${cls}`}>
      {PAYMENT_LABEL[status] ?? status}
    </span>
  );
}

export function CustomersTab({ data, onChange }: { data: Overview; onChange: () => void }) {
  const save = useServerFn(saveCustomer);
  const remove = useServerFn(deleteCustomer);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const stats = useMemo(() => {
    const map = new Map<string, { count: number; total: number; paid: number; last: string }>();
    for (const o of data.orders) {
      if (!o.customer_id) continue;
      const s = map.get(o.customer_id) ?? { count: 0, total: 0, paid: 0, last: o.created_at };
      s.count += 1;
      s.total += Number(o.total_ils);
      if (o.payment_status === "paid") s.paid += Number(o.total_ils);
      if (o.created_at > s.last) s.last = o.created_at;
      map.set(o.customer_id, s);
    }
    return map;
  }, [data.orders]);

  const filtered = data.customers.filter((c) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return [c.full_name, c.phone, c.email ?? "", c.city ?? ""].some((v) => v.toLowerCase().includes(q));
  });

  const selected = data.customers.find((c) => c.id === selectedId) ?? null;
  const selectedOrders = selected ? data.orders.filter((o) => o.customer_id === selected.id) : [];

  const startNew = () => {
    setEditingId(null);
    setForm(EMPTY);
    setShowForm(true);
  };

  const startEdit = (c: Customer) => {
    setEditingId(c.id);
    setForm({
      full_name: c.full_name,
      phone: c.phone,
      email: c.email ?? "",
      city: c.city ?? "",
      address: c.address ?? "",
      postal_code: c.postal_code ?? "",
      notes: c.notes ?? "",
    });
    setShowForm(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true);
    try {
      const res = await save({ data: { ...form, id: editingId ?? undefined } });
      toast.success(editingId ? "פרטי הלקוח עודכנו" : "הלקוח נרשם בהצלחה");
      setShowForm(false);
      setSelectedId(res.id);
      onChange();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "השמירה נכשלה");
    } finally {
      setPending(false);
    }
  };

  const onDelete = async (c: Customer) => {
    if (!confirm(`למחוק את הלקוח ${c.full_name}? ההזמנות יישארו ללא שיוך.`)) return;
    try {
      await remove({ data: { id: c.id } });
      toast.success("הלקוח נמחק");
      if (selectedId === c.id) setSelectedId(null);
      onChange();
    } catch {
      toast.error("המחיקה נכשלה");
    }
  };

  const field = (key: keyof FormState, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div>
      <label className="mb-1 block text-sm font-semibold" htmlFor={`cust-${key}`}>
        {label}
        {props.required ? " *" : ""}
      </label>
      <input
        id={`cust-${key}`}
        value={form[key]}
        onChange={(e) => setForm((s) => ({ ...s, [key]: e.target.value }))}
        className="w-full rounded-md border bg-background px-3 py-2 text-sm"
        {...props}
      />
    </div>
  );

  return (
    <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1.2fr]">
      <section className="rounded-lg border bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-bold">לקוחות ({data.customers.length})</h2>
          <button onClick={startNew} className="btn-critical-sm rounded-md px-4 py-2 text-sm font-bold">
            + רישום לקוח חדש
          </button>
        </div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="חיפוש לפי שם, טלפון, אימייל או עיר"
          className="mt-3 w-full rounded-md border bg-background px-3 py-2 text-sm"
        />

        {showForm ? (
          <form onSubmit={submit} className="mt-4 space-y-3 rounded-lg border bg-background/60 p-4">
            <h3 className="font-bold">{editingId ? "עריכת לקוח" : "טופס רישום לקוח"}</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {field("full_name", "שם מלא", { required: true, minLength: 2, maxLength: 120 })}
              {field("phone", "טלפון", { required: true, type: "tel", dir: "ltr", minLength: 6, maxLength: 30 })}
              {field("email", "אימייל", { type: "email", dir: "ltr", maxLength: 200 })}
              {field("city", "עיר", { maxLength: 120 })}
              {field("address", "כתובת למשלוח", { maxLength: 300 })}
              {field("postal_code", "מיקוד", { dir: "ltr", maxLength: 20 })}
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold" htmlFor="cust-notes">
                הערות פנימיות
              </label>
              <textarea
                id="cust-notes"
                value={form.notes}
                onChange={(e) => setForm((s) => ({ ...s, notes: e.target.value }))}
                rows={3}
                maxLength={2000}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={pending} className="btn-critical rounded-md px-5 py-2 text-sm font-bold disabled:opacity-60">
                {pending ? "שומר..." : editingId ? "שמירת שינויים" : "רישום לקוח"}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="rounded-md border px-4 py-2 text-sm font-semibold">
                ביטול
              </button>
            </div>
          </form>
        ) : null}

        <ul className="mt-4 divide-y">
          {filtered.length === 0 ? (
            <li className="py-8 text-center text-sm text-muted-foreground">לא נמצאו לקוחות.</li>
          ) : null}
          {filtered.map((c) => {
            const s = stats.get(c.id);
            const active = c.id === selectedId;
            return (
              <li key={c.id}>
                <button
                  onClick={() => setSelectedId(c.id)}
                  className={`flex w-full items-center justify-between gap-3 px-2 py-3 text-start transition hover:bg-muted/60 ${active ? "bg-muted" : ""}`}
                >
                  <div className="min-w-0">
                    <p className="truncate font-bold">{c.full_name}</p>
                    <p className="truncate text-xs text-muted-foreground" dir="ltr">
                      {c.phone}
                      {c.email ? ` · ${c.email}` : ""}
                    </p>
                  </div>
                  <div className="shrink-0 text-end text-xs">
                    <p className="font-bold">{s?.count ?? 0} הזמנות</p>
                    <p className="text-muted-foreground">{Math.round(s?.total ?? 0)} ₪</p>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="rounded-lg border bg-card p-4">
        {!selected ? (
          <p className="py-16 text-center text-sm text-muted-foreground">בחרו לקוח מהרשימה כדי לראות את הפרטים וההזמנות שלו.</p>
        ) : (
          <>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold">{selected.full_name}</h2>
                <p className="text-sm text-muted-foreground" dir="ltr">
                  {selected.phone}
                  {selected.email ? ` · ${selected.email}` : ""}
                </p>
                <p className="text-sm text-muted-foreground">
                  {[selected.city, selected.address, selected.postal_code].filter(Boolean).join(", ") || "ללא כתובת"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  נרשם: {new Date(selected.created_at).toLocaleDateString("he-IL")} ·{" "}
                  {selected.source === "admin" ? "נרשם ידנית" : "הגיע מהזמנה באתר"}
                </p>
                {selected.notes ? <p className="mt-2 rounded-md bg-muted px-3 py-2 text-sm">{selected.notes}</p> : null}
              </div>
              <div className="flex gap-2">
                <button onClick={() => startEdit(selected)} className="rounded-md border px-3 py-1.5 text-sm font-semibold">
                  עריכה
                </button>
                <button onClick={() => onDelete(selected)} className="rounded-md border border-destructive/40 px-3 py-1.5 text-sm font-semibold text-destructive">
                  מחיקה
                </button>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <Stat label="הזמנות" value={String(stats.get(selected.id)?.count ?? 0)} />
              <Stat label="סה״כ הזמנות" value={`${Math.round(stats.get(selected.id)?.total ?? 0)} ₪`} />
              <Stat label="שולם בפועל" value={`${Math.round(stats.get(selected.id)?.paid ?? 0)} ₪`} />
            </div>

            <h3 className="mt-5 font-bold">היסטוריית הזמנות</h3>
            {selectedOrders.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">אין הזמנות ללקוח זה עדיין.</p>
            ) : (
              <ul className="mt-2 space-y-2">
                {selectedOrders.map((o) => {
                  const items = data.orderItems.filter((i) => i.order_id === o.id);
                  return (
                    <li key={o.id} className="rounded-md border p-3 text-sm">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-bold">
                          הזמנה #{o.order_number} · {new Date(o.created_at).toLocaleDateString("he-IL")}
                        </p>
                        <div className="flex items-center gap-2">
                          <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold">
                            {ORDER_STATUS_LABEL[o.status] ?? o.status}
                          </span>
                          <PaymentBadge status={o.payment_status} />
                          <span className="font-extrabold">{Number(o.total_ils)} ₪</span>
                        </div>
                      </div>
                      <ul className="mt-1 text-muted-foreground">
                        {items.map((i, idx) => (
                          <li key={idx}>
                            {i.product_name}
                            {i.size ? ` | ${i.size}` : ""} × {i.quantity}
                          </li>
                        ))}
                      </ul>
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-background p-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-base font-extrabold">{value}</p>
    </div>
  );
}
