import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { ChevronDown, Copy, ShoppingCart, Truck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { getProduct } from "@/lib/store.functions";
import { imageUrl } from "@/lib/img";
import { useCart, PLAYER_VERSION_ILS, CUSTOM_PRINT_ILS } from "@/lib/cart";
import { useLang } from "@/lib/i18n";
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
  const { product, category, related, alsoLike } = Route.useLoaderData();
  const { add } = useCart();
  const { t } = useLang();
  const navigate = useNavigate();
  const p = product!;
  const images = [p.image_url, ...p.extra_images].filter(Boolean) as string[];
  const [img, setImg] = useState(0);
  const [size, setSize] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const [version, setVersion] = useState<"fan" | "player">("fan");
  const [customOn, setCustomOn] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customNumber, setCustomNumber] = useState("");
  const [detailOpen, setDetailOpen] = useState(true);

  const isApparel = p.product_type !== "shoes";
  const unitPrice = (custom: string) =>
    Number(p.price_ils) +
    (isApparel && version === "player" ? PLAYER_VERSION_ILS : 0) +
    (custom ? CUSTOM_PRINT_ILS : 0);

  const addToCart = (goToCart: boolean) => {
    if (p.sizes.length > 0 && !size) {
      toast.error(t("choose_size"));
      return;
    }
    const custom = customOn && (customName || customNumber) ? `${customName.trim()} ${customNumber.trim()}`.trim() : "";
    add({
      productId: p.id,
      name: p.name,
      image: p.image_url,
      price: unitPrice(custom),
      size,
      quantity,
      version,
      ...(custom ? { custom } : {}),
    });
    toast.success(t("added_to_cart"));
    if (goToCart) navigate({ to: "/cart" });
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success(t("link_copied"));
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-4">
      <nav className="text-sm text-muted-foreground">
        <Link to="/" className="hover:underline">{t("home")}</Link>
        {category?.group_name ? (
          <>
            {" > "}
            <Link to="/categories" hash={`g-${encodeURIComponent(category.group_name)}`} className="hover:underline">
              {category.group_name}
            </Link>
          </>
        ) : null}
        {category ? (
          <>
            {" > "}
            <Link to="/category/$slug" params={{ slug: category.slug }} className="hover:underline">
              {category.name}
            </Link>
          </>
        ) : null}
        {" > "}
        <span className="text-foreground">{p.name}</span>
      </nav>

      <div className="mt-5 grid gap-8 lg:grid-cols-[minmax(0,54%)_1fr]">
        {/* Gallery */}
        <div>
          <div className="aspect-square overflow-hidden bg-muted">
            {images[img] ? <img src={imageUrl(images[img])} alt={p.name} className="h-full w-full object-cover" /> : null}
          </div>
          {images.length > 1 ? (
            <div className="mt-3 grid grid-cols-4 gap-3 sm:grid-cols-5">
              {images.map((src, i) => (
                <button
                  key={src + i}
                  onClick={() => setImg(i)}
                  className={`aspect-square overflow-hidden border-2 ${i === img ? "border-foreground" : "border-transparent"}`}
                  aria-label={`${p.name} ${i + 1}`}
                >
                  <img src={imageUrl(src)} alt="" loading="lazy" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          ) : null}
        </div>

        {/* Buy box */}
        <div>
          <h1 className="text-2xl font-light md:text-3xl">{p.name}</h1>
          <p className="mt-3 text-2xl font-bold">
            ₪ {unitPrice(customOn && (customName || customNumber) ? "x" : "")}
          </p>

          <ul className="mt-5 space-y-2 border-y py-4 text-sm">
            <li className="flex items-center gap-2"><ShoppingCart className="size-4" /> {t("perk_1")}</li>
            <li className="flex items-center gap-2"><Truck className="size-4" /> {t("perk_2")}</li>
          </ul>

          {isApparel ? (
            <div className="mt-5">
              <p className="mb-2 text-sm">גרסה</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setVersion("fan")}
                  className={`border px-4 py-2 text-sm font-semibold transition-colors ${
                    version === "fan" ? "border-foreground bg-foreground text-background" : "hover:border-foreground"
                  }`}
                >
                  גרסת אוהד
                </button>
                <button
                  onClick={() => setVersion("player")}
                  className={`border px-4 py-2 text-sm font-semibold transition-colors ${
                    version === "player" ? "border-foreground bg-foreground text-background" : "hover:border-foreground"
                  }`}
                >
                  גרסת שחקן (+{PLAYER_VERSION_ILS} ₪)
                </button>
              </div>
            </div>
          ) : null}

          {p.sizes.length > 0 ? (
            <div className="mt-5">
              <p className="mb-2 text-sm">
                {t("size")}: <b>{size || "—"}</b>
              </p>
              <div className="flex flex-wrap gap-2">
                {p.sizes.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSize(s)}
                    className={`min-w-12 border px-3 py-2 text-sm font-semibold transition-colors ${
                      size === s ? "border-foreground bg-foreground text-background" : "hover:border-foreground"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {p.product_type !== "shoes" ? (
            <div className="mt-5 border p-3">
              <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold">
                <input type="checkbox" checked={customOn} onChange={(e) => setCustomOn(e.target.checked)} />
                {t("customize")} (+{CUSTOM_PRINT_ILS} ₪)
              </label>
              {customOn ? (
                <div className="mt-3 grid grid-cols-[1fr_6rem] gap-2">
                  <input
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value.slice(0, 14))}
                    placeholder={t("custom_name")}
                    className="h-9 border px-2 text-sm"
                  />
                  <input
                    value={customNumber}
                    onChange={(e) => setCustomNumber(e.target.value.replace(/\D/g, "").slice(0, 2))}
                    placeholder={t("custom_number")}
                    inputMode="numeric"
                    className="h-9 border px-2 text-sm"
                  />
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="mt-5 flex items-center gap-4 text-sm">
            <span>{t("quantity")}</span>
            <div className="flex items-center border">
              <button className="focus-key px-3 py-2.5" onClick={() => setQuantity((q) => Math.max(1, q - 1))} aria-label="-">−</button>
              <span className="w-10 text-center font-bold">{quantity}</span>
              <button className="focus-key px-3 py-2.5" onClick={() => setQuantity((q) => Math.min(20, q + 1))} aria-label="+">+</button>
            </div>
            <span className="text-muted-foreground">{t("in_stock")}</span>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <button
              onClick={() => addToCart(false)}
              className="btn-critical-ghost h-12 text-sm"
            >
              {t("add_to_cart")}
            </button>
            <button onClick={() => addToCart(true)} className="btn-critical h-12 rounded-md text-sm">
              {t("buy_now")}
            </button>
          </div>

          <button onClick={copyLink} className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
            <Copy className="size-3.5" /> {t("share")}: {t("copy_link")}
          </button>

          {related.length > 0 ? (
            <div className="mt-8">
              <p className="mb-2 text-sm">{t("similar_style")}</p>
              <div className="grid grid-cols-5 gap-2 sm:grid-cols-7">
                {related.slice(0, 28).map((r) => (
                  <Link key={r.id} to="/product/$id" params={{ id: r.id }} className="aspect-square overflow-hidden border hover:border-foreground" title={r.name}>
                    {r.image_url ? <img src={imageUrl(r.image_url)} alt={r.name} loading="lazy" className="h-full w-full object-cover" /> : null}
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Detail */}
      <section className="mt-12 border-t">
        <button onClick={() => setDetailOpen((v) => !v)} className="flex w-full items-center justify-between py-4 text-lg font-semibold">
          {t("detail")} <ChevronDown className={`size-5 transition-transform ${detailOpen ? "rotate-180" : ""}`} />
        </button>
        {detailOpen ? (
          <div className="grid gap-8 pb-8 md:grid-cols-2">
            <ul className="space-y-1.5 text-sm">
              <li><b>{t("product_name")}:</b> {p.name}</li>
              {p.supplier_model ? <li><b>{t("item_no")}:</b> <span dir="ltr">{p.supplier_model}</span></li> : null}
              {category ? (
                <li>
                  <b>{t("category")}:</b> {category.group_name ? `${category.group_name} > ` : ""}
                  <Link to="/category/$slug" params={{ slug: category.slug }} className="underline">{category.name}</Link>
                </li>
              ) : null}
              <li><b>{t("grade")}:</b> {t("grade_value")}</li>
              <li><b>{t("material")}:</b> {t("material_value")}</li>
              {p.product_type !== "shoes" ? <li><b>{t("customizable")}:</b> {t("customizable_value")}</li> : null}
              <li><b>{t("note")}:</b> {t("note_value")}</li>
            </ul>
            <div className="text-sm">
              {p.description ? <p className="whitespace-pre-line">{p.description}</p> : null}
              <p className="mt-3"><b>{t("service")}:</b> {t("service_value")}</p>
            </div>
          </div>
        ) : null}
      </section>

      <section className="mt-6 border-t pt-6">
        <h2 className="text-lg font-semibold">{t("customer_reviews")}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{t("no_reviews")}</p>
      </section>

      {alsoLike.length > 0 ? (
        <section className="mt-12">
          <h2 className="mb-6 text-center text-2xl font-light">{t("you_may_also_like")}</h2>
          <div className="grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-3 lg:grid-cols-5">
            {alsoLike.slice(0, 10).map((r) => (
              <ProductCard key={r.id} product={r} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
