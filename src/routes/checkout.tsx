import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { useCart } from "@/lib/cart";
import { submitOrder, submitOrderAuthed } from "@/lib/store.functions";
import { getAccount } from "@/lib/account.functions";
import { supabase } from "@/integrations/supabase/client";

const formSchema = z.object({
  customerName: z.string().trim().min(2, "נא להזין שם מלא").max(80),
  phone: z
    .string()
    .trim()
    .regex(/^[0-9+\-\s]{8,20}$/, "נא להזין מספר טלפון תקין"),
  email: z.string().trim().email("נא להזין אימייל תקין").max(200).optional().or(z.literal("")),
  city: z.string().trim().min(2, "נא להזין עיר").max(80),
  address: z.string().trim().min(4, "נא להזין כתובת מלאה למשלוח").max(200),
  notes: z.string().trim().max(600),
});

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "סיום הזמנה | גולאסוס" },
      { name: "description", content: "השארת פרטים לסיום ההזמנה של חולצות ונעלי כדורגל." },
      { property: "og:title", content: "סיום הזמנה | גולאסוס" },
      { property: "og:description", content: "משאירים פרטים ואנחנו חוזרים אליכם לתשלום ומשלוח." },
    ],
  }),
  component: CheckoutPage,
});

function CheckoutPage() {
  const { items, total, clear } = useCart();
  const navigate = useNavigate();
  const send = useServerFn(submitOrder);
  const sendAuthed = useServerFn(submitOrderAuthed);
  const fetchAccount = useServerFn(getAccount);
  const [signedIn, setSignedIn] = useState(false);
  const [credit, setCredit] = useState(0);
  const [useCredit, setUseCredit] = useState(true);
  const [referral, setReferral] = useState("");
  const [pending, setPending] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [accepted, setAccepted] = useState(false);
  const [bot, setBot] = useState("");
  const [shipping, setShipping] = useState<"free" | "express">("free");
  const shippingCost = shipping === "express" ? 50 : 0;
  const [form, setForm] = useState({
    customerName: "",
    phone: "",
    email: "",
    city: "",
    address: "",
    notes: "",
  });


  useEffect(() => {
    setReferral(localStorage.getItem("golassos-ref") ?? "");
    void (async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) return;
      setSignedIn(true);
      try {
        const account = await fetchAccount();
        setCredit(Number(account.profile.credit_ils));
        setForm((f) => ({
          ...f,
          customerName: f.customerName || (account.profile.full_name ?? ""),
          phone: f.phone || (account.profile.phone ?? ""),
          email: f.email || (account.profile.email ?? ""),
        }));
      } catch {
        /* account details are optional here */
      }
    })();
  }, [fetchAccount]);

  const errorFor = (key: string) =>
    errors[key] ? (
      <p id={`checkout-${key}-error`} className="mt-1 text-xs font-semibold text-destructive">
        {errors[key]}
      </p>
    ) : null;

  const field = (key: keyof typeof form) => ({
    name: key,
    id: `checkout-${key}`,
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setErrors((prev) => (prev[key] ? { ...prev, [key]: "" } : prev));
      setForm((f) => ({ ...f, [key]: e.target.value }));
    },
    "aria-invalid": errors[key] ? true : undefined,
    "aria-describedby": errors[key] ? `checkout-${key}-error` : undefined,
  });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      toast.error("העגלה ריקה");
      return;
    }
    // Honeypot: hidden field only bots fill in.
    if (bot.trim()) return;
    const parsed = formSchema.safeParse(form);
    if (!parsed.success) {
      const map: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? "");
        if (key && !map[key]) map[key] = issue.message;
      }
      setErrors(map);
      toast.error(parsed.error.issues[0]?.message ?? "נא לבדוק את הפרטים");
      document.getElementById(`checkout-${Object.keys(map)[0]}`)?.focus();
      return;
    }
    setErrors({});
    if (!accepted) {
      toast.error("יש לאשר את התקנון ומדיניות הפרטיות");
      return;
    }

    setPending(true);
    try {
      const payload = {
        ...parsed.data,
        shipping,
        referralCode: referral,
        creditUsed: signedIn && useCredit ? creditApplied : 0,
        items: items.map((i) => ({
          productId: i.productId,
          size: i.size,
          quantity: i.quantity,
          version: i.version ?? ("fan" as const),
          ...(i.custom ? { custom: i.custom } : {}),
        })),
      };
      const result = signedIn ? await sendAuthed({ data: payload }) : await send({ data: payload });
      clear();
      toast.success(`ההזמנה נשלחה! מספר הזמנה ${result.orderNumber}`);
      navigate({ to: "/order-received", search: { n: String(result.orderNumber) } });
    } catch (error) {
      console.error(error);
      toast.error("שליחת ההזמנה נכשלה, נסו שוב");
    } finally {
      setPending(false);
    }
  };

  const creditApplied = Math.min(credit, total + shippingCost);

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold">אין מוצרים בעגלה</h1>
        <Link to="/categories" className="mt-4 inline-block rounded-md surface-gold px-5 py-2 font-bold">
          לקטלוג המוצרים
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-3xl font-bold">סיום הזמנה</h1>
      <div className="mt-6 grid gap-8 md:grid-cols-[3fr_2fr]">
        <form onSubmit={onSubmit} className="space-y-4 rounded-lg border bg-card p-5" noValidate>
          <input
            type="text"
            name="company_website"
            value={bot}
            onChange={(e) => setBot(e.target.value)}
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            className="hidden"
          />
          <div>
            <label htmlFor="checkout-customerName" className="mb-1 block text-sm font-semibold">שם מלא *</label>
            <input {...field("customerName")} required autoComplete="name" className="w-full rounded-md border px-3 py-2 focus-key" maxLength={80} />
            {errorFor("customerName")}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="checkout-phone" className="mb-1 block text-sm font-semibold">טלפון *</label>
              <input
                {...field("phone")}
                inputMode="tel"
                required
                autoComplete="tel"
                className="w-full rounded-md border px-3 py-2 focus-key"
                maxLength={20}
              />
              {errorFor("phone")}
            </div>
            <div>
              <label htmlFor="checkout-email" className="mb-1 block text-sm font-semibold">אימייל</label>
              <input
                {...field("email")}
                type="email"
                autoComplete="email"
                className="w-full rounded-md border px-3 py-2 focus-key"
                maxLength={200}
              />
              {errorFor("email")}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="checkout-city" className="mb-1 block text-sm font-semibold">עיר *</label>
              <input {...field("city")} required autoComplete="address-level2" className="w-full rounded-md border px-3 py-2 focus-key" maxLength={80} />
              {errorFor("city")}
            </div>
            <div>
              <label htmlFor="checkout-address" className="mb-1 block text-sm font-semibold">כתובת *</label>
              <input {...field("address")} required autoComplete="street-address" className="w-full rounded-md border px-3 py-2 focus-key" maxLength={200} />
              {errorFor("address")}
            </div>
          </div>
          <fieldset className="rounded-md border p-3">
            <legend className="px-1 text-sm font-semibold">אפשרות משלוח</legend>
            <label className="flex cursor-pointer items-start gap-3 rounded-md p-2 hover:bg-secondary">
              <input
                type="radio"
                name="shipping"
                className="mt-1"
                checked={shipping === "free"}
                onChange={() => setShipping("free")}
              />
              <span>
                <span className="block font-semibold">משלוח חינם — 0 ₪</span>
                <span className="block text-sm text-muted-foreground">זמן אספקה: עד 20 ימי עסקים</span>
              </span>
            </label>
            <label className="flex cursor-pointer items-start gap-3 rounded-md p-2 hover:bg-secondary">
              <input
                type="radio"
                name="shipping"
                className="mt-1"
                checked={shipping === "express"}
                onChange={() => setShipping("express")}
              />
              <span>
                <span className="block font-semibold">משלוח מהיר — תוספת 50 ₪</span>
                <span className="block text-sm text-muted-foreground">זמן אספקה: עד 10 ימי עסקים</span>
              </span>
            </label>
          </fieldset>
          {signedIn && credit > 0 ? (
            <label className="flex cursor-pointer items-center gap-2 rounded-md border p-3 text-sm font-semibold">
              <input type="checkbox" checked={useCredit} onChange={(e) => setUseCredit(e.target.checked)} />
              שימוש בזיכוי חבר מביא חבר ({creditApplied} ₪)
            </label>
          ) : null}

          <div>
            <label className="mb-1 block text-sm font-semibold">קוד חבר מביא חבר (רשות)</label>
            <input
              value={referral}
              onChange={(e) => setReferral(e.target.value.toUpperCase().slice(0, 20))}
              placeholder="לדוגמה GOLABC123"
              className="w-full rounded-md border px-3 py-2"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold">הערות להזמנה</label>
            <textarea
              {...field("notes")}
              rows={3}
              className="w-full rounded-md border px-3 py-2"
              maxLength={600}
            />
          </div>

          <label className="flex cursor-pointer items-start gap-2 rounded-md border p-3 text-xs leading-relaxed">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
              className="mt-0.5 size-4 focus-key"
              required
            />
            <span>
              קראתי ואני מאשר/ת את{" "}
              <Link to="/terms" className="font-semibold underline">התקנון ותנאי השימוש</Link>{" "}ואת{" "}
              <Link to="/privacy" className="font-semibold underline">מדיניות הפרטיות</Link>, כולל תנאי הביטול וההחזרות.
            </span>
          </label>

          <button
            type="submit"
            disabled={pending || !accepted}
            className="btn-critical focus-key w-full min-h-12 rounded-md px-6 py-3 font-bold disabled:opacity-60"
          >
            {pending ? "שולח..." : "שליחת ההזמנה"}
          </button>
          <p className="text-xs text-muted-foreground">
            התשלום מתבצע בשלב זה בתיאום אישי — נחזור אליכם מיד לאחר קבלת ההזמנה.
          </p>
        </form>

        <aside className="rounded-lg border bg-secondary p-5">
          <h2 className="text-lg font-bold">סיכום הזמנה</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {items.map((i) => (
              <li key={`${i.productId}-${i.size}-${i.version ?? "fan"}-${i.custom ?? ""}`} className="flex justify-between gap-2">
                <span className="min-w-0 flex-1 truncate">
                  {i.name}
                  {i.size ? ` (${i.size})` : ""} × {i.quantity}
                </span>
                <span className="font-semibold">{i.price * i.quantity} ₪</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 space-y-1 border-t pt-3 text-sm">
            <p className="flex justify-between">
              <span>מוצרים</span>
              <span>{total} ₪</span>
            </p>
            <p className="flex justify-between">
              <span>{shipping === "express" ? "משלוח מהיר (עד 10 ימי עסקים)" : "משלוח חינם (עד 20 ימי עסקים)"}</span>
              <span>{shippingCost ? `${shippingCost} ₪` : "חינם"}</span>
            </p>
          </div>
          {signedIn && useCredit && creditApplied > 0 ? (
            <p className="mt-1 flex justify-between text-sm">
              <span>זיכוי חבר מביא חבר</span>
              <span>-{creditApplied} ₪</span>
            </p>
          ) : null}
          <p className="mt-2 text-lg font-bold">
            סה"כ: {Math.max(0, total + shippingCost - (signedIn && useCredit ? creditApplied : 0))} ₪
          </p>

        </aside>
      </div>
    </div>
  );
}
