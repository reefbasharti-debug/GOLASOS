import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  bulkSetPrice,
  claimAdmin,
  getAdminOverview,
  saveCategory,
  saveProduct,
  saveSettings,
  updateOrderStatus,
  updatePaymentStatus,
} from "@/lib/admin.functions";
import { CustomersTab, PAYMENT_LABEL, PaymentBadge } from "@/components/admin/CustomersTab";
import { imageUrl } from "@/lib/img";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const STATUS_LABEL: Record<string, string> = {
  new: "חדשה",
  contacted: "יצרנו קשר",
  paid: "שולמה",
  shipped: "נשלחה",
  done: "הושלמה",
  cancelled: "בוטלה",
};

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "ניהול האתר | גולאסוס" },
      { name: "description", content: "פאנל ניהול: מוצרים, קטגוריות, הזמנות והגדרות התראות." },
      { property: "og:title", content: "ניהול האתר | גולאסוס" },
      { property: "og:description", content: "אזור הניהול של חנות גולאסוס." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const navigate = useNavigate();
  const claim = useServerFn(claimAdmin);
  const load = useServerFn(getAdminOverview);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    claim({})
      .catch(() => undefined)
      .finally(() => setReady(true));
  }, [claim]);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["admin-overview", ready],
    queryFn: () => load({}),
    enabled: ready,
  });

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };

  if (isLoading || !ready) {
    return <p className="p-10 text-center text-muted-foreground">טוען נתוני ניהול...</p>;
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">אין הרשאת ניהול</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          החשבון המחובר אינו מוגדר כמנהל. יש להתחבר עם כתובת המייל של בעל האתר.
        </p>
        <button onClick={signOut} className="mt-6 rounded-md border px-5 py-2 font-semibold">
          התנתקות
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold">ניהול האתר</h1>
        <div className="flex gap-2">
          <Link to="/" className="rounded-md border px-4 py-2 text-sm font-semibold">
            לצפייה באתר
          </Link>
          <button onClick={signOut} className="rounded-md border px-4 py-2 text-sm font-semibold">
            התנתקות
          </button>
        </div>
      </div>

      <Tabs defaultValue="orders" className="mt-6">
        <TabsList>
          <TabsTrigger value="orders">הזמנות ({data.orders.length})</TabsTrigger>
          <TabsTrigger value="customers">לקוחות ({data.customers.length})</TabsTrigger>
          <TabsTrigger value="products">מוצרים ({data.products.length})</TabsTrigger>
          <TabsTrigger value="categories">קטגוריות ({data.categories.length})</TabsTrigger>
          <TabsTrigger value="settings">הגדרות והתראות</TabsTrigger>
        </TabsList>

        <TabsContent value="orders">
          <OrdersTab data={data} onChange={refetch} />
        </TabsContent>
        <TabsContent value="customers">
          <CustomersTab data={data} onChange={refetch} />
        </TabsContent>
        <TabsContent value="products">
          <ProductsTab data={data} onChange={refetch} />
        </TabsContent>
        <TabsContent value="categories">
          <CategoriesTab data={data} onChange={refetch} />
        </TabsContent>
        <TabsContent value="settings">
          <SettingsTab data={data} onChange={refetch} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

type Overview = Awaited<ReturnType<typeof getAdminOverview>>;

function OrdersTab({ data, onChange }: { data: Overview; onChange: () => void }) {
  const setStatus = useServerFn(updateOrderStatus);
  const setPayment = useServerFn(updatePaymentStatus);
  const [filter, setFilter] = useState<"all" | "unpaid" | "paid">("all");

  const updatePayment = async (id: string, payment_status: string) => {
    try {
      await setPayment({ data: { id, payment_status: payment_status as "paid" } });
      toast.success("סטטוס התשלום עודכן");
      onChange();
    } catch {
      toast.error("עדכון התשלום נכשל");
    }
  };

  const update = async (id: string, status: string) => {
    try {
      await setStatus({ data: { id, status: status as "new" } });
      toast.success("סטטוס עודכן");
      onChange();
    } catch {
      toast.error("עדכון הסטטוס נכשל");
    }
  };

  if (data.orders.length === 0) {
    return <p className="py-10 text-center text-muted-foreground">אין הזמנות עדיין.</p>;
  }

  const orders = data.orders.filter((o) => (filter === "all" ? true : o.payment_status === filter));

  return (
    <div className="mt-4 space-y-3">
      <div className="flex gap-2 text-sm">
        {(["all", "unpaid", "paid"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full border px-3 py-1 font-semibold ${filter === f ? "bg-primary text-primary-foreground" : ""}`}
          >
            {f === "all" ? "הכל" : PAYMENT_LABEL[f]}
          </button>
        ))}
      </div>
      {orders.map((order) => {
        const items = data.orderItems.filter((i) => i.order_id === order.id);
        return (
          <div key={order.id} className="rounded-lg border bg-card p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-bold">
                  הזמנה #{order.order_number} — {order.customer_name}
                </p>
                <p className="text-sm text-muted-foreground">
                  {order.phone}
                  {order.email ? ` · ${order.email}` : ""}
                  {order.city ? ` · ${order.city}` : ""}
                  {order.address ? ` · ${order.address}` : ""}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(order.created_at).toLocaleString("he-IL")}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <p className="font-extrabold">{Number(order.total_ils)} ₪</p>
                <PaymentBadge status={order.payment_status} />
                <select
                  aria-label="סטטוס תשלום"
                  value={order.payment_status}
                  onChange={(e) => updatePayment(order.id, e.target.value)}
                  className="rounded-md border bg-background px-2 py-1 text-sm"
                >
                  {Object.entries(PAYMENT_LABEL).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
                <select
                  aria-label="סטטוס הזמנה"
                  value={order.status}
                  onChange={(e) => update(order.id, e.target.value)}
                  className="rounded-md border bg-background px-2 py-1 text-sm"
                >
                  {Object.entries(STATUS_LABEL).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <ul className="mt-3 space-y-1 border-t pt-2 text-sm text-muted-foreground">
              {items.map((i, idx) => (
                <li key={idx}>
                  {i.product_name}
                  {i.size ? ` | מידה ${i.size}` : ""} × {i.quantity} — {Number(i.unit_price_ils)} ₪
                </li>
              ))}
            </ul>
            {order.notes ? <p className="mt-2 text-sm">הערות: {order.notes}</p> : null}
          </div>
        );
      })}
    </div>
  );
}

function ProductsTab({ data, onChange }: { data: Overview; onChange: () => void }) {
  const update = useServerFn(saveProduct);
  const bulk = useServerFn(bulkSetPrice);
  const [search, setSearch] = useState("");
  const [jerseyPrice, setJerseyPrice] = useState("65");
  const [tierPrices, setTierPrices] = useState<Record<"pro" | "semi" | "regular", string>>({ pro: "450", semi: "400", regular: "300" });

  const filtered = data.products
    .filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
    .slice(0, 200);

  const patch = async (id: string, values: Record<string, unknown>) => {
    try {
      await update({ data: { id, ...values } });
      toast.success("המוצר עודכן");
      onChange();
    } catch {
      toast.error("עדכון המוצר נכשל");
    }
  };

  const applyBulk = async (productType: "jersey" | "shoes", price: string, tier?: "pro" | "semi" | "regular") => {
    const value = Number(price);
    if (!Number.isFinite(value) || value < 0) {
      toast.error("מחיר לא תקין");
      return;
    }
    try {
      await bulk({ data: { productType, price: value, tier } });
      toast.success("המחירים עודכנו");
      onChange();
    } catch {
      toast.error("עדכון המחירים נכשל");
    }
  };

  return (
    <div className="mt-4">
      <div className="flex flex-wrap items-end gap-3 rounded-lg border bg-secondary p-4">
        <div>
          <label className="mb-1 block text-xs font-semibold">מחיר לכל החולצות</label>
          <input
            value={jerseyPrice}
            onChange={(e) => setJerseyPrice(e.target.value)}
            className="w-24 rounded-md border bg-background px-2 py-1"
          />
        </div>
        <button
          onClick={() => applyBulk("jersey", jerseyPrice)}
          className="rounded-md surface-gold px-4 py-2 text-sm font-bold"
        >
          עדכון חולצות
        </button>
        {(
          [
            ["pro", "נעליים מקצועיות"],
            ["semi", "נעליים חצי מקצועיות"],
            ["regular", "נעליים רגילות"],
          ] as const
        ).map(([tier, label]) => (
          <div key={tier} className="flex items-end gap-2">
            <div>
              <label className="mb-1 block text-xs font-semibold">{label}</label>
              <input
                value={tierPrices[tier]}
                onChange={(e) => setTierPrices((tp) => ({ ...tp, [tier]: e.target.value }))}
                className="w-24 rounded-md border bg-background px-2 py-1"
              />
            </div>
            <button onClick={() => applyBulk("shoes", tierPrices[tier], tier)} className="rounded-md surface-gold px-4 py-2 text-sm font-bold">
              עדכון
            </button>
          </div>
        ))}
      </div>

      <input
        placeholder="חיפוש מוצר..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mt-4 w-full rounded-md border px-3 py-2"
      />

      <div className="mt-4 space-y-2">
        {filtered.map((p) => (
          <div key={p.id} className="flex flex-wrap items-center gap-3 rounded-lg border bg-card p-3">
            <div className="size-14 shrink-0 overflow-hidden rounded bg-muted">
              {p.image_url ? (
                <img
                  src={imageUrl(p.image_url)}
                  alt={p.name}
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              ) : null}
            </div>
            <input
              defaultValue={p.name}
              onBlur={(e) => e.target.value !== p.name && patch(p.id, { name: e.target.value })}
              className="min-w-60 flex-1 rounded-md border px-2 py-1 text-sm"
            />
            <input
              type="number"
              defaultValue={Number(p.price_ils)}
              onBlur={(e) =>
                Number(e.target.value) !== Number(p.price_ils) &&
                patch(p.id, { price_ils: Number(e.target.value) })
              }
              className="w-24 rounded-md border px-2 py-1 text-sm"
            />
            {p.product_type === "shoes" ? (
              <>
                <select
                  defaultValue={p.shoe_tier ?? ""}
                  onChange={(e) => patch(p.id, { shoe_tier: e.target.value || null })}
                  className="rounded-md border px-2 py-1 text-sm"
                  title="רמת הנעל"
                >
                  <option value="">ללא רמה</option>
                  <option value="pro">מקצועית</option>
                  <option value="semi">חצי מקצועית</option>
                  <option value="regular">רגילה</option>
                </select>
                <input
                  defaultValue={p.color ?? ""}
                  placeholder="צבע"
                  onBlur={(e) => (e.target.value || null) !== (p.color ?? null) && patch(p.id, { color: e.target.value || null })}
                  className="w-20 rounded-md border px-2 py-1 text-sm"
                />
              </>
            ) : null}
            <input
              type="number"
              defaultValue={p.home_rank}
              title="עדיפות בדף הבית (גבוה = מוצג קודם)"
              onBlur={(e) => Number(e.target.value) !== p.home_rank && patch(p.id, { home_rank: Number(e.target.value) })}
              className="w-16 rounded-md border px-2 py-1 text-sm"
            />
            <label className="flex items-center gap-1 text-xs font-semibold">
              <input
                type="checkbox"
                defaultChecked={p.is_active}
                onChange={(e) => patch(p.id, { is_active: e.target.checked })}
              />
              פעיל
            </label>
            <label className="flex items-center gap-1 text-xs font-semibold">
              <input
                type="checkbox"
                defaultChecked={p.is_featured}
                onChange={(e) => patch(p.id, { is_featured: e.target.checked })}
              />
              מוצג בדף הבית
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}

function CategoriesTab({ data, onChange }: { data: Overview; onChange: () => void }) {
  const update = useServerFn(saveCategory);

  const patch = async (id: string, values: Record<string, unknown>) => {
    try {
      await update({ data: { id, ...values } });
      toast.success("הקטגוריה עודכנה");
      onChange();
    } catch {
      toast.error("עדכון הקטגוריה נכשל");
    }
  };

  return (
    <div className="mt-4 space-y-2">
      {data.categories.map((c) => (
        <div key={c.id} className="flex flex-wrap items-center gap-3 rounded-lg border bg-card p-3">
          <input
            defaultValue={c.name}
            onBlur={(e) => e.target.value !== c.name && patch(c.id, { name: e.target.value })}
            className="min-w-52 flex-1 rounded-md border px-2 py-1 text-sm"
          />
          <select
            defaultValue={c.kind}
            onChange={(e) => patch(c.id, { kind: e.target.value })}
            className="rounded-md border bg-background px-2 py-1 text-sm"
          >
            <option value="club">קבוצות מועדון</option>
            <option value="national">נבחרות לאומיות</option>
            <option value="retro">חולצות רטרו</option>
            <option value="shoes">נעלי כדורגל</option>
            <option value="mixed">קולקציות נוספות</option>
          </select>
          <input
            type="number"
            defaultValue={c.sort_order}
            onBlur={(e) =>
              Number(e.target.value) !== c.sort_order && patch(c.id, { sort_order: Number(e.target.value) })
            }
            className="w-20 rounded-md border px-2 py-1 text-sm"
          />
          <label className="flex items-center gap-1 text-xs font-semibold">
            <input
              type="checkbox"
              defaultChecked={c.is_active}
              onChange={(e) => patch(c.id, { is_active: e.target.checked })}
            />
            פעילה
          </label>
          <input
            defaultValue={c.logo_url ?? ""}
            placeholder="קישור ללוגו (אופציונלי)"
            dir="ltr"
            onBlur={(e) => e.target.value.trim() !== (c.logo_url ?? "") && patch(c.id, { logo_url: e.target.value.trim() || null })}
            className="min-w-52 flex-1 rounded-md border px-2 py-1 text-xs"
          />
          {c.logo_url ? <img src={c.logo_url} alt="" className="h-7 w-7 object-contain" /> : null}
          <span className="text-xs text-muted-foreground">/{c.slug}</span>
        </div>
      ))}
    </div>
  );
}

const SETTING_FIELDS: { key: string; label: string; hint?: string }[] = [
  { key: "telegram_chat_id", label: "מזהה צ'אט בטלגרם", hint: "שלחו /start לבוט @SoccerWebot וקבלו כאן התראות" },
  { key: "notify_email", label: "אימייל לקבלת הזמנות" },
  { key: "site_title", label: "שם האתר" },
  { key: "hero_title", label: "כותרת ראשית בדף הבית" },
  { key: "hero_subtitle", label: "תיאור בדף הבית" },
  { key: "whatsapp", label: "טלפון / וואטסאפ" },
  { key: "shipping_note", label: "הערת משלוח" },
  { key: "footer_text", label: "טקסט בפוטר" },
];

function SettingsTab({ data, onChange }: { data: Overview; onChange: () => void }) {
  const save = useServerFn(saveSettings);
  const [form, setForm] = useState<Record<string, string>>(data.settings);
  const [pending, setPending] = useState(false);

  const submit = async () => {
    setPending(true);
    try {
      await save({ data: { settings: form } });
      toast.success("ההגדרות נשמרו");
      onChange();
    } catch {
      toast.error("שמירת ההגדרות נכשלה");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="mt-4 max-w-2xl space-y-4 rounded-lg border bg-card p-5">
      {SETTING_FIELDS.map((f) => (
        <div key={f.key}>
          <label className="mb-1 block text-sm font-semibold">{f.label}</label>
          <input
            value={form[f.key] ?? ""}
            onChange={(e) => setForm((s) => ({ ...s, [f.key]: e.target.value }))}
            className="w-full rounded-md border px-3 py-2"
            maxLength={2000}
          />
          {f.hint ? <p className="mt-1 text-xs text-muted-foreground">{f.hint}</p> : null}
        </div>
      ))}
      <button
        onClick={submit}
        disabled={pending}
        className="rounded-md surface-gold px-6 py-2.5 font-bold disabled:opacity-60"
      >
        {pending ? "שומר..." : "שמירת הגדרות"}
      </button>
    </div>
  );
}
