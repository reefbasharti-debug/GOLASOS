import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState, type FormEvent } from "react";
import { lookupOrder } from "@/lib/store.functions";
import { statusKey, useLang } from "@/lib/i18n";

export const Route = createFileRoute("/tracking")({
  head: () => ({
    meta: [
      { title: "מעקב הזמנה | גולאסוס" },
      { name: "description", content: "בדקו את סטטוס ההזמנה שלכם בגולאסוס לפי מספר הזמנה וטלפון." },
      { property: "og:title", content: "מעקב הזמנה | גולאסוס" },
      { property: "og:description", content: "מעקב אחר הזמנת חולצות ונעלי כדורגל." },
    ],
  }),
  component: TrackingPage,
});

type Result = Awaited<ReturnType<typeof lookupOrder>>;

function TrackingPage() {
  const { t, lang } = useLang();
  const lookup = useServerFn(lookupOrder);
  const [num, setNum] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const n = Number(num);
    if (!n || phone.trim().length < 6) return;
    setLoading(true);
    try {
      setResult(await lookup({ data: { orderNumber: n, phone } }));
    } finally {
      setLoading(false);
    }
  };

  const steps = ["new", "confirmed", "shipped", "delivered"];
  const idx = result?.order ? Math.max(0, steps.indexOf(result.order.status)) : -1;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-bold">{t("track_title")}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{t("track_hint")}</p>

      <form onSubmit={submit} className="mt-6 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
        <input value={num} onChange={(e) => setNum(e.target.value.replace(/\D/g, ""))} placeholder={t("order_number")} inputMode="numeric" className="h-11 border px-3 text-sm" />
        <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={t("phone")} inputMode="tel" className="h-11 border px-3 text-sm" dir="ltr" />
        <button disabled={loading} className="h-11 bg-primary px-6 text-sm font-bold text-primary-foreground disabled:opacity-60">
          {t("track_btn")}
        </button>
      </form>

      {result && !result.order ? <p className="mt-6 text-sm text-destructive">{t("track_not_found")}</p> : null}

      {result?.order ? (
        <div className="mt-8 border p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-bold">
              #{result.order.orderNumber} · {result.order.customerName}
            </p>
            <p className="text-sm text-muted-foreground">{new Date(result.order.createdAt).toLocaleDateString(lang === "he" ? "he-IL" : "en-GB")}</p>
          </div>

          {result.order.status === "cancelled" ? (
            <p className="mt-4 font-semibold text-destructive">{t("status_cancelled")}</p>
          ) : (
            <ol className="mt-6 grid grid-cols-4 gap-2 text-center text-xs">
              {steps.map((s, i) => (
                <li key={s} className="relative">
                  <span className={`mx-auto grid size-7 place-items-center rounded-full text-[11px] font-bold ${i <= idx ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"}`}>
                    {i + 1}
                  </span>
                  <p className={`mt-1.5 ${i <= idx ? "font-semibold" : "text-muted-foreground"}`}>{t(statusKey(s))}</p>
                </li>
              ))}
            </ol>
          )}

          <dl className="mt-6 grid gap-3 rounded-lg border bg-card p-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs font-semibold text-muted-foreground">מספר מעקב</dt>
              <dd className="font-bold" dir="ltr">
                {result.order.trackingNumber || "—"}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold text-muted-foreground">סטטוס ההזמנה</dt>
              <dd className="font-bold">{t(statusKey(result.order.status))}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold text-muted-foreground">מידות שנבחרו</dt>
              <dd className="font-bold">
                {result.items
                  .map((it) => it.size)
                  .filter(Boolean)
                  .join(", ") || "—"}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold text-muted-foreground">תאריך העברת התשלום</dt>
              <dd className="font-bold">
                {result.order.paidAt
                  ? new Date(result.order.paidAt).toLocaleString("he-IL", { timeZone: "Asia/Jerusalem" })
                  : "טרם שולם"}
              </dd>
            </div>
          </dl>

          <ul className="mt-6 divide-y text-sm">
            {result.items.map((it, i) => (
              <li key={i} className="flex justify-between py-2">
                <span>
                  {it.product_name}
                  {it.size ? ` · מידה ${it.size}` : ""}
                  {it.version === "player" ? " · גרסת שחקן" : ""}
                  {it.custom_text ? ` · הדפסה: ${it.custom_text}` : ""} × {it.quantity}
                </span>
                <span className="font-semibold">₪ {Number(it.unit_price_ils) * it.quantity}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-end font-bold">
            {t("total")}: ₪ {result.order.total}
          </p>
        </div>
      ) : null}
    </div>
  );
}
