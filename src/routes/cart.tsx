import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { useCart, lineKey } from "@/lib/cart";
import { imageUrl } from "@/lib/img";
import { createShopifyCheckout } from "@/lib/shopify";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "עגלת הקניות | גולאסוס" },
      { name: "description", content: "בדקו את המוצרים בעגלה והמשיכו להזמנה באתר גולאסוס." },
      { property: "og:title", content: "עגלת הקניות | גולאסוס" },
      { property: "og:description", content: "סיימו את ההזמנה של חולצות ונעלי הכדורגל שלכם." },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const { items, total, remove, setQuantity } = useCart();
  const [paying, setPaying] = useState(false);

  const payNow = async () => {
    setPaying(true);
    try {
      const result = await createShopifyCheckout(items);
      if (result.ok) {
        window.open(result.checkoutUrl, "_blank");
        return;
      }
      if (result.reason === "unmapped") {
        toast.error("חלק מהמוצרים עדיין לא זמינים לתשלום מקוון", {
          description: "אפשר להשלים את ההזמנה בתיאום אישי בכפתור \"מעבר להזמנה\".",
        });
        return;
      }
      toast.error("התשלום המקוון לא זמין כרגע", { description: result.message });
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-bold">עגלת הקניות</h1>

      {items.length === 0 ? (
        <div className="mt-10 rounded-lg border bg-card p-10 text-center">
          <p className="text-muted-foreground">העגלה ריקה.</p>
          <Link to="/categories" className="btn-critical mt-4 inline-flex rounded-md px-5 py-3 font-bold">
            לקטלוג המוצרים
          </Link>
        </div>
      ) : (
        <>
          <ul className="mt-6 space-y-3">
            {items.map((item) => (
              <li
                key={lineKey(item)}
                className="flex items-center gap-4 rounded-lg border bg-card p-3"
              >
                <div className="size-20 shrink-0 overflow-hidden rounded bg-muted">
                  {item.image ? (
                    <img
                      src={imageUrl(item.image)}
                      alt={item.name}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{item.name}</p>
                  {item.size ? <p className="text-xs text-muted-foreground">מידה: {item.size}</p> : null}
                  {item.version === "player" ? (
                    <p className="text-xs text-muted-foreground">גרסת שחקן (+15 ₪)</p>
                  ) : null}
                  {item.custom ? <p className="text-xs text-muted-foreground">הדפסה: {item.custom} (+10 ₪)</p> : null}
                  <p className="text-sm font-bold">{item.price} ₪</p>
                </div>
                <div className="flex items-center rounded-md border">
                  <button
                    className="focus-key px-3 py-2"
                    onClick={() => setQuantity(lineKey(item), item.quantity - 1)}
                    aria-label="הפחתת כמות"
                  >
                    −
                  </button>
                  <span className="w-8 text-center text-sm font-bold">{item.quantity}</span>
                  <button
                    className="focus-key px-3 py-2"
                    onClick={() => setQuantity(lineKey(item), item.quantity + 1)}
                    aria-label="הוספת כמות"
                  >
                    +
                  </button>
                </div>
                <button
                  onClick={() => remove(lineKey(item))}
                  className="focus-key rounded px-2 py-2 text-xs font-semibold text-destructive"
                >
                  הסרה
                </button>
              </li>
            ))}
          </ul>

          <div className="mt-8 rounded-lg border bg-secondary p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <p className="text-lg font-bold">סה"כ: {total} ₪</p>
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  to="/checkout"
                  className="btn-critical-ghost focus-key inline-flex min-h-12 items-center rounded-md px-5 text-sm font-bold"
                >
                  מעבר להזמנה
                </Link>
                <button
                  type="button"
                  onClick={payNow}
                  disabled={paying}
                  className="btn-critical focus-key inline-flex min-h-12 items-center rounded-md px-6 text-sm font-extrabold disabled:opacity-60"
                >
                  {paying ? "רגע..." : "תשלום מאובטח"}
                </button>
              </div>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              תשלום מאובטח בכרטיס אשראי, PayPal ו-Apple Pay נפתח בחלון חדש.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
