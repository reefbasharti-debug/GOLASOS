import { createFileRoute, Link } from "@tanstack/react-router";
import { useCart } from "@/lib/cart";
import { imageUrl } from "@/lib/img";

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

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-bold">עגלת הקניות</h1>

      {items.length === 0 ? (
        <div className="mt-10 rounded-lg border bg-card p-10 text-center">
          <p className="text-muted-foreground">העגלה ריקה.</p>
          <Link to="/categories" className="mt-4 inline-block rounded-md surface-gold px-5 py-2 font-bold">
            לקטלוג המוצרים
          </Link>
        </div>
      ) : (
        <>
          <ul className="mt-6 space-y-3">
            {items.map((item) => (
              <li
                key={`${item.productId}-${item.size}`}
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
                  <p className="text-sm font-bold">{item.price} ₪</p>
                </div>
                <div className="flex items-center rounded-md border">
                  <button
                    className="px-2 py-1"
                    onClick={() => setQuantity(item.productId, item.size, item.quantity - 1)}
                    aria-label="הפחתת כמות"
                  >
                    −
                  </button>
                  <span className="w-8 text-center text-sm font-bold">{item.quantity}</span>
                  <button
                    className="px-2 py-1"
                    onClick={() => setQuantity(item.productId, item.size, item.quantity + 1)}
                    aria-label="הוספת כמות"
                  >
                    +
                  </button>
                </div>
                <button
                  onClick={() => remove(item.productId, item.size)}
                  className="text-xs font-semibold text-destructive"
                >
                  הסרה
                </button>
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-lg border bg-secondary p-5">
            <p className="text-lg font-bold">סה"כ: {total} ₪</p>
            <Link
              to="/checkout"
              className="rounded-md surface-gold px-6 py-3 text-sm font-bold shadow-md transition-transform hover:scale-[1.02]"
            >
              מעבר להזמנה
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
