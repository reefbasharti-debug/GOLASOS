import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { deleteMyAccount, getAccount, saveProfile } from "@/lib/account.functions";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/account")({
  head: () => ({
    meta: [
      { title: "האזור האישי | גולאסוס" },
      { name: "description", content: "ההזמנות שלך, מספרי מעקב, פרטי חשבון ואפשרויות תשלום." },
      { property: "og:title", content: "האזור האישי | גולאסוס" },
      { property: "og:description", content: "מעקב הזמנות, עריכת פרטים ואפשרויות תשלום." },
    ],
  }),
  component: AccountPage,
});

const STATUS_LABEL: Record<string, string> = {
  new: "התקבלה",
  paid: "שולמה",
  processing: "בהכנה",
  shipped: "נשלחה",
  delivered: "נמסרה",
  cancelled: "בוטלה",
};

function AccountPage() {
  const fetchAccount = useServerFn(getAccount);
  const save = useServerFn(saveProfile);
  const removeAccount = useServerFn(deleteMyAccount);
  const qc = useQueryClient();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({ queryKey: ["account"], queryFn: () => fetchAccount() });

  const [form, setForm] = useState({ full_name: "", phone: "", payment_pref: "card" as const });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (data?.profile) {
      setForm({
        full_name: data.profile.full_name ?? "",
        phone: data.profile.phone ?? "",
        payment_pref: (data.profile.payment_pref ?? "card") as "card",
      });
      setEmail(data.profile.email ?? "");
    }
  }, [data]);

  const onSaveProfile = async () => {
    try {
      await save({ data: form });
      toast.success("הפרטים נשמרו");
      void qc.invalidateQueries({ queryKey: ["account"] });
    } catch {
      toast.error("שמירת הפרטים נכשלה");
    }
  };

  const onSaveLogin = async () => {
    const patch: { email?: string; password?: string } = {};
    if (email && email !== data?.profile.email) patch.email = email;
    if (password.length >= 6) patch.password = password;
    if (!patch.email && !patch.password) {
      toast.error("לא הוזן מייל חדש או סיסמה באורך 6 תווים לפחות");
      return;
    }
    const { error } = await supabase.auth.updateUser(patch);
    if (error) return toast.error(error.message);
    setPassword("");
    toast.success(patch.email ? "נשלח מייל לאישור הכתובת החדשה" : "הסיסמה עודכנה");
  };

  const onDelete = async () => {
    if (!window.confirm("למחוק את החשבון לצמיתות? הפעולה אינה ניתנת לשחזור.")) return;
    try {
      await removeAccount();
      await supabase.auth.signOut();
      toast.success("החשבון נמחק");
      navigate({ to: "/" });
    } catch {
      toast.error("מחיקת החשבון נכשלה");
    }
  };

  if (isLoading || !data) {
    return <div className="mx-auto max-w-4xl px-4 py-16 text-center text-muted-foreground">טוען...</div>;
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-bold">האזור האישי</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        זיכוי זמין: <b className="text-foreground">{Number(data.profile.credit_ils)} ₪</b> · קוד ההפניה שלך:{" "}
        <b className="text-foreground">{data.profile.referral_code}</b>{" "}
        <Link to="/affiliate" className="underline">
          לדף חבר מביא חבר
        </Link>
      </p>

      <section className="mt-8">
        <h2 className="text-lg font-bold">ההזמנות שלי</h2>
        {data.orders.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">עוד לא בוצעו הזמנות בחשבון הזה.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {data.orders.map((o) => {
              const items = data.items.filter((i) => i.order_id === o.id);
              return (
                <li key={o.id} className="rounded-xl border bg-card p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-bold">הזמנה #{o.order_number}</p>
                    <p className="text-sm">
                      {STATUS_LABEL[o.status] ?? o.status} ·{" "}
                      {o.payment_status === "paid" ? "שולם" : o.payment_status === "refunded" ? "הוחזר" : "ממתין לתשלום"}
                    </p>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {new Date(o.created_at).toLocaleString("he-IL", { timeZone: "Asia/Jerusalem" })}
                  </p>
                  <ul className="mt-2 space-y-0.5 text-sm">
                    {items.map((i, idx) => (
                      <li key={idx}>
                        {i.product_name}
                        {i.size ? ` · מידה ${i.size}` : ""}
                        {i.version === "player" ? " · גרסת שחקן" : ""}
                        {i.custom_text ? ` · הדפסה: ${i.custom_text}` : ""} × {i.quantity}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-sm">
                    <span>
                      מספר מעקב: <b>{o.tracking_number || "יעודכן בהמשך"}</b>
                    </span>
                    <span className="font-bold">{Number(o.total_ils)} ₪</span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="mt-10 grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border bg-card p-5">
          <h2 className="text-lg font-bold">פרטים אישיים</h2>
          <label className="mt-3 block text-sm font-semibold">
            שם מלא
            <input
              value={form.full_name}
              onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
              className="mt-1 h-10 w-full rounded-md border px-3 text-sm font-normal"
              maxLength={120}
            />
          </label>
          <label className="mt-3 block text-sm font-semibold">
            טלפון
            <input
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              inputMode="tel"
              className="mt-1 h-10 w-full rounded-md border px-3 text-sm font-normal"
              maxLength={30}
            />
          </label>
          <label className="mt-3 block text-sm font-semibold">
            אמצעי תשלום מועדף
            <select
              value={form.payment_pref}
              onChange={(e) => setForm((f) => ({ ...f, payment_pref: e.target.value as "card" }))}
              className="mt-1 h-10 w-full rounded-md border px-2 text-sm font-normal"
            >
              <option value="card">כרטיס אשראי</option>
              <option value="paypal">PayPal</option>
              <option value="applepay">Apple Pay</option>
              <option value="bit">ביט</option>
            </select>
          </label>
          <button onClick={onSaveProfile} className="btn-critical-sm focus-key mt-4">
            שמירת פרטים
          </button>
        </div>

        <div className="rounded-xl border bg-card p-5">
          <h2 className="text-lg font-bold">מייל וסיסמה</h2>
          <label className="mt-3 block text-sm font-semibold">
            אימייל
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              className="mt-1 h-10 w-full rounded-md border px-3 text-sm font-normal"
              maxLength={200}
            />
          </label>
          <label className="mt-3 block text-sm font-semibold">
            סיסמה חדשה
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              placeholder="לפחות 6 תווים"
              className="mt-1 h-10 w-full rounded-md border px-3 text-sm font-normal"
              maxLength={72}
            />
          </label>
          <button onClick={onSaveLogin} className="btn-critical-sm focus-key mt-4">
            עדכון פרטי כניסה
          </button>

          <div className="mt-6 border-t pt-4">
            <h3 className="text-sm font-bold text-destructive">מחיקת חשבון</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              מוחקת את הפרטים האישיים והחשבון. היסטוריית ההזמנות נשמרת ללא שיוך אישי.
            </p>
            <button
              onClick={onDelete}
              className="focus-key mt-3 rounded-md border border-destructive px-4 py-2 text-sm font-bold text-destructive hover:bg-destructive/10"
            >
              מחיקת החשבון שלי
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
