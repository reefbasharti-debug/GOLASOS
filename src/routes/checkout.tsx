import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { useCart } from "@/lib/cart";
import { submitOrder } from "@/lib/store.functions";

const formSchema = z.object({
  customerName: z.string().trim().min(2, "נא להזין שם מלא").max(80),
  phone: z
    .string()
    .trim()
    .regex(/^[0-9+\-\s]{8,20}$/, "נא להזין מספר טלפון תקין"),
  email: z.string().trim().email("נא להזין אימייל תקין").max(200).optional().or(z.literal("")),
  city: z.string().trim().max(80),
  address: z.string().trim().max(200),
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
  const [pending, setPending] = useState(false);
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


  const field = (key: keyof typeof form) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value })),
  });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      toast.error("העגלה ריקה");
      return;
    }
    const parsed = formSchema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "נא לבדוק את הפרטים");
      return;
    }

    setPending(true);
    try {
      const result = await send({
        data: {
          ...parsed.data,
          shipping,

            productId: i.productId,
            size: i.custom ? `${i.size} | ${i.custom}` : i.size,
            quantity: i.quantity,
          })),
        },
      });
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
        <form onSubmit={onSubmit} className="space-y-4 rounded-lg border bg-card p-5">
          <div>
            <label className="mb-1 block text-sm font-semibold">שם מלא *</label>
            <input {...field("customerName")} className="w-full rounded-md border px-3 py-2" maxLength={80} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-semibold">טלפון *</label>
              <input
                {...field("phone")}
                inputMode="tel"
                className="w-full rounded-md border px-3 py-2"
                maxLength={20}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold">אימייל</label>
              <input
                {...field("email")}
                type="email"
                className="w-full rounded-md border px-3 py-2"
                maxLength={200}
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-semibold">עיר</label>
              <input {...field("city")} className="w-full rounded-md border px-3 py-2" maxLength={80} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold">כתובת</label>
              <input {...field("address")} className="w-full rounded-md border px-3 py-2" maxLength={200} />
            </div>
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
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-md surface-gold px-6 py-3 font-bold shadow-md transition-transform hover:scale-[1.01] disabled:opacity-60"
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
              <li key={`${i.productId}-${i.size}`} className="flex justify-between gap-2">
                <span className="min-w-0 flex-1 truncate">
                  {i.name}
                  {i.size ? ` (${i.size})` : ""} × {i.quantity}
                </span>
                <span className="font-semibold">{i.price * i.quantity} ₪</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 border-t pt-3 text-lg font-bold">סה"כ: {total} ₪</p>
        </aside>
      </div>
    </div>
  );
}
