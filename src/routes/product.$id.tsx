import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { getProduct } from "@/lib/store.functions";
import { imageUrl } from "@/lib/img";
import { useCart } from "@/lib/cart";
import { ProductCard } from "@/components/ProductCard";

export const Route = createFileRoute("/product/$id")({
  loader: async ({ params }) => {
    const data = await getProduct({ data: { id: params.id } });
    if (!data.product) throw notFound();
    return data;
  },
  head: ({ loaderData }) => {
    if (!loaderData?.product) {
      return { meta: [{ title: "המוצר לא נמצא | גולאסוס" }, { name: "robots", content: "noindex" }] };
    }
    const title = `${loaderData.product.name} | גולאסוס`;
    const description = `${loaderData.product.name} — ${Number(loaderData.product.price_ils)} ₪, מידות ${loaderData.product.sizes.join(", ")}. הזמנה ישירה באתר.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
      ],
    };
  },
  component: ProductPage,
  notFoundComponent: () => (
    <div className="mx-auto max-w-3xl px-4 py-20 text-center">
      <h1 className="text-2xl font-bold">המוצר לא נמצא</h1>
      <Link to="/categories" className="mt-4 inline-block font-semibold text-muted-foreground">
        חזרה לקטלוג
      </Link>
    </div>
  ),
});

function ProductPage() {
  const { product, category, related } = Route.useLoaderData();
  const { add } = useCart();
  const navigate = useNavigate();
  const [size, setSize] = useState<string>(product!.sizes[0] ?? "");
  const [quantity, setQuantity] = useState(1);

  const p = product!;

  const addToCart = (goToCart: boolean) => {
    if (p.sizes.length > 0 && !size) {
      toast.error("יש לבחור מידה");
      return;
    }
    add({
      productId: p.id,
      name: p.name,
      image: p.image_url,
      price: Number(p.price_ils),
      size,
      quantity,
    });
    toast.success("המוצר נוסף לעגלה");
    if (goToCart) navigate({ to: "/cart" });
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <nav className="text-xs text-muted-foreground">
        <Link to="/">דף הבית</Link> /{" "}
        {category ? (
          <Link to="/category/$slug" params={{ slug: category.slug }}>
            {category.name}
          </Link>
        ) : (
          <Link to="/categories">קטלוג</Link>
        )}
      </nav>

      <div className="mt-4 grid gap-8 md:grid-cols-2">
        <div className="overflow-hidden rounded-lg border bg-muted">
          {p.image_url ? (
            <img src={imageUrl(p.image_url)} alt={p.name} className="aspect-square w-full object-cover" />
          ) : null}
        </div>

        <div>
          <h1 className="text-2xl font-bold md:text-3xl">{p.name}</h1>
          <p className="mt-3 text-3xl font-extrabold">{Number(p.price_ils)} ₪</p>
          {p.supplier_model ? (
            <p className="mt-2 text-xs text-muted-foreground">דגם: {p.supplier_model}</p>
          ) : null}

          {p.sizes.length > 0 ? (
            <div className="mt-6">
              <p className="mb-2 text-sm font-semibold">בחירת מידה</p>
              <div className="flex flex-wrap gap-2">
                {p.sizes.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSize(s)}
                    className={`min-w-12 rounded-md border px-3 py-2 text-sm font-semibold transition-colors ${
                      size === s ? "surface-navy" : "bg-card hover:bg-secondary"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div className="mt-6 flex items-center gap-3">
            <p className="text-sm font-semibold">כמות</p>
            <div className="flex items-center rounded-md border">
              <button
                className="px-3 py-2"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                aria-label="הפחתת כמות"
              >
                −
              </button>
              <span className="w-10 text-center text-sm font-bold">{quantity}</span>
              <button
                className="px-3 py-2"
                onClick={() => setQuantity((q) => Math.min(20, q + 1))}
                aria-label="הוספת כמות"
              >
                +
              </button>
            </div>
          </div>

          <div className="mt-7 flex flex-wrap gap-3">
            <button
              onClick={() => addToCart(true)}
              className="rounded-md surface-gold px-6 py-3 text-sm font-bold shadow-md transition-transform hover:scale-[1.02]"
            >
              קנה עכשיו
            </button>
            <button
              onClick={() => addToCart(false)}
              className="rounded-md border px-6 py-3 text-sm font-bold transition-colors hover:bg-secondary"
            >
              הוספה לעגלה
            </button>
          </div>

          {p.description ? (
            <p className="mt-8 whitespace-pre-line text-sm text-muted-foreground">{p.description}</p>
          ) : null}
        </div>
      </div>

      {related.length > 0 ? (
        <section className="mt-14">
          <h2 className="mb-4 text-xl font-bold">מוצרים דומים</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {related.map((r) => (
              <ProductCard key={r.id} product={r} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
